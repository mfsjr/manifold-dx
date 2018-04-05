import { ActionQueue, createActionQueue, } from '../src/types/ActionQueue';
import { ActionId, ArrayMutateAction, StateCrudAction } from '../src/actions/actions';
import * as _ from 'lodash';
import { Address, createAppTestState, createNameContainer, createTestState, Name } from './testHarness';
import { State, StateObject } from '../src/types/State';

interface TestStateObjects {
  nameState: Name & StateObject;
  addressState: Address & StateObject;
  bowlingScores: number[];
}

const testState = createAppTestState();

let resetTestObjects = (): TestStateObjects => {
  testState.reset(createTestState(), {});
  let name: Name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: []};
  let address: Address = {street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  testState.getManager().getActionProcessorAPI().enableMutationChecking();
  // let x = State.createStateObject<Name>(testState.getState(), 'name', name);
  let x = createNameContainer(name, testState.getState(), 'name');
  let y = State.createStateObject<Address>(x, 'address', address);
  let z = [111, 121, 131];
  return {
    nameState: x,
    addressState: y,
    bowlingScores: z,
  };
};

const {/*name, address, address2,*/ nameState, addressState, bowlingScores} = resetTestObjects();

describe ('manager setup', () => {
  test('Manager should be statically available', () => {
    expect(testState.getManager()).toBeDefined();
  });
  test('Manager\'s component state should be defined', () => {
    expect(testState.getManager().getMappingState()).toBeDefined();
  });
});

describe('state setup', () => {
  test('should return the initial state, containing _parent == this', () => {
    expect(testState.getState()._parent).toEqual(testState.getState());
  });

  test('nameState should be identified as a state object', () => {
    expect(State.isInstanceOfStateObject(nameState)).toBe(true);
    expect(State.isInstanceOfStateObject(nameState)).toBe(true);
  });

  test('state should be identified as a state object', () => {
    expect(State.isInstanceOfStateObject(testState.getState())).toBe(true);
  });

  test('bowlingScores is not a state object', () => {
    expect(State.isInstanceOfStateObject(bowlingScores)).toBe(false);
  });

  test('if a plain object structurally matches a state object, it should be identified as a state object', () => {
    let c = {
      _parent: null as (StateObject | null),
      _myPropname: ''
    };
    c._parent = c as StateObject;

    expect(State.isInstanceOfStateObject(c)).toBe(true);
  });

});

// export interface NameContainer extends Name, StateObject {
//   _accessors: NameAccessors;
// }

describe('creating child state objects', () => {
  test('nameState should have a _parent that points to state', () => {
    expect(nameState._parent === testState.getState());
  });

  test('nameState should have a first IName of Matthew', () => {
    expect(nameState.first).toEqual('Matthew');
  });

  test('nameState should have an address property', () => {
    expect(nameState.address).toBe(addressState);
  });
});

describe('Iterating through parents', () => {
  test('find parents of addressState', () => {
    let iterator = State.createStateObjectIterator(addressState);
    let result = iterator.next();
    // first call to next returns the original state object
    expect(result.value).toBe(addressState);
    while (!result.done) {
      if (result.value === nameState) {
        expect(result.value._parent).not.toBe(result.value);
      } else if (result.value === testState.getState()) {
        expect(result.value._parent).toBe(result.value);
      }
      result = iterator.next();
    }
    // when done, result.value is the app State
    let temp = testState.getState();
    expect(result.value).toBe(temp);
    expect(result.value._parent).toBe(result.value);
  });

});

// describe('Mark the state graph with action annotations', () => {
//   let appendScoreAction = new ArrayCrudActionCreator<Name & StateObject, number>(
//     nameState,
//     nameState.bowlingScores)
//     .insert(3, 141); // insert 141 at index 3
//   // we are going to let 'custom' action props be handled by subclasses:
//     // appendScoreAction.custom = {lastChangeFlag: true}
//   let key = 'abc';
//   appendScoreAction[key] = 1.2;
//
//   test('Customizability of actions', () => {
//     expect(appendScoreAction[key]).toBeCloseTo(1.2);
//   });
//
//   test('Enumerability of actions', () => {
//     let keys = Object.keys(appendScoreAction);
//     // console.log(`keys.length = ${keys.length}`);
//     // 'abc', propertyName, value and state object should be there among others
//     expect(keys.length).toBeGreaterThan(4);
//   });
//
// });

describe('Test the actionQueue', () => {
  let actionQueue: ActionQueue = createActionQueue(3);
  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
  let insertScoresAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
  let appendScoreAction = new ArrayMutateAction(
      ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', 3,  nameState.bowlingScores, 141);
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
    let fullPath: string = testState.getManager().getFullPath(appState, 'appName');
    expect(fullPath).toEqual('appName');
  });
  test('nameState\'s "middle" property should have a full path indicating "name"', () => {
    let fullPath = testState.getManager().getFullPath(nameState, 'middle');
    expect(fullPath).toEqual('name.middle');
  });
  test('addressState\'s "city" should include name and address in path', () => {
    let fullPath = testState.getManager().getFullPath(addressState, 'city');
    expect(fullPath).toEqual('name.address.city');
  });
  test('full path for bowling scores', () => {
    let appState = testState.getState();
    // if (appState.name) {
    //   nameState = appState.name;
    // }
    expect(appState.name).toBe(nameState);
    let insertScoresAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    insertScoresAction.perform();
    let fullPath = testState.getManager().getFullPath(nameState, 'bowlingScores[0]');
    expect(fullPath).toEqual('name.bowlingScores[0]');
    expect(_.get(appState, fullPath)).toBe(bowlingScores[0]);
  });
  test('full path for bowling scores array', () => {
    let fullPath = testState.getManager().getFullPath(nameState, 'bowlingScores');
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
    expect(testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('the middle name at the start of actions', () => {
    expect(nameState.middle).toEqual('F');
  });

  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');

  test('perform the update middle action', () => {
    testState.reset(createTestState(), {});
    let updateMiddleResult = testState.getManager().actionPerform(updateMiddleAction);
    expect(updateMiddleResult).toBe(1);
  });

  test('expect the action queue to contain our action', () => {
    expect(testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('expect action undo to work', () => {
    let undoMiddleResult = testState.getManager().actionUndo(1);
    expect(undoMiddleResult).toBe(1);
  });

  test('after undo, action queue\'s current index should be decremented by 1', () => {
    expect(testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('after undo, middle name should be the original', () => {
    expect(nameState.middle).toBe('F');
  });

  test('redo action should succeed', () => {
    let redoMiddleResult = testState.getManager().actionRedo(1);
    expect(redoMiddleResult).toBe(1);
  });

  test('after redo middle name should be restored', () => {
    expect(nameState.middle).toBe('J');
  });

  test('after redo action queue index should be restored', () => {
    expect(testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('the size of the action queue', () => {
    expect(testState.getManager().getActionQueue().size()).toBe(1);
  });

  test('insert name container', () => {
    let insertName = new StateCrudAction(ActionId.INSERT_STATE_OBJECT, testState.getState(), 'name', nameState);
    testState.getManager().actionPerform(insertName);
    expect(testState.getState().name).toBeDefined();
  });
});