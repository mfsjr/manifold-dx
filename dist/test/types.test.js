"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ActionQueue_1 = require("../src/types/ActionQueue");
var actions_1 = require("../src/actions/actions");
var _ = require("lodash");
var testHarness_1 = require("./testHarness");
var State_1 = require("../src/types/State");
var actionCreators_1 = require("../src/actions/actionCreators");
var resetTestObjects = function () {
    testHarness_1.testState.reset(testHarness_1.createTestState(), {});
    var name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    var address = { street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    testHarness_1.testState.getManager().getActionProcessorAPI().enableMutationChecking();
    var x = State_1.State.createStateObject(testHarness_1.testState.getState(), 'name', name);
    // let x = createNameContainer(name, testState.getState(), 'name');
    var y = State_1.State.createStateObject(x, 'address', address);
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
        expect(testHarness_1.testState.getManager()).toBeDefined();
    });
    test('Manager\'s component state should be defined', function () {
        expect(testHarness_1.testState.getManager().getMappingState()).toBeDefined();
    });
});
describe('state setup', function () {
    test('should return the initial state, containing __parent__ == this', function () {
        expect(testHarness_1.testState.getState().__parent__).toEqual(testHarness_1.testState.getState());
    });
    test('nameState should be identified as a state object', function () {
        expect(State_1.State.isInstanceOfStateObject(nameState)).toBe(true);
        expect(State_1.State.isInstanceOfStateObject(nameState)).toBe(true);
    });
    test('state should be identified as a state object', function () {
        expect(State_1.State.isInstanceOfStateObject(testHarness_1.testState.getState())).toBe(true);
    });
    test('bowlingScores is not a state object', function () {
        expect(State_1.State.isInstanceOfStateObject(bowlingScores)).toBe(false);
    });
    test('if a plain object structurally matches a state object, it should be identified as a state object', function () {
        var c = {
            __parent__: null,
            __my_propname__: ''
        };
        c.__parent__ = c;
        expect(State_1.State.isInstanceOfStateObject(c)).toBe(true);
    });
});
// export interface NameContainer extends Name, StateObject {
//   __accessors__: NameAccessors;
// }
/**
 * Create the name container state object and insert it into the parent.
 *
 * Example of how to create a StateObject containing an array.  The 'keyGenerator' is needed to create
 * the keys that React requires, and the 'addressesActionCreator' is used to create actions that
 * manipulate the array.
 *
 * Note that the returned NameContainer is never declared to be a NameContainer, but is built as an object
 * literal, piece by piece until its returned, where structural subtyping verifies its a NameContainer
 *
 * @param {Name} nameData
 * @param {StateObject} parent
 * @param {string} myName
 * @returns {NameContainer}
 */
