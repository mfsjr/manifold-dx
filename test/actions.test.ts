import {
  Action,
  actionDescription,
  ActionId,
  actionLogging,
  ActionLoggingObject,
  AnyMappingAction,
  ArrayChangeAction,
  ContainerPostReducer,
  StateCrudAction
} from '../src/actions/actions';
import { StateObject, Store } from '../src/types/Store';
import {
  Address,
  createNameContainer,
  createTestState,
  createTestStore,
  Name,
  NameState,
  TestState
} from './testHarness';
import { ActionProcessorFunctionType, DataTrigger } from '../src/types/ActionProcessor';
import * as _ from 'lodash';
import { onFailureDiff } from '../src/types/StateMutationDiagnostics';
import { ContainerComponent, getActionCreator, getArrayActionCreator, getMappingActionCreator } from '../src';
import { BowlerProps, ScoreCardProps } from './Components.test';
import * as React from 'react';
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

export class FakeAction extends Action {
  protected change(perform: boolean): void {
    this.pristine = false;
  }
  public clone(): Action {
    return this;
  }
  public dispatch(): void {
    this.pristine = false;
  }
  constructor(_actionType: ActionId) {
    super(_actionType);
  }
}

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

  describe('test empty action processing, eg if preProcessor removes all actions', () => {
    test('empty dispatch => empty processor', () => {
      expect(() => {testStore.dispatch(); } ).not.toThrow();
      expect(() => {testStore.getManager().actionProcess(); } ).not.toThrow();
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
    test('action description', () => {
      let description = actionDescription(updateMiddleAction);
      expect(description).toContain('StateCrudAction');
      expect(description).toContain('J');
      expect(description).toContain('name.middle');
    });

    test('middle initial should be "J"', () => {
      // let appState = state.getState();
      testStore.getManager().actionProcess(updateMiddleAction);
      // expect(appState.name).toBe(nameState);
      expect(nameState.middle).toEqual('J');
    });
    test('oldValue for the updateMiddleAction should be "F"', () => {
      expect(updateMiddleAction.oldValue).toEqual('F');
    });
    test('updateIfChanged to same value should not throw', () => {
      expect(() => {
        nameState.getActionCreator(nameState).updateIfChanged('middle', 'J').dispatch();
      }).not.toThrow();
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
    test('Delete the prefix property again, using a new action', () => {
      testStore.dispatch( getActionCreator(nameState).remove('prefix') );
      expect(nameState.prefix).toBeUndefined();
    });
    test( 'set undefined prefix property to be null', () => {
      const a = getActionCreator(nameState).set('prefix', null);
      testStore.dispatch(a);
      expect(nameState.prefix).toBeNull();
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

      const addresses4 = [addresses3[0], addresses3[1]];
      let updateAllActions2 = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses4);
      testStore.dispatch(...updateAllActions2);
      // updateAllActions.forEach(action => action.dispatch());
      expect(addresses4.length).toBe(2);
      expect(nameState.addresses.length).toBe(2);
      addresses4.forEach((addr, index) => expect(nameState.addresses[index]).toBe(addresses4[index]));

      let updateAllActions = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
      testStore.dispatch(...updateAllActions);
      // updateAllActions.forEach(action => action.dispatch());
      expect(addresses3.length).toBe(3);
      expect(nameState.addresses.length).toBe(3);
      addresses3.forEach((addr, index) => expect(nameState.addresses[index]).toBe(addresses3[index]));

      let addresses1 = [addresses3[1]];
      let updateAllActions1 = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses1);
      testStore.dispatch(...updateAllActions1);
      // updateAllActions.forEach(action => action.dispatch());
      expect(addresses1.length).toBe(1);
      expect(nameState.addresses.length).toBe(1);
      addresses1.forEach((addr, index) => expect(nameState.addresses[index]).toBe(addresses1[index]));

      // let updateAllActions = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
      updateAllActions = getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
      testStore.dispatch(...updateAllActions);

      expect(() => {
        getArrayActionCreator(undefined, undefined).replaceAll(addresses3);
      }).toThrow();
    });
  });
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
        throw new Error('nameState.bowlingScores should be defined but is falsy');
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
        throw new Error('nameState.bowlingScores should be defined but is falsy');
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

  let logging2: string[] = [];
  let loggerObject2: ActionLoggingObject = actionLogging(logging2, true);
  testStore.getManager().getActionProcessorAPI().appendPreProcessor(loggerObject2.processor);

  // let consoleLogMock = console.log;

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
    expect(logging2.length).toBe(loggingLength);

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

describe('safe operations, updateIfChanged, insertIfEmpty, removeIfHasData, and set', () => {
  let testState = testStore.getState();
  beforeEach(() => {
    testState = testStore.getState();
    testState._parent = null;
    testState._myPropname = '';
  });
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
    expect(nameState.middle && nameState.middle.length > 0).toBe(true);
    let actionCreator = getActionCreator(nameState);
    actionCreator.set('middle', undefined).dispatch();
    expect( nameState.middle).toBeFalsy();
    expect(() => actionCreator.remove('middle').dispatch()).toThrow();
    expect( () => actionCreator.set('middle', undefined).dispatch()).not.toThrow();

  });
  test( 'property insertIfEmpty', () => {
    expect(nameState.middle).toBeFalsy();
    let actionCreator = getActionCreator(nameState);
    actionCreator.insertIfEmpty('middle', 'J').dispatch();
    expect(nameState.middle).toBeTruthy();
    expect(() => actionCreator.insert('middle', 'R').dispatch()).toThrow();
    expect(() => actionCreator.insertIfEmpty('middle', 'R').dispatch()).not.toThrow();
  });

  test( 'property set', () => {
    expect(nameState.suffix).toBeFalsy();
    expect(nameState.middle).toBe('J');
    const actionCreator = getActionCreator(nameState);
    actionCreator.set('middle', 'Z').dispatch();
    expect(nameState.middle).toBe('Z');
    actionCreator.set('middle', '').dispatch();
    expect(nameState.middle).toBeFalsy();
    actionCreator.set('middle', 'R').dispatch();
    expect(nameState.middle).toBe('R');
    expect(() => actionCreator.set('middle', 'R').dispatch()).not.toThrow();
  });

  test( 'data triggers, concurrent dispatch and dispatchNext', () => {
    const actionCreator = getActionCreator(nameState);
    expect(nameState.suffix).toBeFalsy();
    expect(nameState.middle).toBe('R');
    const first = nameState.first;

    const triggerHit: DataTrigger = action => {
      const propName: keyof typeof action.parent = 'middle';
      if (action.parent === nameState && action.propertyName === propName) {
        actionCreator.set('suffix', action.value).dispatch();
      }
    };
    const triggerMiss: DataTrigger = action => {
      const propName: keyof typeof action.parent = 'prefix';
      if (action.parent === nameState && action.propertyName === propName) {
        actionCreator.set('first', action.value).dispatch();
      }
    };
    const triggerProcessor = testStore.getManager().getActionProcessorAPI()
      .createDataTriggerProcessor([triggerHit, triggerMiss]);
    testStore.getManager().getActionProcessorAPI().appendPostProcessor(triggerProcessor);

    const preSuffix = nameState.suffix;
    const lastDeferredDispatchCount = testStore.deferredDispatchCount;
    actionCreator.set('middle', 'Z').dispatch();
    expect(nameState.middle).toBe('Z');
    // trigger has not executed yet, its execution has been deferred, this will be checked below in setTimeout
    expect(nameState.suffix).toBe(preSuffix);
    expect(testStore.deferredDispatchCount).toBe(1 + lastDeferredDispatchCount);
    /**
     * Note that the middle name change is triggering a suffix dispatch during its dispatch, so testing triggers
     * is also testing concurrent dispatch handling; ie dispatchNext and its implementation, putting concurrent
     * actions on a zero setTimeout to be executed 'next'.
     *
     * This can be observice in a
     * see {@link Manager#dispatch} and {@link Manager#dispatchNext}.
     */
    function testExpect(): void {
      // triggerHit should have executed
      expect(nameState.suffix).toBe(nameState.middle);
      // triggerMiss should not have
      expect(nameState.first).toBe(first);

      actionCreator.set('middle', '').dispatch();
      expect(nameState.middle).toBeFalsy();
      expect(nameState.suffix).toBe(nameState.middle);
      expect(nameState.first).toBe(first);
      // NOTE that where these were equal before setTimeout above, they are different now
      expect(nameState.suffix).not.toBe(preSuffix);

      actionCreator.set('middle', 'R').dispatch();
      expect(nameState.middle).toBe('R');
      expect(() => actionCreator.set('middle', 'R').dispatch()).not.toThrow();
      expect(nameState.suffix).toBe(nameState.middle);
      expect(nameState.first).toBe(first);
    }
    setTimeout(testExpect, 0);

    testStore.getManager().getActionProcessorAPI().removePostProcessor(triggerProcessor);
  });

});

