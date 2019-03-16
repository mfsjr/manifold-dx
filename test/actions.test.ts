import {
  Action, ActionId, actionLogging, ActionLoggingObject, ArrayChangeAction,
  StateCrudAction
} from '../src/actions/actions';
import { Store } from '../src/types/Store';
import { Address, createTestStore, createTestState, Name, NameState } from './testHarness';
import { createNameContainer } from './testHarness';
import { StateObject } from '../src/types/Store';
import { ActionProcessorFunctionType } from '../src/types/ActionProcessor';
import * as _ from 'lodash';
import { onFailureDiff } from '../src/types/StateMutationDiagnostics';
import { getArrayActionCreator, getActionCreator } from '../src';
// import { getCrudCreator } from '../src';

const testStore = createTestStore();
let name: Name;
let nameState: NameState; // Name & StateObject;
let bowlingScores: number[];
let address: Address;
let addressState: Address & StateObject;
// let addressKeyFn = (addr: Address) => { return addr.street; };
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
  addressState = Store.convertAndAdd<Address>(nameState, 'address', address);
  nameState.address = addressState;
  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};

describe('Add the name container', () => {
  resetTestObjects();
  describe('Add the name', () => {
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
  });

  // describe('use CrudActionCreator\'s assignAll to assign multiple prop values from an object', () => {
  //
  //   let addresses = nameState.addresses;
  //   let _bowlingScores = nameState.bowlingScores;
  //   let _parent = nameState._parent;
  //   let _myPropname = nameState._myPropname;
  //
  //   let oldName: NameState = {...nameState};
  //
  //   let newName: NameState = {...nameState};
  //   newName.first = 'Ebenezer';
  //   newName.last = 'Scrooge';
  //   // newName.middle = undefined;
  //   newName.prefix = undefined; // 'Esq';
  //
  //   let actions = getActionCreator(nameState).assignAll(newName);
  //   testStore.dispatch(...actions);
  //   expect(nameState.first).toBe(newName.first);
  //   expect(nameState.prefix).toBeUndefined();
  //   expect(nameState.addresses).toBe(addresses);
  //   expect(nameState.bowlingScores).toBe(_bowlingScores);
  //   expect(nameState._parent).toBe(_parent);
  //   expect(nameState._myPropname).toBe(_myPropname);
  //
  //   actions = getActionCreator(nameState).assignAll(oldName);
  //   testStore.dispatch(...actions);
  //   expect(nameState.prefix).toBe(oldName.prefix);
  // });

  describe('Modify the name\'s middle initial', () => {
    // let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    let updateMiddleAction = nameState.getActionCreator(nameState).update('middle', 'J');
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
    // let deletePrefixAction = new StateCrudAction(ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
    let deletePrefixAction = getActionCreator(nameState).remove('prefix');
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
      new StateCrudAction(ActionId.DELETE_PROPERTY, nameState, 'bowlingScores', undefined).dispatch();
      let bowlingAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
      // testStore.getManager().actionPerform(bowlingAction);
      bowlingAction.dispatch();
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toBe(111);
    });
    test('array index notation should work', () => {
      let updateAction = getArrayActionCreator(nameState, nameState.bowlingScores).updateElement(0, 101);
      expect(updateAction.index).toBe(0);
      testStore.getManager().actionProcess(updateAction);
      expect(bowlingScores[0]).toBe(101);
    });
  });

  describe('use CrudActionCreator', () => {
    let crudCreator = nameState.getActionCreator(nameState);
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
    // let streetKeyFn: ArrayKeyGeneratorFn<Address> = nameState.addressKeyGen;
    let addrActionCreator = nameState.getAddressesActionCreator(nameState);
    test('insert into the addresses array', () => {
      let addr: Address = {
        id: 3,
        street: '6 Lily Pond Lane',
        city: 'Katonah',
        state: 'New York',
        zip: '12345'
      };

      let action = addrActionCreator.insertElement(0, addr);
      // action.perform();
      // testStore.getManager().actionProcess(...action);
      testStore.dispatch(...action);

      expect(nameState.addresses[0]).toEqual(addr);
    });
    test('update an item in the addresses array', () => {
      let updatedAddr: Address = {...nameState.addresses[0], zip: '54321'};
      let action = addrActionCreator.updateElement(0, updatedAddr);
      testStore.getManager().actionProcess(action);
      expect(nameState.addresses[0].zip).toBe('54321');
    });
    test('add another address', () => {
      let action = addrActionCreator.insertElement(1, address2);
      testStore.getManager().actionProcess(...action);
      expect(nameState.addresses[1]).toBe(address2);
    });
    test('delete an address', () => {
      let removeAction = addrActionCreator.removeElement(0);
      testStore.getManager().actionProcess(...removeAction);

      expect(nameState.addresses.length).toBe(1);
      expect(nameState.addresses[0]).toBe(address2);
    });
  });

  test('updating all array elements using addresses3 should update all the addresses in state', () => {
    let addresses3: Address[] = [
      {
        id: 10,
        city: 'Pawling',
        street: '4th',
        state: 'WY',
        zip: '93837',
        country: 'US'
      },
      {
        id: 11,
        city: 'Kingston',
        street: '5th',
        state: 'HI',
        zip: '13227',
        country: 'US'
      },
      {
        id: 12,
        city: 'Rome',
        street: '6th',
        state: 'CA',
        zip: '83227',
        country: 'US'
      }
    ];

    expect(nameState.addresses.length).toBe(1);
    let updateAllActions = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
    testStore.dispatch(...updateAllActions);
    // updateAllActions.forEach(action => action.dispatch());
    expect(addresses3.length).toBe(3);
    expect(nameState.addresses.length).toBe(3);
    addresses3.forEach((addr, index) => expect(nameState.addresses[index]).toBe(addresses3[index]));
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

      let appendScore = new ArrayChangeAction(
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

      let appendScore = new ArrayChangeAction(
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
    stateClone.helper = () => 'Help';
    Store.stripStateObject(stateClone);
    expect(stateClone.helper).toBeDefined();
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

    stateClone = _.cloneDeep(testStore.getState());
    stateClone.helper = () => 'Help';
    Store.stripStateObject(stateClone, true);
    expect(stateClone.helper).toBeUndefined();
  });
});