function createNameContainer(nameData, parent, myName) {
    var nameStateData = __assign({ __my_propname__: myName, __parent__: parent }, nameData);
    // define the keyGeneratorFn, to be used in multiple places below
    var keyGeneratorFn = function (addr) { return actions_1.propertyKeyGenerator(addr, 'street'); };
    // build NameAccessors
    var accessors = {
        actionCreator: new actionCreators_1.CrudActionCreator(nameStateData),
        keyGeneratorFn: keyGeneratorFn,
        addressesActionCreator: new actionCreators_1.ArrayCrudActionCreator(nameStateData, nameStateData.addresses, keyGeneratorFn)
    };
    nameStateData["__accessors__"] = accessors;
    parent[myName] = nameStateData;
    return nameStateData;
    // // structural subtyping verifies that the object is of type NameContainer (this function's return type)
    // let result: NameContainer = { ...nameStateData,  __accessors__: accessors };
    // parent[myName] = result;
    // return result;
}
exports.createNameContainer = createNameContainer;
describe('creating child state objects', function () {
    test('nameState should have a __parent__ that points to state', function () {
        expect(nameState.__parent__ === testHarness_1.testState.getState());
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
        var iterator = State_1.State.createStateObjectIterator(addressState);
        var result = iterator.next();
        // first call to next returns the original state object
        expect(result.value).toBe(addressState);
        while (!result.done) {
            if (result.value === nameState) {
                expect(result.value.__parent__).not.toBe(result.value);
            }
            else if (result.value === testHarness_1.testState.getState()) {
                expect(result.value.__parent__).toBe(result.value);
            }
            result = iterator.next();
        }
        // when done, result.value is the app State
        var temp = testHarness_1.testState.getState();
        expect(result.value).toBe(temp);
        expect(result.value.__parent__).toBe(result.value);
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
    var actionQueue = ActionQueue_1.createActionQueue(3);
    var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    var insertScoresAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    var appendScoreAction = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', 3, nameState.bowlingScores, 141);
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
        var appState = testHarness_1.testState.getState();
        var fullPath = testHarness_1.testState.getManager().getFullPath(appState, 'appName');
        expect(fullPath).toEqual('appName');
    });
    test('nameState\'s "middle" property should have a full path indicating "name"', function () {
        var fullPath = testHarness_1.testState.getManager().getFullPath(nameState, 'middle');
        expect(fullPath).toEqual('name.middle');
    });
    test('addressState\'s "city" should include name and address in path', function () {
        var fullPath = testHarness_1.testState.getManager().getFullPath(addressState, 'city');
        expect(fullPath).toEqual('name.address.city');
    });
    test('full path for bowling scores', function () {
        var appState = testHarness_1.testState.getState();
        // if (appState.name) {
        //   nameState = appState.name;
        // }
        expect(appState.name).toBe(nameState);
        var insertScoresAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
        insertScoresAction.perform();
        var fullPath = testHarness_1.testState.getManager().getFullPath(nameState, 'bowlingScores[0]');
        expect(fullPath).toEqual('name.bowlingScores[0]');
        expect(_.get(appState, fullPath)).toBe(bowlingScores[0]);
    });
    test('full path for bowling scores array', function () {
        var fullPath = testHarness_1.testState.getManager().getFullPath(nameState, 'bowlingScores');
        expect(fullPath).toEqual('name.bowlingScores');
    });
});
describe('Test state reset last - leave other tests undisturbed by it', function () {
    test('verify that app state gets reset, but state api does not', function () {
        var c = 'corruption';
        testHarness_1.testState[c] = 'Hillary';
        var d = 'destruction';
        testHarness_1.testState.getState()[d] = 'Trump';
        testHarness_1.testState.reset(testHarness_1.createTestState(), {});
        expect(testHarness_1.testState.getState()[d]).toBeUndefined();
        expect(testHarness_1.testState[c]).toBe('Hillary');
        delete testHarness_1.testState[c];
    });
});
describe('Test perform/undo/redo actions marking the app state, mutating, and the action queue', function () {
    // let's reset the state
    // state.reset();
    // let's (re)define some actions
    test('expect the action queue to be empty at the start of this test', function () {
        expect(testHarness_1.testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
    });
    test('the middle name at the start of actions', function () {
        expect(nameState.middle).toEqual('F');
    });
    var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
    test('perform the update middle action', function () {
        testHarness_1.testState.reset(testHarness_1.createTestState(), {});
        var updateMiddleResult = testHarness_1.testState.getManager().actionPerform(updateMiddleAction);
        expect(updateMiddleResult).toBe(1);
    });
    test('expect the action queue to contain our action', function () {
        expect(testHarness_1.testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
    });
    test('expect action undo to work', function () {
        var undoMiddleResult = testHarness_1.testState.getManager().actionUndo(1);
        expect(undoMiddleResult).toBe(1);
    });
    test('after undo, action queue\'s current index should be decremented by 1', function () {
        expect(testHarness_1.testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(0);
    });
    test('after undo, middle name should be the original', function () {
        expect(nameState.middle).toBe('F');
    });
    test('redo action should succeed', function () {
        var redoMiddleResult = testHarness_1.testState.getManager().actionRedo(1);
        expect(redoMiddleResult).toBe(1);
    });
    test('after redo middle name should be restored', function () {
        expect(nameState.middle).toBe('J');
    });
    test('after redo action queue index should be restored', function () {
        expect(testHarness_1.testState.getManager().getActionQueue().incrementCurrentIndex(0)).toBe(1);
    });
    test('the size of the action queue', function () {
        expect(testHarness_1.testState.getManager().getActionQueue().size()).toBe(1);
    });
    test('insert name container', function () {
        var insertName = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, testHarness_1.testState.getState(), 'name', nameState);
        testHarness_1.testState.getManager().actionPerform(insertName);
        expect(testHarness_1.testState.getState().name).toBeDefined();
    });
});
//# sourceMappingURL=types.test.js.map