export class BowlerContainer2 extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {
  public static postActionCount: number = 0;

  public getMappings = super.getMappingActions;

  public average: number;
  // nameState = state.getState().name;
  nameState: Name & StateObject; // | undefined

  constructor(bowlerProps: BowlerProps) {
    super(bowlerProps, testStore.getState(), undefined);
    if (!this.appState.name) {
      throw new Error('nameState must be defined!');
    }
    this.nameState = this.appState.name;
    // this.addressesMapper = getMappingCreator(this.nameState, this).createMappingAction('addresses', 'addresses');
  }

  public createViewProps(): ScoreCardProps {
    if ( !this.nameState ) {
      return {
        fullName: this.props.fullName,
        scores: [],
        street: '',
        city: '',
        state: '',
        calcAverage: () => 0.0,
        addresses: []
      };
    } else {
      return {
        fullName: this.props.fullName,
        scores: this.nameState.bowlingScores || [],
        street: this.nameState.address ? this.nameState.address.street : '',
        city: this.nameState.address ? this.nameState.address.city : '',
        state: this.nameState.address ? this.nameState.address.state : '',
        calcAverage: () => 0.0,
        addresses: []
      };
    }
  }

  public createView(viewProps: ScoreCardProps) {
    return new React.Component(viewProps);
  }

