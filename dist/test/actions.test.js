"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("../src/actions/actions");
var State_1 = require("../src/types/State");
var testHarness_1 = require("./testHarness");
var testHarness_2 = require("./testHarness");
var Manager_1 = require("../src/types/Manager");
var _ = require("lodash");
var StateMutationDiagnostics_1 = require("../src/types/StateMutationDiagnostics");
// import { MutationError } from '../src/types/StateMutationCheck';
var name;
var address;
var address2;
var nameState;
var addressState;
var bowlingScores;
var resetTestObjects = function () {
    testHarness_2.testState.reset(testHarness_1.createTestState(), {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr' };
    nameState = State_1.State.createStateObject(testHarness_2.testState.getState(), 'name', name);
    address = { street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    addressState = State_1.State.createStateObject(nameState, 'address', address);
    address2 = { street: '12 Bennett Common', city: 'Millbrook', state: 'NY', zip: '19106' };
    bowlingScores = [111, 121, 131];
    testHarness_2.testState.getManager().getActionProcessorAPI().enableMutationChecking();
};
describe('Add the name container', function () {
    resetTestObjects();
    var appState = testHarness_2.testState.getState();
    var insertNameAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, appState, 'name', nameState);
    // true: console.log(`insertNameAction instanceof Action ${insertNameAction instanceof Action}`);
    test('state should contain the name container', function () {
        insertNameAction.perform();
        expect(appState.name).toBe(nameState);
        expect(nameState.middle).toEqual('F');
    });
    test('nameState\'s parent should be state container', function () {
        expect(nameState.__parent__).toBe(appState);
    });
    describe('Modify the name\'s middle initial', function () {
        var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
        test('middle initial should be "J"', function () {
            // let appState = state.getState();
            updateMiddleAction.perform();
            // expect(appState.name).toBe(nameState);
            expect(nameState.middle).toEqual('J');
        });
        test('oldValue for the updateMiddleAction should be "F"', function () {
            expect(updateMiddleAction.oldValue).toEqual('F');
        });
    });
    describe('Remove the name prefix', function () {
        var prefixValue = nameState.prefix;
        var deletePrefixAction = new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
        test('Delete the prefix property', function () {
            deletePrefixAction.perform();
            expect(nameState.prefix).toBeUndefined();
        });
        test('oldValue should be ' + prefixValue, function () {
            expect(deletePrefixAction.oldValue).toEqual(prefixValue);
        });
        test('Restore the name prefix by "undo" action', function () {
            deletePrefixAction.undo();
            expect(nameState.prefix).toEqual(prefixValue);
        });
    });
    describe('Array related actions', function () {
        test('bowling scores should be present', function () {
            var bowlingAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
            bowlingAction.perform();
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toBe(111);
        });
        test('array index notation should work', function () {
            var updateAction = new actions_1.ArrayMutateAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores, 0, 101);
            expect(updateAction.index).toBe(0);
            updateAction.perform();
            expect(bowlingScores[0]).toBe(101);
        });
    });
    describe('Verify StateMutationCheck', function () {
        // resetTestObjects();
        test('state should be defined', function () {
            expect(testHarness_2.testState).toBeDefined();
        });
        test('initial state mutation checking is true', function () {
            expect(testHarness_2.testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toEqual(true);
        });
        test('Mutations are not detected when checking is off', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().disableMutationChecking();
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores, nameState.bowlingScores.length, 299);
            expect(function () { testHarness_2.testState.getManager().actionPerform(appendScore); }).not.toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('turn on mutationChecking', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().enableMutationChecking();
            expect(testHarness_2.testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toBe(true);
        });
        test('state mutations cause actions to throw when checking is on', function () {
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores, nameState.bowlingScores.length, 299);
            expect(function () { testHarness_2.testState.getManager().actionPerform(appendScore); }).toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('swapping out the StateMutationCheck onFailure function', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().setMutationCheckOnFailureFunction(StateMutationDiagnostics_1.onFailureDiff);
            var fn = testHarness_2.testState.getManager().getActionProcessorAPI().getMutationCheckOnFailureFunction();
            var processors = testHarness_2.testState.getManager().getActionProcessorAPI().getProcessorClones();
            processors.pre.push(testProcessor);
            // expect(fn(processors.pre, processors.post)).toContain('MUTATION');
            // let result = fn(processors.pre, processors.post);
            expect(function () { fn(processors.pre, processors.post); }).toThrow();
        });
        var testProcessor = function (actions) { return actions; };
        test('add processor to preProcess', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().appendPreProcessor(testProcessor);
            var processors = Manager_1.Manager.get().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('add processor to postProcess', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
            var processors = Manager_1.Manager.get().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('remove processor from preProcess', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
            var processors = Manager_1.Manager.get().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBe(-1);
        });
        test('remove processor from postProcess', function () {
            testHarness_2.testState.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
            var processors = Manager_1.Manager.get().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBe(-1);
        });
    });
});
describe('test stripping IStateObject info', function () {
    test('stripping all IStateObject properties from the object graph', function () {
        var stateClone = _.cloneDeep(testHarness_2.testState.getState());
        State_1.State.stripStateObject(stateClone);
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
//# sourceMappingURL=actions.test.js.map