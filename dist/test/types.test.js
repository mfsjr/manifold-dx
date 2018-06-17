"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ActionQueue_1 = require("../src/types/ActionQueue");
var actions_1 = require("../src/actions/actions");
var _ = require("lodash");
var testHarness_1 = require("./testHarness");
var State_1 = require("../src/types/State");
var testStore = testHarness_1.createTestStore();
var resetTestObjects = function () {
    testStore.reset(testHarness_1.createTestState(), {});
    var name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    var address = { id: 1, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    // let x = State.createStateObject<Name>(testStore.getState(), 'name', name);
    var x = testHarness_1.createNameContainer(name, testStore.getState(), 'name');
    var y = State_1.Store.createStateObject(x, 'address', address);
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
    var z = [111, 121, 131];
    return {
        nameState: x,
        addressState: y,
        bowlingScores: z,
    };
};
var _a = resetTestObjects(), /*name, address, address2,*/ nameState = _a.nameState, addressState = _a.addressState, bowlingScores = _a.bowlingScores;
describe('manager setup', function () {
    test('Manager should be statically available', function () {
        expect(testStore.getManager()).toBeDefined();
    });
    test('Manager\'s component state should be defined', function () {
        expect(testStore.getManager().getMappingState()).toBeDefined();
    });
});
describe('state setup', function () {
    test('should return the initial state, containing _parent == this', function () {
        expect(testStore.getState()._parent).toEqual(testStore.getState());
    });
    test('nameState should be identified as a state object', function () {
        expect(State_1.Store.isInstanceOfStateObject(nameState)).toBe(true);
        expect(State_1.Store.isInstanceOfStateObject(nameState)).toBe(true);
    });
    test('state should be identified as a state object', function () {
        expect(State_1.Store.isInstanceOfStateObject(testStore.getState())).toBe(true);
    });
    test('bowlingScores is not a state object', function () {
        expect(State_1.Store.isInstanceOfStateObject(bowlingScores)).toBe(false);
    });
    test('if a plain object structurally matches a state object, it should be identified as a state object', function () {
        var c = {
            _parent: null,
            _myPropname: ''
        };
        c._parent = c;
        expect(State_1.Store.isInstanceOfStateObject(c)).toBe(true);
    });
});
describe('creating child state objects', function () {
    test('nameState should have a _parent that points to state', function () {
        expect(nameState._parent === testStore.getState());
        // expect( testStore.getState().name ).toBe(nameState);
    });
    test('nameState should have a first IName of Matthew', function () {
        expect(nameState.first).toEqual('Matthew');
    });
    test('nameState should have an address property', function () {
        expect(nameState.address).toBe(addressState);
    });
});
describe('Iterating through parents', function () {
    test('find parents of addressState', function () {
        var iterator = State_1.Store.createStateObjectIterator(addressState);
        var result = iterator.next();
        // first call to next returns the original state object
        expect(result.value).toBe(addressState);
        while (!result.done) {
            if (result.value === nameState) {
                expect(result.value._parent).not.toBe(result.value);
            }
            else if (result.value === testStore.getState()) {
                expect(result.value._parent).toBe(result.value);
            }
            result = iterator.next();
        }
        // when done, result.value is the app State
        var temp = testStore.getState();
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
describe('Test the actionQueue', function () {
    // TODO: rework array examples using scores; this keyGen fn sucks, because the whole example sucks (primitive array)
    var actionQueue = ActionQueue_1.createActionQueue(3);
    var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    var insertScoresAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    var appendScoreAction = new actions_1.ArrayChangeAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', 3, nameState.bowlingScores, 141);
    var deletePrefixAction = new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
    test('the currentIndex should equal the length after an action is added', function () {
        actionQueue.push(updateMiddleAction);
        expect(actionQueue.incrementCurrentIndex(0)).toBe(1);
    });
    test('the currentIndex should equal 2 after two actions were added', function () {
        actionQueue.push(insertScoresAction);
        expect(actionQueue.incrementCurrentIndex(0)).toBe(2);
    });
    test('the currentIndex should equal 3 after three actions were added', function () {
        actionQueue.push(appendScoreAction);
        expect(actionQueue.incrementCurrentIndex(0)).toBe(3);
    });
    test('the currentIndex should remain at 3 after 4 actions were added', function () {
        actionQueue.push(deletePrefixAction);
        expect(actionQueue.incrementCurrentIndex(0)).toBe(3);
    });
    test('the first action in the queue should be the second action added', function () {
        expect(actionQueue.lastActions(3)[0]).toBe(insertScoresAction);
    });
    test('the last action in the queue should be the fourth action added', function () {
        expect(actionQueue.lastActions(3)[2]).toBe(deletePrefixAction);
    });
    test('decrementing the currentIndex by 4 should result in it being set to zero', function () {
        expect(actionQueue.incrementCurrentIndex(-4)).toBe(0);
    });
    test('incrementing the current index by 5 should result in it being set to five', function () {
        expect(actionQueue.incrementCurrentIndex(5)).toBe(3);
    });
    test('decrementing the currentIndex by 1 should leave it at 2', function () {
        expect(actionQueue.incrementCurrentIndex(-1)).toBe(2);
    });
    // if one action is undone and another is added, the undone action is discarded
    test('pushing an action when currentIndex=2 should result in the third action being replaced', function () {
        var actions = actionQueue.lastActions(3);
        actionQueue.push(updateMiddleAction);
        var queue = actionQueue.lastActions(3);
        expect(actions[0]).toBe(queue[0]);
        expect(actions[1]).toBe(queue[1]);
        expect(actions[2]).not.toBe(queue[2]);
        expect(queue[2]).toBe(updateMiddleAction);
    });
});
describe('Get the full path of properties in state objects, usable by lodash "get"', function () {
    test('get a property of topmost state', function () {
        var appState = testStore.getState();
        var fullPath = testStore.getManager().getFullPath(appState, 'appName');
        expect(fullPath).toEqual('appName');
    });
    test('nameState\'s "middle" property should have a full path indicating "name"', function () {
        var fullPath = testStore.getManager().getFullPath(nameState, 'middle');
        expect(fullPath).toEqual('name.middle');
    });
    test('addressState\'s "city" should include name and address in path', function () {
        var fullPath = testStore.getManager().getFullPath(addressState, 'city');
        expect(fullPath).toEqual('name.address.city');
    });
    test('full path for bowling scores', function () {
        var appState = testStore.getState();
        // if (appState.name) {
        //   nameState = appState.name;
        // }
        expect(appState.name).toBe(nameState);
        var insertScoresAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
        insertScoresAction.process();
        // Action.perform(insertScoresAction);
        var fullPath = testStore.getManager().getFullPath(nameState, 'bowlingScores[0]');
        expect(fullPath).toEqual('name.bowlingScores[0]');
        expect(_.get(appState, fullPath)).toBe(bowlingScores[0]);
    });
    test('full path for bowling scores array', function () {
        var fullPath = testStore.getManager().getFullPath(nameState, 'bowlingScores');
        expect(fullPath).toEqual('name.bowlingScores');
    });
});
describe('Test state reset last - leave other tests undisturbed by it', function () {
    test('verify that app state gets reset, but state api does not', function () {
        var c = 'corruption';
        testStore[c] = 'Hillary';
        var d = 'destruction';
        testStore.getState()[d] = 'Trump';
        testStore.reset(testHarness_1.createTestState(), {});
        expect(testStore.getState()[d]).toBeUndefined();
        expect(testStore[c]).toBe('Hillary');
        delete testStore[c];
    });
});
describe('Test perform/undo/redo actions marking the app state, mutating, and the action queue', function () {
    // let's reset the state
    // state.reset();
    // let's (re)define some actions
    test('expect the action queue to be empty at the start of this test', function () {
        expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
    });
    test('the middle name at the start of actions', function () {
        expect(nameState.middle).toEqual('F');
    });
    var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    test('perform the update middle action', function () {
        testStore.reset(testHarness_1.createTestState(), {});
        var updateMiddleResult = testStore.getManager().actionProcess(updateMiddleAction);
        expect(updateMiddleResult.length).toBe(1);
    });
    test('expect the action queue to contain our action', function () {
        expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
    });
    test('expect action undo to work', function () {
        var undoMiddleResult = testStore.getManager().actionUndo(1);
        expect(undoMiddleResult.length).toBe(1);
    });
    test('after undo, action queue\'s current index should be decremented by 1', function () {
        expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
    });
    test('after undo, middle name should be the original', function () {
        expect(nameState.middle).toBe('F');
    });
    test('redo action should succeed', function () {
        var redoMiddleResult = testStore.getManager().actionRedo(1);
        expect(redoMiddleResult.length).toBe(1);
    });
    test('after redo middle name should be restored', function () {
        expect(nameState.middle).toBe('J');
    });
    test('after redo action queue index should be restored', function () {
        expect(testStore.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
    });
    test('the size of the action queue', function () {
        expect(testStore.getManager().getActionQueue().size()).toBe(1);
    });
    test('insert name container', function () {
        var insertName = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, testStore.getState(), 'name', nameState);
        testStore.getManager().actionProcess(insertName);
        expect(testStore.getState().name).toBeDefined();
    });
});
//# sourceMappingURL=types.test.js.map