  appendToMappingActions(actions: AnyMappingAction[])
    : void {
    let nameStateMapper = getMappingActionCreator(this.nameState, 'first');
    let bowlingMapper = getMappingActionCreator(this.nameState, 'bowlingScores');
    actions.push( nameStateMapper.createPropertyMappingAction(this, 'fullName') );
    actions.push( bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)) );
    let addressesMapper = getMappingActionCreator(this.nameState, 'addresses');
    actions.push(addressesMapper.createPropertyMappingAction(this, 'addresses'));
    // let addressesMapper = nameStateMapper.createMappingAction('addresses', 'addresses');
    // actions.push( addressesMapper );
  }

  /**
   * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
   *
   * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
   */
  generateMappingActions(): AnyMappingAction[] {
    let actions: AnyMappingAction[] = [];
    let nameStateMapper = getMappingActionCreator(this.nameState, 'first');
    let bowlingMapper = getMappingActionCreator(this.nameState, 'bowlingScores');
    actions.push( nameStateMapper.createPropertyMappingAction(this, 'fullName') );
    actions.push( bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)) );
    return actions;
  }

  public updateViewProps(executedActions: Action[]) {
    // this.updateViewPropsUsingMappings(executedActions);
  }

  /* tslint:disable:no-any */
  public calcAverage: ContainerPostReducer = (action: StateCrudAction<any, any>): void => {
    /* tslint:enable:no-any */
    // console.log(`calcAverage dispatched by ${ActionId[action.type]}`);
    this.average = this.viewProps.scores.reduce(
      function(previous: number, current: number) { return previous + current; }, 0.0);
    this.average = this.average / this.viewProps.scores.length;
  }
}