describe('updating a whole array', () => {
  test('array update api', () => {
    let oldScores = [...nameState.bowlingScores];
    let newScores = [...oldScores].reverse();
    getArrayActionCreator(nameState, bowlingScores).updateArray(newScores).dispatch();
    expect(newScores).toBe(nameState.bowlingScores);
  });
});

/**
 * The purpose of these tests is to identify how we can invoke TypeScript source code that can
 * replay actions.
 */
describe('get objects using path', () => {
  // get the street using the path
  let testState = testStore.getState();

  let newAddress = _.get(testState, 'name.address');
  let street = newAddress.street;
  let newStreet = '6 Genung Court';
  test('new and old streets do not match', () => {
    expect(street).not.toBe(newStreet);
  });
  getActionCreator(newAddress).remove('street').dispatch();
  getActionCreator(newAddress).insert('street', newStreet).dispatch();

  if (!testState || !testState.name || !testState.name.address) {
    throw new Error('testState.name.address must be defined');
  }
  let st: string = testState.name.address.street;
  test('newStreet is in state', () => {
    expect(st).toBe(newStreet);
  });
  // note that the action creator finds the property name for the given array in the parent
  let ra = _.get(nameState, 'addresses');
  // let creator = getArrayActionCreator(nameState, nameState.addresses);
  let creator = getArrayActionCreator(nameState, ra);

  testStore.dispatch(...creator.appendElement(newAddress));

  // other tests are mucking with nameState.addresses, so copy here for comparison
  let testAddress = { ...nameState.addresses[0] };
  test('addresses[0] should be newAddress', () => {
    expect(testAddress.city).toBe(newAddress.city);
    expect(testAddress.street).toBe(newAddress.street);
    expect(testAddress.zip).toBe(newAddress.zip);
  });
  testStore.dispatch(...creator.removeElement(0));
});

