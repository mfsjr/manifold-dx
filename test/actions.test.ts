import {
  Action, ActionId, ArrayKeyGeneratorFn, ArrayKeyIndexMap, ArrayMutateAction,
  StateCrudAction
} from '../src/actions/actions';
import { State } from '../src/types/State';
import { Address, createAppTestState, createTestState, Name } from './testHarness';
import { createNameContainer } from './testHarness';
import { StateObject } from '../src/types/State';
import { ActionProcessorFunctionType } from '../src/types/ActionProcessor';
import * as _ from 'lodash';
import { onFailureDiff } from '../src/types/StateMutationDiagnostics';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';

const testState = createAppTestState();
let name: Name;
let nameState: Name & StateObject;
let bowlingScores: number[];
let address: Address;
let addressState: Address & StateObject;
let addressKeyFn = (addr: Address) => { return addr.street; };
let address2: Address = {
  street: '123 Mockingbird Lane',
  city: 'Springfield',
  state: 'Massachusetts',
  country: 'US',
  zip: '54321'
};

let resetTestObjects = () => {
  testState.reset(createTestState(), {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
  // nameState = State.createStateObject<Name>(testState.getState(), 'name', name);
  nameState = createNameContainer(name, testState.getState(), 'name');
  bowlingScores = [111, 121, 131];
  address = {street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  addressState = State.createStateObject<Address>(nameState, 'address', address);
  nameState.address = addressState;
  testState.getManager().getActionProcessorAPI().enableMutationChecking();
};

describe('Add the name container', () => {
  resetTestObjects();
  let appState = testState.getState();
  let insertNameAction = new StateCrudAction(ActionId.INSERT_STATE_OBJECT, appState, 'name', nameState);
  // true: console.log(`insertNameAction instanceof Action ${insertNameAction instanceof Action}`);
  test('state should contain the name container', () => {

    insertNameAction.perform();
    expect(appState.name).toBe(nameState);
    expect(nameState.middle).toEqual('F');
  });
  test('nameState\'s parent should be state container', () => {
    expect(nameState.__parent__).toBe(appState);
  });

  describe('Modify the name\'s middle initial', () => {
    let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    test('middle initial should be "J"', () => {
      // let appState = state.getState();
      updateMiddleAction.perform();
      // expect(appState.name).toBe(nameState);
      expect(nameState.middle).toEqual('J');
    });
    test('oldValue for the updateMiddleAction should be "F"', () => {
      expect(updateMiddleAction.oldValue).toEqual('F');
    });
  });

  describe('Remove the name prefix', () => {
    let prefixValue = nameState.prefix;
    let deletePrefixAction = new StateCrudAction(ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
    test('Delete the prefix property', () => {
      deletePrefixAction.perform();
      expect(nameState.prefix).toBeUndefined();
    });
    test('oldValue should be ' + prefixValue, () => {
      expect(deletePrefixAction.oldValue).toEqual(prefixValue);
    });
    test('Restore the name prefix by "undo" action', () => {
      deletePrefixAction.undo();
      expect(nameState.prefix).toEqual(prefixValue);
    });
  });

  describe('Array related actions', () => {
    test('bowling scores should be present', () => {
      let bowlingAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', bowlingScores);
      bowlingAction.perform();
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toBe(111);
    });
    test('array index notation should work', () => {
      let updateAction = new ArrayMutateAction(
          ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores',
          0, nameState.bowlingScores, 101);
      expect(updateAction.index).toBe(0);
      updateAction.perform();
      expect(bowlingScores[0]).toBe(101);
    });
  });

  describe('use CrudActionCreator', () => {
    // let actionCreator = nameState.__accessors__.actionCreator;
    let actionCreator = new CrudActionCreator(nameState);
    let last = nameState.last;
    // let updateAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'last', 'Doe');
    test('actionCreator update', () => {
      let updateAction = actionCreator.update('last', 'Doe');
      updateAction.perform();
      expect(nameState.last).toBe('Doe');
      // restore the last name, note the action is performed inline
      actionCreator.update('last', last).perform();
      expect(nameState.last).toBe(last);
    });
    test('actionCreator insert', () => {
      expect(nameState.suffix).toBeUndefined();
      let insertAction = actionCreator.insert('suffix', 'Jr');
      insertAction.perform();
      expect(nameState.suffix).toBe('Jr');

    });
    test('actionCreator remove (delete)', () => {
      let removeAction = actionCreator.remove('suffix');
      removeAction.perform();
      expect(nameState.suffix).toBeUndefined();
    });
  });

  describe('use ActionCreator for array changes in nameState.addresses', () => {
    // let streetKey: ArrayKeyGeneratorFn<Address> = a => a.street;
    let streetKeyFn: ArrayKeyGeneratorFn<Address> = nameState.__accessors__.addressKeyGen;
    let addrActionCreator = new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn);
    test('insert into the addresses array', () => {
      let addr: Address = {
        street: '6 Lily Pond Lane',
        city: 'Katonah',
        state: 'New York',
        zip: '12345'
      };
      let action = new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn).insert(0, addr);
      action.perform();
      expect(nameState.addresses[0]).toEqual(addr);
    });
    test('update an item in the addresses array', () => {
      let updatedAddr: Address = {...nameState.addresses[0], zip: '54321'};
      let action = addrActionCreator.update(0, updatedAddr);
      action.perform();
      expect(nameState.addresses[0].zip).toBe('54321');
    });
    test('add another address', () => {
      addrActionCreator.insert(1, address2).perform();
      expect(nameState.addresses[1]).toBe(address2);
    });
    test('delete an address', () => {
      addrActionCreator.remove(0).perform();
      expect(nameState.addresses.length).toBe(1);
      expect(nameState.addresses[0]).toBe(address2);
    });
  });

  describe('Verify StateMutationCheck', () => {
    // resetTestObjects();
    test('state should be defined', () => {
      expect(testState).toBeDefined();
    });
    test('initial state mutation checking is true', () => {
      expect(testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toEqual(true);
    });

    test('Mutations are not detected when checking is off', () => {
      testState.getManager().getActionProcessorAPI().disableMutationChecking();
      let middle = nameState.middle;
      nameState.middle = 'ZAX';
      if (!nameState.bowlingScores) {
        throw new Error('nameState.bowlingScores should be defined but is falsey');
      }

      let appendScore = new ArrayMutateAction(
          ActionId.INSERT_PROPERTY, nameState, 'bowlingScores',
          nameState.bowlingScores.length, nameState.bowlingScores, 299);
      expect(() => {testState.getManager().actionPerform(appendScore); }).not.toThrow();

      // restore the old middle
      nameState.middle = middle;
    });

    test('turn on mutationChecking', () => {
      testState.getManager().getActionProcessorAPI().enableMutationChecking();
      expect(testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toBe(true);
    });

    test('state mutations cause actions to throw when checking is on', () => {
      let middle = nameState.middle;
      nameState.middle = 'ZAX';
      if (!nameState.bowlingScores) {
        throw new Error('nameState.bowlingScores should be defined but is falsey');
      }

      let appendScore = new ArrayMutateAction(
          ActionId.INSERT_PROPERTY, nameState, 'bowlingScores',
          nameState.bowlingScores.length, nameState.bowlingScores, 299);
      expect(() => {testState.getManager().actionPerform(appendScore); }).toThrow();

      // restore the old middle
      nameState.middle = middle;
    });
    test('swapping out the StateMutationCheck onFailure function', () => {
      testState.getManager().getActionProcessorAPI().setMutationCheckOnFailureFunction(onFailureDiff);
      let fn = testState.getManager().getActionProcessorAPI().getMutationCheckOnFailureFunction();
      let processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
      processors.pre.push(testProcessor);
      // expect(fn(processors.pre, processors.post)).toContain('MUTATION');
      // let result = fn(processors.pre, processors.post);
      expect(() => {fn(processors.pre, processors.post); }).toThrow();
    });

    let testProcessor: ActionProcessorFunctionType = (actions: Action[]) => {return actions; };
    test('add processor to preProcess', () => {
      testState.getManager().getActionProcessorAPI().appendPreProcessor(testProcessor);
      let processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('add processor to postProcess', () => {
      testState.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
      let processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('remove processor from preProcess', () => {
      testState.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
      let processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBe(-1);
    });
    test('remove processor from postProcess', () => {
      testState.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
      let processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBe(-1);
    });
  });
});

describe('test stripping StateObject info', () => {

  test('stripping all StateObject properties from the object graph', () => {
    let stateClone = _.cloneDeep(testState.getState());
    State.stripStateObject(stateClone);
    expect(stateClone.hasOwnProperty('__parent__')).toBe(false);
    expect(stateClone.hasOwnProperty('__my_propname__')).toBe(false);
    if (!stateClone.name) {
      throw new Error('name is undefined');
    }
    expect(stateClone.name.hasOwnProperty('__parent__')).toBe(false);
    expect(stateClone.name.hasOwnProperty('__my_propname__')).toBe(false);
    if (!stateClone.name.address) {
      throw new Error('address is undefined');
    }
    expect(stateClone.name.address.hasOwnProperty('__my_propname__')).toBe(false);
    expect(stateClone.name.address.hasOwnProperty('__parent__')).toBe(false);
  });
});

describe('tests for ArrayKeyIndexMap', () => {
  let addresses: Array<Address> = [address];

  let names: Array<Name> = [name];
  let nameKeyFn = (n: Name) => {return `${n.last}, ${n.first} ${n.middle}`; };
  let maps = new ArrayKeyIndexMap();

  test('we should have one array in the map of maps', () => {
    maps.getOrCreateKeyIndexMap(addresses, addressKeyFn);
    expect(maps.size()).toBe(1);
  });

  test('we should have two arrays in the map of maps', () => {
    maps.getOrCreateKeyIndexMap(names, nameKeyFn);
    expect(maps.size()).toBe(2);
  });

  test('address key index map', () => {
    let keyIndexMap = maps.get(addresses);
    expect(keyIndexMap.get(address.street)).toBe(0);
  });

  test('delete addresses', () => {
    maps.deleteFromMaps(addresses);
    expect(maps.size()).toBe(1);
  });

  addresses = [
    address,
    address2
  ];

  test('put addresses back in', () => {
    maps.getOrCreateKeyIndexMap(addresses, addressKeyFn);
    expect(maps.get(addresses).get(addresses[1].street)).toBe(1);
  });

  test('has key', () => {
    expect(maps.hasKeyIndexMap(names)).toBe(true);
  });

  test('index functionality for names', () => {
    let nameKey = nameKeyFn(names[0]);
    expect(maps.get(names).get(nameKey)).toBe(0);
  });

  test('get key gen fn', () => {
    let keyGen = maps.getKeyGeneratorFn(addresses);
    expect(keyGen(address2)).toBe(address2.street);
  });

  test('exception should be thrown when creating an entry for an array where duplicate keys exist', () => {
    maps.deleteFromMaps(addresses);
    expect(maps.size()).toBe(1);
    addresses = [
      address,
      address2,
      address2
    ];
    expect(() => maps.getOrCreateKeyIndexMap(addresses, addressKeyFn)).toThrow();
  });

});

// describe('Tests for array action creator for array mutations', () => {
//   let actionCreator = new ArrayCrudActionCreator(nameState, name.addresses, nameState.__accessors__.addressKeyFn);
//   actionCreator.insert(0, address).perform();
//   test('address was inserted', () => {
//     expect(name.addresses[0]).toBe(address);
//   });
//
// });