describe('Test that handleChange updates on data changes, not on mapping changes', () => {
  const bowler = new BowlerContainer2({fullName: 'Jane Doe'});

  let updated = false;
  const dataAction = getActionCreator(testStore.getState()).set('appName', 'boohoo');
  const mappingAction: AnyMappingAction = getMappingActionCreator(testStore.getState(), 'appName').
    createPropertyMappingAction(bowler, 'fullName');

  let mappingDescription = actionDescription(mappingAction);
  expect(mappingDescription).toContain('MappingAction');
  expect(mappingDescription).toContain('appName');
  expect(mappingDescription).toContain('fullName');

  test('no actions should not force update', () => {
    updated = bowler.handleChange([]);
    expect(updated).toBe(false);
  });
  test('data actions should force an update', () => {
    updated = bowler.handleChange([dataAction]);
    expect(updated).toBe(true);
  });
  test('mapping actions should not force an update', () => {
    updated = bowler.handleChange([mappingAction]);
    expect(updated).toBe(false);
  });
  test('mixed mapping and data actions should force an update', () => {
    updated = bowler.handleChange([mappingAction, dataAction]);
    expect(updated).toBe(true);
  });
  test('action description for unknown action type', () => {
    const fakeAction = new FakeAction(ActionId.UPDATE_PROPERTY_NO_OP);
    expect(actionDescription(fakeAction)).toContain('Not StateCrud, Array or Mapping; action.type ===');
  });
  test('actionPostReducer', () => {
    const actionWithPostReducer = getActionCreator(testStore.getState()).set('appName', 'boohoo');
    function incrementor() {
      BowlerContainer2.postActionCount = 1 + BowlerContainer2.postActionCount;
    }
    actionWithPostReducer.actionPostReducer = incrementor;
    const beforeCount = BowlerContainer2.postActionCount;
    actionWithPostReducer.dispatch();

    expect(BowlerContainer2.postActionCount).toBe(1 + beforeCount);
  });
});

describe('action type guards', () => {
  const ac = getActionCreator(nameState);
  test('prop action type guards', () => {
    const action = ac.update('prefix', 'Mr');
    expect(action.isStatePropChange(false)).toBe(true);
    expect(action.isStatePropChange(true)).toBe(true);
    expect(action.isStateArrayChange(false)).toBe(false);
    expect(action.isStateArrayChange(true)).toBe(false);
    expect(action.isMappingChange(false)).toBe(false);
    expect(action.isMappingChange(true)).toBe(false);

    action.type = ActionId.UPDATE_PROPERTY_NO_OP;
    expect(action.isStatePropChange(false)).toBe(false);
    expect(action.isStatePropChange(true)).toBe(true);
    expect(action.isStateArrayChange(false)).toBe(false);
    expect(action.isStateArrayChange(true)).toBe(false);
    expect(action.isMappingChange(false)).toBe(false);
    expect(action.isMappingChange(true)).toBe(false);
  });
  const aac = getArrayActionCreator(nameState, nameState.bowlingScores);
  test('array action type guards', () => {
    const action = aac.insertElement(0, 220)[0];
    expect(action.isStatePropChange(false)).toBe(false);
    expect(action.isStatePropChange(true)).toBe(false);
    expect(action.isStateArrayChange(false)).toBe(true);
    expect(action.isStateArrayChange(true)).toBe(true);
    expect(action.isMappingChange(false)).toBe(false);
    expect(action.isMappingChange(true)).toBe(false);

    action.type = ActionId.UPDATE_PROPERTY_NO_OP;
    expect(action.isStatePropChange(false)).toBe(false);
    expect(action.isStatePropChange(true)).toBe(false);
    expect(action.isStateArrayChange(false)).toBe(false);
    expect(action.isStateArrayChange(true)).toBe(true);
    expect(action.isMappingChange(false)).toBe(false);
    expect(action.isMappingChange(true)).toBe(false);
  });

  test('type guards for mapping actions', () => {
    const bowler = new BowlerContainer2({fullName: 'Jane Doe'});
    const action: AnyMappingAction = getMappingActionCreator(testStore.getState(), 'appName').
      createPropertyMappingAction(bowler, 'fullName');

    expect(action.isStatePropChange(false)).toBe(false);
    expect(action.isStatePropChange(true)).toBe(false);
    expect(action.isStateArrayChange(false)).toBe(false);
    expect(action.isStateArrayChange(true)).toBe(false);
    expect(action.isMappingChange(false)).toBe(true);
    expect(action.isMappingChange(true)).toBe(true);

    action.type = ActionId.UPDATE_PROPERTY_NO_OP;
    expect(action.isStatePropChange(false)).toBe(false);
    expect(action.isStatePropChange(true)).toBe(false);
    expect(action.isStateArrayChange(false)).toBe(false);
    expect(action.isStateArrayChange(true)).toBe(false);
    expect(action.isMappingChange(false)).toBe(false);
    expect(action.isMappingChange(true)).toBe(true);
  });
  test('removeStateObject', () => {
    expect(testStore.getState().name).toBeTruthy();
    const acs = getActionCreator(testStore.getState());
    acs.removeStateObject('name').dispatch();
    expect(testStore.getState().name).toBeFalsy();
  });
});
