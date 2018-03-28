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
var actions_1 = require("../src/actions/actions");
var State_1 = require("../src/types/State");
var testHarness_1 = require("./testHarness");
var testHarness_2 = require("./testHarness");
var _ = require("lodash");
var StateMutationDiagnostics_1 = require("../src/types/StateMutationDiagnostics");
var actionCreators_1 = require("../src/actions/actionCreators");
var testState = testHarness_1.createAppTestState();
var name;
var nameState;
var bowlingScores;
var address;
var addressState;
var addressKeyFn = function (addr) { return addr.street; };
var address2 = {
    street: '123 Mockingbird Lane',
    city: 'Springfield',
    state: 'Massachusetts',
    country: 'US',
    zip: '54321'
};
var resetTestObjects = function () {
    testState.reset(testHarness_1.createTestState(), {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    // nameState = State.createStateObject<Name>(testState.getState(), 'name', name);
    nameState = testHarness_2.createNameContainer(name, testState.getState(), 'name');
    bowlingScores = [111, 121, 131];
    address = { street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    addressState = State_1.State.createStateObject(nameState, 'address', address);
    nameState.address = addressState;
    testState.getManager().getActionProcessorAPI().enableMutationChecking();
};
describe('Add the name container', function () {
    resetTestObjects();
    var appState = testState.getState();
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
            var bowlingAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', bowlingScores);
            bowlingAction.perform();
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toBe(111);
        });
        test('array index notation should work', function () {
            var updateAction = new actions_1.ArrayMutateAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', 0, nameState.bowlingScores, 101);
            expect(updateAction.index).toBe(0);
            updateAction.perform();
            expect(bowlingScores[0]).toBe(101);
        });
    });
    describe('use CrudActionCreator', function () {
        // let actionCreator = nameState.__accessors__.actionCreator;
        var actionCreator = new actionCreators_1.CrudActionCreator(nameState);
        var last = nameState.last;
        // let updateAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'last', 'Doe');
        test('actionCreator update', function () {
            var updateAction = actionCreator.update('last', 'Doe');
            updateAction.perform();
            expect(nameState.last).toBe('Doe');
            // restore the last name, note the action is performed inline
            actionCreator.update('last', last).perform();
            expect(nameState.last).toBe(last);
        });
        test('actionCreator insert', function () {
            expect(nameState.suffix).toBeUndefined();
            var insertAction = actionCreator.insert('suffix', 'Jr');
            insertAction.perform();
            expect(nameState.suffix).toBe('Jr');
        });
        test('actionCreator remove (delete)', function () {
            var removeAction = actionCreator.remove('suffix');
            removeAction.perform();
            expect(nameState.suffix).toBeUndefined();
        });
    });
    describe('use ActionCreator for array changes in nameState.addresses', function () {
        // let streetKey: ArrayKeyGeneratorFn<Address> = a => a.street;
        var streetKeyFn = nameState.__accessors__.addressKeyGen;
        var addrActionCreator = new actionCreators_1.ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn);
        test('insert into the addresses array', function () {
            var addr = {
                street: '6 Lily Pond Lane',
                city: 'Katonah',
                state: 'New York',
                zip: '12345'
            };
            var action = new actionCreators_1.ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn).insert(0, addr);
            action.perform();
            expect(nameState.addresses[0]).toEqual(addr);
        });
        test('update an item in the addresses array', function () {
            var updatedAddr = __assign({}, nameState.addresses[0], { zip: '54321' });
            var action = addrActionCreator.update(0, updatedAddr);
            action.perform();
            expect(nameState.addresses[0].zip).toBe('54321');
        });
        test('add another address', function () {
            addrActionCreator.insert(1, address2).perform();
            expect(nameState.addresses[1]).toBe(address2);
        });
        test('delete an address', function () {
            addrActionCreator.remove(0).perform();
            expect(nameState.addresses.length).toBe(1);
            expect(nameState.addresses[0]).toBe(address2);
        });
    });
    describe('Verify StateMutationCheck', function () {
        // resetTestObjects();
        test('state should be defined', function () {
            expect(testState).toBeDefined();
        });
        test('initial state mutation checking is true', function () {
            expect(testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toEqual(true);
        });
        test('Mutations are not detected when checking is off', function () {
            testState.getManager().getActionProcessorAPI().disableMutationChecking();
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, 299);
            expect(function () { testState.getManager().actionPerform(appendScore); }).not.toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('turn on mutationChecking', function () {
            testState.getManager().getActionProcessorAPI().enableMutationChecking();
            expect(testState.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toBe(true);
        });
        test('state mutations cause actions to throw when checking is on', function () {
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, 299);
            expect(function () { testState.getManager().actionPerform(appendScore); }).toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('swapping out the StateMutationCheck onFailure function', function () {
            testState.getManager().getActionProcessorAPI().setMutationCheckOnFailureFunction(StateMutationDiagnostics_1.onFailureDiff);
            var fn = testState.getManager().getActionProcessorAPI().getMutationCheckOnFailureFunction();
            var processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
            processors.pre.push(testProcessor);
            // expect(fn(processors.pre, processors.post)).toContain('MUTATION');
            // let result = fn(processors.pre, processors.post);
            expect(function () { fn(processors.pre, processors.post); }).toThrow();
        });
        var testProcessor = function (actions) { return actions; };
        test('add processor to preProcess', function () {
            testState.getManager().getActionProcessorAPI().appendPreProcessor(testProcessor);
            var processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('add processor to postProcess', function () {
            testState.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
            var processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('remove processor from preProcess', function () {
            testState.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
            var processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBe(-1);
        });
        test('remove processor from postProcess', function () {
            testState.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
            var processors = testState.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBe(-1);
        });
    });
});
describe('test stripping StateObject info', function () {
    test('stripping all StateObject properties from the object graph', function () {
        var stateClone = _.cloneDeep(testState.getState());
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
describe('tests for ArrayKeyIndexMap', function () {
    var addresses = [address];
    var names = [name];
    var nameKeyFn = function (n) { return n.last + ", " + n.first + " " + n.middle; };
    var maps = new actions_1.ArrayKeyIndexMap();
    test('we should have one array in the map of maps', function () {
        maps.getOrCreateKeyIndexMap(addresses, addressKeyFn);
        expect(maps.size()).toBe(1);
    });
    test('we should have two arrays in the map of maps', function () {
        maps.getOrCreateKeyIndexMap(names, nameKeyFn);
        expect(maps.size()).toBe(2);
    });
    test('address key index map', function () {
        var keyIndexMap = maps.get(addresses);
        expect(keyIndexMap.get(address.street)).toBe(0);
    });
    test('delete addresses', function () {
        maps.deleteFromMaps(addresses);
        expect(maps.size()).toBe(1);
    });
    addresses = [
        address,
        address2
    ];
    test('put addresses back in', function () {
        maps.getOrCreateKeyIndexMap(addresses, addressKeyFn);
        expect(maps.get(addresses).get(addresses[1].street)).toBe(1);
    });
    test('has key', function () {
        expect(maps.hasKeyIndexMap(names)).toBe(true);
    });
    test('index functionality for names', function () {
        var nameKey = nameKeyFn(names[0]);
        expect(maps.get(names).get(nameKey)).toBe(0);
    });
    test('get key gen fn', function () {
        var keyGen = maps.getKeyGeneratorFn(addresses);
        expect(keyGen(address2)).toBe(address2.street);
    });
    test('exception should be thrown when creating an entry for an array where duplicate keys exist', function () {
        maps.deleteFromMaps(addresses);
        expect(maps.size()).toBe(1);
        addresses = [
            address,
            address2,
            address2
        ];
        expect(function () { return maps.getOrCreateKeyIndexMap(addresses, addressKeyFn); }).toThrow();
    });
});
// describe('Tests for array action creator for array mutations', () => {
//   let actionCreator = new ArrayCrudActionCreator(nameState, name.addresses, nameState.__accessors__.addressKeyFn);
//   actionCreator.insert(0, address).perform();
//   test('address was inserted', () => {
//     expect(name.addresses[0]).toBe(address);
//   });
//
// });
//# sourceMappingURL=actions.test.js.map