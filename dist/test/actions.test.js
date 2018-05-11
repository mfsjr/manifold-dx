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
// import { getCrudCreator } from '../src';
var testStore = testHarness_1.createTestStore();
var name;
var nameState; // Name & StateObject;
var bowlingScores;
var address;
var addressState;
var addressKeyFn = function (addr) { return addr.street; };
var address2 = {
    id: 1,
    street: '123 Mockingbird Lane',
    city: 'Springfield',
    state: 'Massachusetts',
    country: 'US',
    zip: '54321'
};
var resetTestObjects = function () {
    testStore.reset(testHarness_1.createTestState(), {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
    nameState = testHarness_2.createNameContainer(name, testStore.getState(), 'name');
    bowlingScores = [111, 121, 131];
    address = { id: 2, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    addressState = State_1.Store.createStateObject(nameState, 'address', address);
    nameState.address = addressState;
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};
describe('Add the name container', function () {
    resetTestObjects();
    var appState = testStore.getState();
    var insertNameAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, appState, 'name', nameState);
    // true: console.log(`insertNameAction instanceof Action ${insertNameAction instanceof Action}`);
    test('state should contain the name container', function () {
        testStore.getManager().actionProcess(insertNameAction);
        expect(appState.name).toBe(nameState);
        expect(nameState.middle).toEqual('F');
    });
    test('nameState\'s parent should be state container', function () {
        expect(nameState._parent).toBe(appState);
    });
    describe('Modify the name\'s middle initial', function () {
        var updateMiddleAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
        test('middle initial should be "J"', function () {
            // let appState = state.getState();
            testStore.getManager().actionProcess(updateMiddleAction);
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
            testStore.getManager().actionProcess(deletePrefixAction);
            expect(nameState.prefix).toBeUndefined();
        });
        test('oldValue should be ' + prefixValue, function () {
            expect(deletePrefixAction.oldValue).toEqual(prefixValue);
        });
        test('Restore the name prefix by "undo" action', function () {
            // deletePrefixAction.undo();
            testStore.getManager().actionUndo(1);
            expect(nameState.prefix).toEqual(prefixValue);
        });
    });
    describe('Array related actions', function () {
        test('bowling scores should be present', function () {
            var bowlingAction = new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', bowlingScores);
            // testStore.getManager().actionPerform(bowlingAction);
            bowlingAction.process();
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toBe(111);
        });
        test('array index notation should work', function () {
            var keyGen = function (score) { return score; };
            var updateAction = new actions_1.ArrayMutateAction(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'bowlingScores', 0, nameState.bowlingScores, keyGen, 101);
            expect(updateAction.index).toBe(0);
            testStore.getManager().actionProcess(updateAction);
            expect(bowlingScores[0]).toBe(101);
        });
    });
    describe('use CrudActionCreator', function () {
        // let crudCreator = nameState._accessors.crudCreator;
        var crudCreator = new actionCreators_1.CrudActionCreator(nameState);
        var last = nameState.last;
        // let updateAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'last', 'Doe');
        test('crudCreator update', function () {
            var updateAction = crudCreator.update('last', 'Doe');
            testStore.getManager().actionProcess(updateAction);
            expect(nameState.last).toBe('Doe');
            // restore the last name, note the action is performed inline
            var updateLast = crudCreator.update('last', last);
            testStore.getManager().actionProcess(updateLast);
            expect(nameState.last).toBe(last);
        });
        test('crudCreator insert', function () {
            expect(nameState.suffix).toBeUndefined();
            var insertAction = crudCreator.insert('suffix', 'Jr');
            testStore.getManager().actionProcess(insertAction);
            expect(nameState.suffix).toBe('Jr');
        });
        test('crudCreator remove (delete)', function () {
            var removeAction = crudCreator.remove('suffix');
            testStore.getManager().actionProcess(removeAction);
            expect(nameState.suffix).toBeUndefined();
        });
    });
    describe('use ActionCreator for array changes in nameState.addresses', function () {
        var arrayKeyIndexMapSize = actions_1.ArrayKeyIndexMap.get().size();
        var streetKeyFn = nameState.addressKeyGen;
        var addrActionCreator = new actionCreators_1.ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn);
        test('insert into the addresses array', function () {
            var addr = {
                id: 3,
                street: '6 Lily Pond Lane',
                city: 'Katonah',
                state: 'New York',
                zip: '12345'
            };
            var action = addrActionCreator.insert(0, addr);
            // action.perform();
            testStore.getManager().actionProcess(action);
            expect(nameState.addresses[0]).toEqual(addr);
        });
        test('update an item in the addresses array', function () {
            var updatedAddr = __assign({}, nameState.addresses[0], { zip: '54321' });
            var action = addrActionCreator.update(nameState.addresses[0], updatedAddr);
            testStore.getManager().actionProcess(action);
            expect(nameState.addresses[0].zip).toBe('54321');
            // NOTE: this is a little complicated; we're testing that the size of they arrayKeyIndexMap has increased by
            // one, since the update will require it to be created for this array.
            expect(actions_1.ArrayKeyIndexMap.get().size()).toBe(1 + arrayKeyIndexMapSize);
        });
        test('addresses is in KeyArrayIndexMap', function () {
            var before = actions_1.ArrayKeyIndexMap.get().get(nameState.addresses);
            expect(before).toBeDefined();
        });
        test('add another address', function () {
            var action = addrActionCreator.insert(1, address2);
            testStore.getManager().actionProcess(action);
            expect(nameState.addresses[1]).toBe(address2);
        });
        test('delete an address', function () {
            // addrActionCreator.remove(0).perform();
            var removeAction = addrActionCreator.remove(nameState.addresses[0]);
            testStore.getManager().actionProcess(removeAction);
            expect(nameState.addresses.length).toBe(1);
            expect(nameState.addresses[0]).toBe(address2);
        });
        test('expect that deleting an address removes the array from KeyArrayIndexMap', function () {
            expect(actions_1.ArrayKeyIndexMap.get().size()).toBe(arrayKeyIndexMapSize);
        });
        // test('delete \'addresses\' and verify that it is removed from KeyArrayIndexMap', () => {
        //   let crudCreator = getCrudCreator(nameState);
        //   crudCreator.remove('addresses').perform();
        //   let after = ArrayKeyIndexMap.get().get(nameState.addresses);
        //   expect(after).toBeUndefined();
        //
        //   // size of map returns to what it was before anything was done with the array
        //   // expect(ArrayKeyIndexMap.get().size()).toBe(arrayKeyIndexMapSize);
        // });
    });
    describe('Verify StateMutationCheck', function () {
        // resetTestObjects();
        test('state should be defined', function () {
            expect(testStore).toBeDefined();
        });
        test('initial state mutation checking is true', function () {
            expect(testStore.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toEqual(true);
        });
        test('Mutations are not detected when checking is off', function () {
            testStore.getManager().getActionProcessorAPI().disableMutationChecking();
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var keyGen = function (score) { return score; };
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, keyGen, 299);
            expect(function () { testStore.getManager().actionProcess(appendScore); }).not.toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('turn on mutationChecking', function () {
            testStore.getManager().getActionProcessorAPI().enableMutationChecking();
            expect(testStore.getManager().getActionProcessorAPI().isMutationCheckingEnabled()).toBe(true);
        });
        test('state mutations cause actions to throw when checking is on', function () {
            var middle = nameState.middle;
            nameState.middle = 'ZAX';
            if (!nameState.bowlingScores) {
                throw new Error('nameState.bowlingScores should be defined but is falsey');
            }
            var keyGen = function (score) { return score; };
            var appendScore = new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, keyGen, 299);
            expect(function () { testStore.getManager().actionProcess(appendScore); }).toThrow();
            // restore the old middle
            nameState.middle = middle;
        });
        test('swapping out the StateMutationCheck onFailure function', function () {
            testStore.getManager().getActionProcessorAPI().setMutationCheckOnFailureFunction(StateMutationDiagnostics_1.onFailureDiff);
            var fn = testStore.getManager().getActionProcessorAPI().getMutationCheckOnFailureFunction();
            var processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
            processors.pre.push(testProcessor);
            // expect(fn(processors.pre, processors.post)).toContain('MUTATION');
            // let result = fn(processors.pre, processors.post);
            expect(function () { fn(processors.pre, processors.post); }).toThrow();
        });
        var testProcessor = function (actions) { return actions; };
        test('add processor to preProcess', function () {
            testStore.getManager().getActionProcessorAPI().appendPreProcessor(testProcessor);
            var processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('add processor to postProcess', function () {
            testStore.getManager().getActionProcessorAPI().appendPostProcessor(testProcessor);
            var processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBeGreaterThan(-1);
        });
        test('remove processor from preProcess', function () {
            testStore.getManager().getActionProcessorAPI().removePreProcessor(testProcessor);
            var processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.pre.indexOf(testProcessor)).toBe(-1);
        });
        test('remove processor from postProcess', function () {
            testStore.getManager().getActionProcessorAPI().removePostProcessor(testProcessor);
            var processors = testStore.getManager().getActionProcessorAPI().getProcessorClones();
            expect(processors.post.indexOf(testProcessor)).toBe(-1);
        });
    });
});
describe('test stripping StateObject info', function () {
    test('stripping all StateObject properties from the object graph', function () {
        var stateClone = _.cloneDeep(testStore.getState());
        stateClone.helper = function () { return 'Help'; };
        State_1.Store.stripStateObject(stateClone);
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
        stateClone.helper = function () { return 'Help'; };
        State_1.Store.stripStateObject(stateClone, true);
        expect(stateClone.helper).toBeUndefined();
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
//# sourceMappingURL=actions.test.js.map