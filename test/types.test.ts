import {
  createActionQueue,
  } from '../src/types/ActionQueue';
import { ActionId, ArrayMutateAction, StateCrudAction } from '../src/actions/actions';
import * as _ from 'lodash';
import { createTestState, testState } from './testHarness';
import { State, StateObject } from '../src/types/State';
import { Manager } from '../src/types/Manager';
import { ActionQueue } from '../src/types/ActionQueue';
// mport Test = jest.Test;

interface TestStateObjects {
  nameState: Name & StateObject;
  addressState: Address & StateObject;
  bowlingScores: number[];
}

let resetTestObjects = (): TestStateObjects => {
  testState.reset(createTestState(), {});
  let name: Name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr'};
  let address: Address = {street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  testState.getManager().getActionProcessorAPI().enableMutationChecking();
  let x = State.createStateObject<Name>(testState.getState(), 'name', name);
  let y = State.createStateObject<Address>(x, 'address', address);
  let z = [111, 121, 131];
  return {
    nameState: x,
    addressState: y,
    bowlingScores: z,
  };
};

let {/*name, address, address2,*/ nameState, addressState, bowlingScores} = resetTestObjects();

describe ('manager setup', () => {
  test('Manager should be statically available', () => {
    expect(Manager.get()).toBeDefined();
  });
  test('Manager\'s component state should be defined', () => {
    expect(Manager.get().getMappingState()).toBeDefined();
  });
});

describe('state setup', () => {
  test('should return the initial state, containing __parent__ == this', () => {
    expect(testState.getState().__parent__).toEqual(testState.getState());
  });

  test('nameState should be identified as a state object', () => {
    expect(State.isInstanceOfIStateObject(nameState)).toBe(true);
    expect(State.isInstanceOfIStateObject(nameState)).toBe(true);
  });

  test('state should be identified as a state object', () => {
    expect(State.isInstanceOfIStateObject(testState.getState())).toBe(true);
  });

  test('bowlingScores is not a state object', () => {
    expect(State.isInstanceOfIStateObject(bowlingScores)).toBe(false);
  });

  test('if a plain object structurally matches a state object, it should be identified as a state object', () => {
    let c = {
      __parent__: null as (StateObject | null),
      __my_propname__: ''
    };
    c.__parent__ = c as StateObject;

    expect(State.isInstanceOfIStateObject(c)).toBe(true);
  });

});

export interface Name {
  prefix?: string;
  suffix?: string;
  first: string;
  middle: string;
  last: string;
  address?: Address;
  bowlingScores?: Array<number>;
}

export type NameContainer = Name & StateObject;

describe('creating child state objects', () => {
  test('nameState should have a __parent__ that points to state', () => {
    expect(nameState.__parent__ === testState.getState());
  });

  test('nameState should have a first IName of Matthew', () => {
    expect(nameState.first).toEqual('Matthew');
  });

  test('nameState should have an address property', () => {
    expect(nameState.address).toBe(addressState);
  });
});

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

describe('Iterating through parents', () => {
  test('find parents of addressState', () => {
    let iterator = State.createStateObjectIterator(addressState);
    let result = iterator.next();
    // first call to next returns the original state object
    expect(result.value).toBe(addressState);
    while (!result.done) {
      if (result.value === nameState) {
        expect(result.value.__parent__).not.toBe(result.value);
      } else if (result.value === testState.getState()) {
        expect(result.value.__parent__).toBe(result.value);
      }
      result = iterator.next();
    }
    // when done, result.value is the app State
    expect(result.value).toBe(testState.getState());
    expect(result.value.__parent__).toBe(result.value);
  });

});

describe('Mark the state graph with action annotations', () => {
  let appendScoreAction = new ArrayMutateAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores, 141, 3);
  // we are going to let 'custom' action props be handled by subclasses: appendScoreAction.custom = {lastChangeFlag: true}
  let key = 'abc';
  appendScoreAction[key] = 1.2;

  test('Customizability of actions', () => {
    expect(appendScoreAction[key]).toBeCloseTo(1.2);
  });

  test('Enumerability of actions', () => {
    let keys = Object.keys(appendScoreAction);
    // console.log(`keys.length = ${keys.length}`);
    // 'abc', propertyName, value and state object should be there among others
    expect(keys.length).toBeGreaterThan(4);
  });

});

