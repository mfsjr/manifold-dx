import { ActionQueue, createActionQueue, } from '../src/types/ActionQueue';
import { Action, ActionId, ArrayChangeAction, StateCrudAction } from '../src/actions/actions';
import * as _ from 'lodash';
import {
  Address,
  createTestStore,
  createNameContainer,
  createTestState,
  Name,
  GreetingState,
  TestState
} from './testHarness';
import { Store, StateObject } from '../src/types/Store';
import { getActionCreator } from '../src';

interface TestStateObjects {
  nameState: Name & StateObject;
  addressState: Address & StateObject;
  bowlingScores: number[];
}

const testStore = createTestStore();

let resetTestObjects = (): TestStateObjects => {
  testStore.reset(createTestState(), {});
  let name: Name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: []};
  let address: Address = {id: 1, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  // let x = State.createStateObject<Name>(testStore.getState(), 'name', name);
  let x = createNameContainer(name, testStore.getState(), 'name');
  let y = Store.convertAndAdd<Address>(x, 'address', address);

  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();

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
    expect(testStore.getManager()).toBeDefined();
  });
  test('Manager\'s component state should be defined', () => {
    expect(testStore.getManager().getMappingState()).toBeDefined();
  });
});

describe('state setup', () => {
  test('should return the initial state, containing _parent == this or null', () => {
    if (testStore.getState()._parent) {
      expect(testStore.getState()._parent).toEqual(testStore.getState());
    } else {
      expect(testStore.getState()._parent).toEqual(null);
    }
  });

  test('nameState should be identified as a state object', () => {
    expect(Store.isInstanceOfStateObject(nameState)).toBe(true);
    expect(Store.isInstanceOfStateObject(nameState)).toBe(true);
  });

  test('state should be identified as a state object', () => {
    expect(Store.isInstanceOfStateObject(testStore.getState())).toBe(true);
  });

  test('bowlingScores is not a state object', () => {
    expect(Store.isInstanceOfStateObject(bowlingScores)).toBe(false);
  });

  test('if a plain object structurally matches a state object, it should be identified as a state object', () => {
    let c = {
      _parent: null as (StateObject | null),
      _myPropname: ''
    };
    c._parent = c as StateObject;

    expect(Store.isInstanceOfStateObject(c)).toBe(true);
  });

});

