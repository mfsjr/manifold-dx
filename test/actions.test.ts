import {
  Action, ActionId, ArrayKeyGeneratorFn, ArrayKeyIndexMap, ArrayMutateAction,
  StateCrudAction
} from '../src/actions/actions';
import { Store } from '../src/types/State';
import { Address, createTestStore, createTestState, Name, NameState } from './testHarness';
import { createNameContainer } from './testHarness';
import { StateObject } from '../src/types/State';
import { ActionProcessorFunctionType } from '../src/types/ActionProcessor';
import * as _ from 'lodash';
import { onFailureDiff } from '../src/types/StateMutationDiagnostics';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';
// import { getCrudCreator } from '../src';

const testStore = createTestStore();
let name: Name;
let nameState: NameState; // Name & StateObject;
let bowlingScores: number[];
let address: Address;
let addressState: Address & StateObject;
let addressKeyFn = (addr: Address) => { return addr.street; };
let address2: Address = {
  id: 1,
  street: '123 Mockingbird Lane',
  city: 'Springfield',
  state: 'Massachusetts',
  country: 'US',
  zip: '54321'
};

let resetTestObjects = () => {
  testStore.reset(createTestState(), {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
  // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
  nameState = createNameContainer(name, testStore.getState(), 'name');
  bowlingScores = [111, 121, 131];
  address = {id: 2, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  addressState = Store.createStateObject<Address>(nameState, 'address', address);
  nameState.address = addressState;
  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};

describe('Add the name container', () => {
  resetTestObjects();
  let appState = testStore.getState();
  let insertNameAction = new StateCrudAction(ActionId.INSERT_STATE_OBJECT, appState, 'name', nameState);
  // true: console.log(`insertNameAction instanceof Action ${insertNameAction instanceof Action}`);
  test('state should contain the name container', () => {

    testStore.getManager().actionProcess(insertNameAction);
    expect(appState.name).toBe(nameState);
    expect(nameState.middle).toEqual('F');
  });
  test('nameState\'s parent should be state container', () => {
    expect(nameState._parent).toBe(appState);
  });

  describe('Modify the name\'s middle initial', () => {
    let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    test('middle initial should be "J"', () => {
      // let appState = state.getState();
      testStore.getManager().actionProcess(updateMiddleAction);
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
      testStore.getManager().actionProcess(deletePrefixAction);
      expect(nameState.prefix).toBeUndefined();
    });
    test('oldValue should be ' + prefixValue, () => {
      expect(deletePrefixAction.oldValue).toEqual(prefixValue);
    });
    test('Restore the name prefix by "undo" action', () => {
      // deletePrefixAction.undo();
      testStore.getManager().actionUndo(1);
      expect(nameState.prefix).toEqual(prefixValue);
    });
  });

  describe('Array related actions', () => {
    test('bowling scores should be present', () => {
      let bowlingAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', bowlingScores);
      // testStore.getManager().actionPerform(bowlingAction);
      bowlingAction.process();
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toBe(111);
    });
    test('array index notation should work', () => {
      let updateAction = new ArrayMutateAction(
          ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores',
          0, nameState.bowlingScores, 101);
      expect(updateAction.index).toBe(0);
      testStore.getManager().actionProcess(updateAction);
      expect(bowlingScores[0]).toBe(101);
    });
  });

  describe('use CrudActionCreator', () => {
    // let crudCreator = nameState._accessors.crudCreator;
    let crudCreator = new CrudActionCreator(nameState);
    let last = nameState.last;
    // let updateAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'last', 'Doe');
    test('crudCreator update', () => {
      let updateAction = crudCreator.update('last', 'Doe');
      testStore.getManager().actionProcess(updateAction);
      expect(nameState.last).toBe('Doe');
      // restore the last name, note the action is performed inline
      let updateLast = crudCreator.update('last', last);
      testStore.getManager().actionProcess(updateLast);
      expect(nameState.last).toBe(last);
    });
    test('crudCreator insert', () => {
      expect(nameState.suffix).toBeUndefined();
      let insertAction = crudCreator.insert('suffix', 'Jr');
      testStore.getManager().actionProcess(insertAction);
      expect(nameState.suffix).toBe('Jr');

    });
    test('crudCreator remove (delete)', () => {
      let removeAction = crudCreator.remove('suffix');
      testStore.getManager().actionProcess(removeAction);
      expect(nameState.suffix).toBeUndefined();
    });
  });

  describe('use ActionCreator for array changes in nameState.addresses', () => {
    let arrayKeyIndexMapSize = ArrayKeyIndexMap.get().size();
    let streetKeyFn: ArrayKeyGeneratorFn<Address> = nameState.addressKeyGen;
    let addrActionCreator = new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn);
    test('insert into the addresses array', () => {
      let addr: Address = {
        id: 3,
        street: '6 Lily Pond Lane',
        city: 'Katonah',
        state: 'New York',
        zip: '12345'
      };

      let action = addrActionCreator.insert(0, addr);
      // action.perform();
      testStore.getManager().actionProcess(action);

      expect(nameState.addresses[0]).toEqual(addr);
    });
    test('update an item in the addresses array', () => {
      let updatedAddr: Address = {...nameState.addresses[0], zip: '54321'};
      let action = addrActionCreator.update(updatedAddr);
      testStore.getManager().actionProcess(action);
      expect(nameState.addresses[0].zip).toBe('54321');
      // NOTE: this is a little complicated; we're testing that the size of they arrayKeyIndexMap has increased by
      // one, since the update will require it to be created for this array.
      expect(ArrayKeyIndexMap.get().size()).toBe(1 + arrayKeyIndexMapSize);
    });
    test('addresses is in KeyArrayIndexMap', () => {
      let before = ArrayKeyIndexMap.get().get(nameState.addresses);
      expect(before).toBeDefined();
    });
    test('add another address', () => {
      let action = addrActionCreator.insert(1, address2);
      testStore.getManager().actionProcess(action);
      expect(nameState.addresses[1]).toBe(address2);
    });
    test('delete an address', () => {
      // addrActionCreator.remove(0).perform();

      let removeAction = addrActionCreator.remove(nameState.addresses[0]);
      testStore.getManager().actionProcess(removeAction);

      expect(nameState.addresses.length).toBe(1);
      expect(nameState.addresses[0]).toBe(address2);
    });
    test('expect that deleting an address removes the array from KeyArrayIndexMap', () => {
      expect(ArrayKeyIndexMap.get().size()).toBe(arrayKeyIndexMapSize);
    });

    // test('delete \'addresses\' and verify that it is removed from KeyArrayIndexMap', () => {
    //   let crudCreator = getCrudCreator(nameState);
    //   crudCreator.remove('addresses').perform();
    //   let after = ArrayKeyIndexMap.get().get(nameState.addresses);
    //   expect(after).toBeUndefined();
    //
    //   // size of map returns to what it was before anything was done with the array
    //   // expect(ArrayKeyIndexMap.get().size()).toBe(arrayKeyIndexMapSize);
    // });
  });

  describe('Verify StateMutationCheck', () => {
    // resetTestObjects();
    test('state should be defined', () => {
      expect(testStore).toBeDefined();
    });
    test('initial state mutation checking is true', () => {
      expect(testStore.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toEqual(true);
    });

    test('Mutations are not detected when checking is off', () => {
      testStore.getManager().getActionProcessorAPI().disableMutationChecking();
      let middle = nameState.middle;
      nameState.middle = 'ZAX';
      if (!nameState.bowlingScores) {
        throw new Error('nameState.bowlingScores should be defined but is falsey');
      }

      let appendScore = new ArrayMutateAction(
          ActionId.INSERT_PROPERTY, nameState, 'bowlingScores',
          nameState.bowlingScores.length, nameState.bowlingScores, 299);
      expect(() => {testStore.getManager().actionProcess(appendScore); }).not.toThrow();

      // restore the old middle
      nameState.middle = middle;
    });

    test('turn on mutationChecking', () => {
      testStore.getManager().getActionProcessorAPI().enableMutationChecking();
      expect(testStore.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toBe(true);
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
      expect(() => {testStore.getManager().actionProcess(appendScore); }).toThrow();

      // restore the old middle
      nameState.middle = middle;
    });
    test('swapping out the StateMutationCheck onFailure function', () => {
      testStore.getManager().getActionProcessorAPI().setMutationCheckOnFailureFunction(onFailureDiff);
      let fn = testStore.getManager().getActionProcessorAPI().getMutationCheckOnFailureFunction();
      let processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
      processors.pre.push(testProcessor);
      // expect(fn(processors.pre, processors.post)).toContain('MUTATION');
      // let result = fn(processors.pre, processors.post);
      expect(() => {fn(processors.pre, processors.post); }).toThrow();
    });

    let testProcessor: ActionProcessorFunctionType = (actions: Action[]) => {return actions; };
    test('add processor to preProcess', () => {
      testStore.getManager().getActionProcessorAPI().appendPreProcessor(testProcessor);
      let processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('add processor to postProcess', () => {
      testStore.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
      let processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('remove processor from preProcess', () => {
      testStore.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
      let processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBe(-1);
    });
    test('remove processor from postProcess', () => {
      testStore.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
      let processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBe(-1);
    });
  });
});

describe('test stripping StateObject info', () => {

  test('stripping all StateObject properties from the object graph', () => {
    let stateClone = _.cloneDeep(testStore.getState());
    Store.stripStateObject(stateClone);
    expect(stateClone.hasOwnProperty('_parent')).toBe(false);
    expect(stateClone.hasOwnProperty('_myPropname')).toBe(false);
    if (!stateClone.name) {
      throw new Error('name is undefined');
    }
    expect(stateClone.name.hasOwnProperty('_parent')).toBe(false);
    expect(stateClone.name.hasOwnProperty('_myPropname')).toBe(false);
    if (!stateClone.name.address) {
      throw new Error('address is undefined');
    }
    expect(stateClone.name.address.hasOwnProperty('_myPropname')).toBe(false);
    expect(stateClone.name.address.hasOwnProperty('_parent')).toBe(false);
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