describe('actionLogging tests', () => {

  let logging: string[] = [];
  let loggerObject: ActionLoggingObject = actionLogging(logging, false);
  testStore.getManager().getActionProcessorAPI().appendPreProcessor(loggerObject.processor);

  test('updating all array elements using addresses3 should update all the addresses in state', () => {
    let addresses3: Address[] = [
      {
        id: 10,
        city: 'Pawling',
        street: '4th',
        state: 'WY',
        zip: '93837',
        country: 'US'
      },
      {
        id: 11,
        city: 'Kingston',
        street: '5th',
        state: 'HI',
        zip: '13227',
        country: 'US'
      },
      {
        id: 12,
        city: 'Rome',
        street: '6th',
        state: 'CA',
        zip: '83227',
        country: 'US'
      }
    ];
    let deleteActions: Action[] = [];
    deleteActions.splice(0, 0, ...getArrayActionCreator(nameState, nameState.addresses).removeElement(2));
    deleteActions.splice(deleteActions.length, 0,
      ...getArrayActionCreator(nameState, nameState.addresses).removeElement(1));

    expect(nameState.addresses.length).toBe(3);
    testStore.dispatch(...deleteActions);
    expect(nameState.addresses.length).toBe(1);

    expect(logging.length).toBeGreaterThan(0);
    let loggingLength = logging.length;

    let updateAllActions = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
    testStore.dispatch(...updateAllActions);

    // updateAllActions.forEach(action => action.dispatch());
    expect(addresses3.length).toBe(3);
    expect(nameState.addresses.length).toBe(3);
    addresses3.forEach((addr, index) => expect(nameState.addresses[index]).toBe(addresses3[index]));

    expect(loggerObject.logging).toBeTruthy();
    if (loggerObject.logging) {
      expect(loggerObject.logging.length).toBeGreaterThan(loggingLength);
    }

  });
});

describe('safe operations, updateIfChanged, insertIfEmpty, removeIfHasData', () => {
  test('property updateIfChanged', () => {
    let ns = testStore.getState().name;
    expect(ns).toBeTruthy();
    expect(ns === nameState).toBe(true);
    expect(nameState.middle).toBe('J');
    let nameActionCreator = getActionCreator(nameState);
    // update should throw if you try to update with the same value
    expect(() => nameActionCreator.update('middle', 'J').dispatch()).toThrow();
    // updateIfChanged should not...
    expect(() => nameActionCreator.updateIfChanged('middle', 'J').dispatch()).not.toThrow();
    // updateIfChanged should update if the value is changed...
    nameActionCreator.updateIfChanged('middle', 'Z').dispatch();
    expect(nameState.middle).toBe('Z');
  });
  test('array updateIfChanged', () => {
    // we need nameState.addresses to be populated
    expect(nameState.addresses.length > 0);
    const addr0 = nameState.addresses[0];
    const addressesActionCreator = getArrayActionCreator(nameState, nameState.addresses);
    expect(() => addressesActionCreator.updateElement(0, addr0).dispatch()).toThrow();
    expect(() => addressesActionCreator.updateElementIfChanged(0, addr0)).not.toThrow();
    let addr01 = {...addr0};
    addr01.id -= 10000;
    addr01.zip = '0';
    expect(() => addressesActionCreator.updateElementIfChanged(0, addr01).dispatch()).not.toThrow();
    expect(nameState.addresses[0] === addr01).toBe(true);
  });
  test('property insertDeleteIfHasData', () => {
    expect(nameState.middle.length > 0).toBe(true);
    let actionCreator = getActionCreator(nameState);
    actionCreator.removeIfHasData('middle').dispatch();
    expect( nameState.middle).toBeFalsy();
    expect(() => actionCreator.remove('middle').dispatch()).toThrow();
    expect( () => actionCreator.removeIfHasData('middle').dispatch()).not.toThrow();

  });
  // TODO: our insert method already fails to throw in there is data in the property!  Seems like we need to fix this
  test( 'property insertIfEmpty', () => {
    expect(nameState.middle).toBeFalsy();
    let actionCreator = getActionCreator(nameState);
    actionCreator.insertIfEmpty('middle', 'J').dispatch();
    expect(nameState.middle).toBeTruthy();
    expect(() => actionCreator.insertIfEmpty('middle', 'R').dispatch()).not.toThrow();
  });
});