describe('creating child state objects', () => {
  test('nameState should have a _parent that points to state', () => {
    expect(nameState._parent === testStore.getState());
    // expect( testStore.getState().name ).toBe(nameState);
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
    let iterator = Store.createStateObjectIterator(addressState);
    let result = iterator.next();
    // first call to next returns the original state object
    expect(result.value).toBe(addressState);
    while (!result.done) {
      if (result.value === nameState) {
        expect(result.value._parent).not.toBe(result.value);
      } else if (result.value === testStore.getState() || result.value === null ) {
        let _value = result.value._parent ? result.value._parent : null;
        expect(result.value._parent).toBe(_value);
      }
      result = iterator.next();
    }
    // when done, result.value is the app State
    let temp = testStore.getState();
    expect(result.value).toBe(temp);

    let value = result.value._parent ? result.value._parent : null;
    expect(result.value._parent).toBe(value);
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
  // TODO: rework array examples using scores; this keyGen fn sucks, because the whole example sucks (primitive array)
  let actionQueue: ActionQueue = createActionQueue(3);
  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
  let insertScoresAction = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
  let appendScoreAction = new ArrayChangeAction(
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
    let appState: StateObject = testStore.getState();
    let fullPath: string = testStore.getManager().getFullPath(appState, 'appName');
    expect(fullPath).toEqual('appName');
  });
  test('nameState\'s "middle" property should have a full path indicating "name"', () => {
    let fullPath = testStore.getManager().getFullPath(nameState, 'middle');
    expect(fullPath).toEqual('name.middle');
  });
  test('addressState\'s "city" should include name and address in path', () => {
    let fullPath = testStore.getManager().getFullPath(addressState, 'city');
    expect(fullPath).toEqual('name.address.city');
  });
  test('full path for bowling scores', () => {
    let appState = testStore.getState();
    // if (appState.name) {
    //   nameState = appState.name;
    // }
    expect(appState.name).toBe(nameState);
    getActionCreator(nameState).set('bowlingScores', []).dispatch();
    let insertScoresAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    insertScoresAction.dispatch();
    // Action.perform(insertScoresAction);
    let fullPath = testStore.getManager().getFullPath(nameState, 'bowlingScores[0]');
    expect(fullPath).toEqual('name.bowlingScores[0]');
    expect(_.get(appState, fullPath)).toBe(bowlingScores[0]);
  });
  test('operations with partials and undefined', () => {
    let middle = nameState.middle;
    getActionCreator(nameState).update('middle', undefined).dispatch();
    expect(nameState.middle).toBeUndefined();
    expect('middle' in nameState).toBeTruthy();
    getActionCreator(nameState).set('middle', middle).dispatch();
    getActionCreator(nameState).remove('middle').dispatch();
    expect('middle' in nameState).toBeFalsy();
    // inserts will throw if you're inserting a new key with a value of undefined, this may change
    expect(() => {
      getActionCreator(nameState).insert('middle', undefined).dispatch();
    }).toThrow();
    getActionCreator(nameState).set('middle', middle).dispatch();
  });
  test('full path for bowling scores array', () => {
    let fullPath = testStore.getManager().getFullPath(nameState, 'bowlingScores');
    expect(fullPath).toEqual('name.bowlingScores');
  });
});

describe('Test state reset last - leave other tests undisturbed by it', () => {
  test('verify that app state gets reset, but state api does not', () => {
    let c = 'corruption';
    testStore[c] = 'Hillary';
    let d = 'destruction';
    testStore.getState()[d] = 'Trump';
    testStore.reset(createTestState(), {});
    expect(testStore.getState()[d]).toBeUndefined();
    expect(testStore[c]).toBe('Hillary');
    delete testStore[c];
  });
});

describe('Test perform/undo/redo actions marking the app state, mutating, and the action queue', () => {
  // let's reset the state
  // state.reset();
  // let's (re)define some actions
  test('expect the action queue to be empty at the start of this test', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('the middle name at the start of actions', () => {
    expect(nameState.middle).toEqual('F');
  });

  let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');

  test('perform the update middle action', () => {
    testStore.reset(createTestState(), {});
    let updateMiddleResult = testStore.getManager().actionProcess(updateMiddleAction);
    expect(updateMiddleResult.length).toBe(1);
  });

  test('expect the action queue to contain our action', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('expect action undo to work', () => {
    let undoMiddleResult = testStore.getManager().actionUndo(1);
    expect(undoMiddleResult.length).toBe(1);
  });

  test('after undo, action queue\'s current index should be decremented by 1', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('after undo, middle name should be the original', () => {
    expect(nameState.middle).toBe('F');
  });

  test('redo action should succeed', () => {
    let redoMiddleResult = testStore.getManager().actionRedo(1);
    expect(redoMiddleResult.length).toBe(1);
  });

  test('after redo middle name should be restored', () => {
    expect(nameState.middle).toBe('J');
  });

  test('after redo action queue index should be restored', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('the size of the action queue', () => {
    expect(testStore.getManager().getActionQueue().size()).toBe(1);
  });

  // repeat with disaptches
  test('expect the action queue to contain our action', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });
  test('expect dispatch undo to work', () => {
    let undoMiddleResult = testStore.dispatchUndo(1);
    expect(undoMiddleResult.length).toBe(1);
  });

  test('after undo, action queue\'s current index should be decremented by 1', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
  });

  test('after undo, middle name should be the original', () => {
    expect(nameState.middle).toBe('F');
  });

  test('redo action should succeed', () => {
    let redoMiddleResult = testStore.dispatchRedo(1);
    expect(redoMiddleResult.length).toBe(1);
  });

  test('after redo middle name should be restored', () => {
    expect(nameState.middle).toBe('J');
  });

  test('after redo action queue index should be restored', () => {
    expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
  });

  test('the size of the action queue', () => {
    expect(testStore.getManager().getActionQueue().size()).toBe(1);
  });
  // end repeat with dispatches

  test('insert name container', () => {
    let insertName = new StateCrudAction(ActionId.INSERT_STATE_OBJECT, testStore.getState(), 'name', nameState);
    // testStore.getManager().actionProcess(insertName);
    // expect(testStore.getState().name).toBeDefined();
    testStore.dispatchNext(insertName).then( (_actions: Action[]) => {
        expect(testStore.getState().name).toBeDefined();
    });
  });
});

describe(`test Manager's dispatch args`, () => {
  let actionMethod = (action: Action) => {
    Action.perform(action);
  };
  test(`incoming middle name should be J`, () => {
    let dispatchArgs = [
      {
        actionMethod,
        actions: [getActionCreator(nameState).update('middle', 'K')]
      },
      {
        actionMethod,
        actions: [getActionCreator(nameState).update('middle', 'L')]
      }
    ];
    expect(nameState.middle).toBe('J');
    let actions = testStore.getManager().dispatchFromNextArgs(dispatchArgs);
    expect(actions.length).toBe(1);
    expect(dispatchArgs.length).toBe(1);
    expect(nameState.middle).toBe('K');

    let actions2 = testStore.getManager().dispatchFromNextArgs(dispatchArgs);
    actions.push(...actions2);
    expect(actions.length).toBe(2);
    expect(dispatchArgs.length).toBe(0);
    expect(nameState.middle).toBe('L');
  });

  test('attach a greeting using Store instance api', () => {
    let greeting: GreetingState = {
      message: 'Hello Stateful World',
      _parent: null,
      _myPropname: ''
    };
    testStore.addChildToParent(testStore.getState(), greeting, 'greeting');
    expect(testStore.getState().greeting).toBe(greeting);

    let fakeState: TestState = { _parent: null, _myPropname: '' };
    let fakeStore = new Store(fakeState, {});
    // try attaching a child to a parent that is not in the store (should throw)
    expect(() => testStore.addChildToParent(fakeStore.getState(), greeting, 'greeting')).toThrow();
  });

});
