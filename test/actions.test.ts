import { Action, ActionId, ArrayMutateAction, StateCrudAction } from '../actions';
import { State } from '../index';
import { createTestState } from './testHarness';
import { Address, Name } from './types.test';
import { testState } from './testHarness';
import { StateObject } from '../index';
import { ActionProcessorFunctionType } from '../src/types/ActionProcessor';
import { Manager } from '../src/types/Manager';
import * as _ from 'lodash';
import { onFailureDiff } from '../src/types/StateMutationDiagnostics';
// import { MutationError } from '../src/types/StateMutationCheck';

let name: Name;
let address: Address;
let address2: Address;
let nameState: Name & StateObject;
let addressState: Address & StateObject;
let bowlingScores: number[];

let resetTestObjects = () => {
  testState.reset(createTestState(), {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr'};
  nameState = State.createStateObject<Name>(testState.getState(), 'name', name);
  address = {street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  addressState = State.createStateObject<Address>(nameState, 'address', address);
  address2 = {street: '12 Bennett Common', city: 'Millbrook', state: 'NY', zip: '19106'};
  bowlingScores = [111, 121, 131];
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
      let bowlingAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
      bowlingAction.perform();
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toBe(111);
    });
    test('array index notation should work', () => {
      let updateAction = new ArrayMutateAction(
          ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores',
          nameState.bowlingScores, 0, 101);
      expect(updateAction.index).toBe(0);
      updateAction.perform();
      expect(bowlingScores[0]).toBe(101);
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
          nameState.bowlingScores, nameState.bowlingScores.length, 299);
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
          nameState.bowlingScores, nameState.bowlingScores.length, 299);
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
      let processors = Manager.get().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('add processor to postProcess', () => {
      testState.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
      let processors = Manager.get().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
    });
    test('remove processor from preProcess', () => {
      testState.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
      let processors = Manager.get().getActionProcessorAPI().getProcessorClones();
      expect(processors.pre.indexOf(testProcessor)).toBe(-1);
    });
    test('remove processor from postProcess', () => {
      testState.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
      let processors = Manager.get().getActionProcessorAPI().getProcessorClones();
      expect(processors.post.indexOf(testProcessor)).toBe(-1);
    });
  });
});

describe('test stripping IStateObject info', () => {

  test('stripping all IStateObject properties from the object graph', () => {
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