describe('Test the actionQueue', () => {
  let actionQueue: ActionQueue = createActionQueue(3);
  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
  let insertScoresAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
  let appendScoreAction = new ArrayMutateAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores, 3, 141);
  let deletePrefixAction = new StateCrudAction(ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
  test('the currentIndex should equal the length after an action is added', () => {
    actionQueue.push(updateMiddleAction);
    expect(actionQueue.incrementCurrentIndex(0)).toBe(1);
  });
  test('the currentIndex should equal 2 after two actions were added', () => {
    actionQueue.push(insertScoresAction);
    expect(actionQueue.incrementCurrentIndex(0)).toBe(2);
  });
  test('the currentIndex should equal 3 after three actions were added', () => {
    actionQueue.push(appendScoreAction);
    expect(actionQueue.incrementCurrentIndex(0)).toBe(3);
  });
  test('the currentIndex should remain at 3 after 4 actions were added', () => {
    actionQueue.push(deletePrefixAction);
    expect(actionQueue.incrementCurrentIndex(0)).toBe(3);
  });
  test('the first action in the queue should be the second action added', () => {
    expect(actionQueue.lastActions(3)[0]).toBe(insertScoresAction);
  });
  test('the last action in the queue should be the fourth action added', () => {
    expect(actionQueue.lastActions(3)[2]).toBe(deletePrefixAction);
  });
  test('decrementing the currentIndex by 4 should result in it being set to zero', () => {
    expect(actionQueue.incrementCurrentIndex(-4)).toBe(0);
  });
  test('incrementing the current index by 5 should result in it being set to five', () => {
    expect(actionQueue.incrementCurrentIndex(5)).toBe(3);
  });
  test('decrementing the currentIndex by 1 should leave it at 2', () => {
    expect(actionQueue.incrementCurrentIndex(-1)).toBe(2);
  });
  // if one action is undone and another is added, the undone action is discarded
  test('pushing an action when currentIndex=2 should result in the third action being replaced', () => {
    let actions = actionQueue.lastActions(3);
    actionQueue.push(updateMiddleAction);
    let queue = actionQueue.lastActions(3);
    expect(actions[0]).toBe(queue[0]);
    expect(actions[1]).toBe(queue[1]);
    expect(actions[2]).not.toBe(queue[2]);
    expect(queue[2]).toBe(updateMiddleAction);
  });

});

describe('Get the full path of properties in state objects, usable by lodash "get"', () => {
  test('get a property of topmost state', () => {
    let appState: StateObject = testState.getState();
    let fullPath: string = Manager.get().getFullPath(appState, 'appName');
    expect(fullPath).toEqual('appName');
  });
  test('nameState\'s "middle" property should have a full path indicating "name"', () => {
    let fullPath = Manager.get().getFullPath(nameState, 'middle');
    expect(fullPath).toEqual('name.middle');
  });
  test('addressState\'s "city" should include name and address in path', () => {
    let fullPath = Manager.get().getFullPath(addressState, 'city');
    expect(fullPath).toEqual('name.address.city');
  });
  test('full path for bowling scores', () => {
    let appState = testState.getState();
    if (appState.name) {
      nameState = appState.name;
    }
    let insertScoresAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    insertScoresAction.perform();
    let fullPath = Manager.get().getFullPath(nameState, 'bowlingScores[0]');
    expect(fullPath).toEqual('name.bowlingScores[0]');
    expect(_.get(appState, fullPath)).toBe(bowlingScores[0]);
  });
  test('full path for bowling scores array', () => {
    let fullPath = Manager.get().getFullPath(nameState, 'bowlingScores');
    expect(fullPath).toEqual('name.bowlingScores');
  });
});
describe('Test state reset last - leave other tests undisturbed by it', () => {
  test('verify that app state gets reset, but state api does not', () => {
    let c = 'corruption';
    testState[c] = 'Hillary';
    let d = 'destruction';
    testState.getState()[d] = 'Trump';
    testState.reset(createTestState(), {});
    expect(testState.getState()[d]).toBeUndefined();
    expect(testState[c]).toBe('Hillary');
    delete testState[c];
  });
});

describe('Test perform/undo/redo actions marking the app state, mutating, and the action queue', () => {
  // let's reset the state
  // state.reset();
  // let's (re)define some actions
  test('expect the action queue to be empty at the start of this test', () => {
    expect(Manager.get().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('the middle name at the start of actions', () => {
    expect(nameState.middle).toEqual('F');
  });

  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');

  test('perform the update middle action', () => {
    testState.reset(createTestState(), {});
    let updateMiddleResult = Manager.get().actionPerform(updateMiddleAction);
    expect(updateMiddleResult).toBe(1);
  });

  test('expect the action queue to contain our action', () => {
    expect(Manager.get().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('expect action undo to work', () => {
    let undoMiddleResult = Manager.get().actionUndo(1);
    expect(undoMiddleResult).toBe(1);
  });

  test('after undo, action queue\'s current index should be decremented by 1', () => {
    expect(Manager.get().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('after undo, middle name should be the original', () => {
    expect(nameState.middle).toBe('F');
  });

  test('redo action should succeed', () => {
    let redoMiddleResult = Manager.get().actionRedo(1);
    expect(redoMiddleResult).toBe(1);
  });

  test('after redo middle name should be restored', () => {
    expect(nameState.middle).toBe('J');
  });

  test('after redo action queue index should be restored', () => {
    expect(Manager.get().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('the size of the action queue', () => {
    expect(Manager.get().getActionQueue().size()).toBe(1);
  });

  test('insert name container', () => {
    let insertName = new StateCrudAction(ActionId.INSERT_STATE_OBJECT, testState.getState(), 'name', nameState);
    Manager.get().actionPerform(insertName);
    expect(testState.getState().name).toBeDefined();
  });
});