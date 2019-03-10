"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("../src/actions/actions");
var Store_1 = require("../src/types/Store");
var testHarness_1 = require("./testHarness");
var testHarness_2 = require("./testHarness");
var _ = require("lodash");
var StateMutationDiagnostics_1 = require("../src/types/StateMutationDiagnostics");
var src_1 = require("../src");
// import { getCrudCreator } from '../src';
var testStore = testHarness_1.createTestStore();
var name;
var nameState; // Name & StateObject;
var bowlingScores;
var address;
var addressState;
// let addressKeyFn = (addr: Address) => { return addr.street; };
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
    addressState = Store_1.Store.convertAndAdd(nameState, 'address', address);
    nameState.address = addressState;
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};
describe('Add the name container', function () {
    resetTestObjects();
    describe('Add the name', function () {
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
    describe('Modify the name\'s middle initial', function () {
        // let updateMiddleAction = new StateCrudAction(ActionId.UPDATE_PROPERTY, nameState, 'middle', 'J');
        var updateMiddleAction = nameState.getActionCreator(nameState).update('middle', 'J');
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
        // let deletePrefixAction = new StateCrudAction(ActionId.DELETE_PROPERTY, nameState, 'prefix', '');
        var deletePrefixAction = src_1.getActionCreator(nameState).remove('prefix');
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
            new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, nameState, 'bowlingScores', undefined).dispatch();
            var bowlingAction = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
            // testStore.getManager().actionPerform(bowlingAction);
            bowlingAction.dispatch();
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toBe(111);
        });
        test('array index notation should work', function () {
            var updateAction = src_1.getArrayActionCreator(nameState, nameState.bowlingScores).updateElement(0, 101);
            expect(updateAction.index).toBe(0);
            testStore.getManager().actionProcess(updateAction);
            expect(bowlingScores[0]).toBe(101);
        });
    });
    describe('use CrudActionCreator', function () {
        var crudCreator = nameState.getActionCreator(nameState);
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
        // let streetKeyFn: ArrayKeyGeneratorFn<Address> = nameState.addressKeyGen;
        var addrActionCreator = nameState.getAddressesActionCreator(nameState);
        test('insert into the addresses array', function () {
            var addr = {
                id: 3,
                street: '6 Lily Pond Lane',
                city: 'Katonah',
                state: 'New York',
                zip: '12345'
            };
            var action = addrActionCreator.insertElement(0, addr);
            // action.perform();
            // testStore.getManager().actionProcess(...action);
            testStore.dispatch.apply(testStore, action);
            expect(nameState.addresses[0]).toEqual(addr);
        });
        test('update an item in the addresses array', function () {
            var updatedAddr = __assign({}, nameState.addresses[0], { zip: '54321' });
            var action = addrActionCreator.updateElement(0, updatedAddr);
            testStore.getManager().actionProcess(action);
            expect(nameState.addresses[0].zip).toBe('54321');
        });
        test('add another address', function () {
            var _a;
            var action = addrActionCreator.insertElement(1, address2);
            (_a = testStore.getManager()).actionProcess.apply(_a, action);
            expect(nameState.addresses[1]).toBe(address2);
        });
        test('delete an address', function () {
            var _a;
            var removeAction = addrActionCreator.removeElement(0);
            (_a = testStore.getManager()).actionProcess.apply(_a, removeAction);
            expect(nameState.addresses.length).toBe(1);
            expect(nameState.addresses[0]).toBe(address2);
        });
    });
    test('updating all array elements using addresses3 should update all the addresses in state', function () {
        var addresses3 = [
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
        var updateAllActions = src_1.getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
        testStore.dispatch.apply(testStore, updateAllActions);
        // updateAllActions.forEach(action => action.dispatch());
        expect(addresses3.length).toBe(3);
        expect(nameState.addresses.length).toBe(3);
        addresses3.forEach(function (addr, index) { return expect(nameState.addresses[index]).toBe(addresses3[index]); });
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
            var appendScore = new actions_1.ArrayChangeAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, 299);
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
            var appendScore = new actions_1.ArrayChangeAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', nameState.bowlingScores.length, nameState.bowlingScores, 299);
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
        Store_1.Store.stripStateObject(stateClone);
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
        Store_1.Store.stripStateObject(stateClone, true);
        expect(stateClone.helper).toBeUndefined();
    });
});
describe('updating a whole array', function () {
    test('array update api', function () {
        var oldScores = nameState.bowlingScores.slice();
        var newScores = oldScores.slice().reverse();
        src_1.getArrayActionCreator(nameState, bowlingScores).updateArray(newScores).dispatch();
        expect(newScores).toBe(nameState.bowlingScores);
    });
});
/**
 * The purpose of these tests is to identify how we can invoke TypeScript source code that can
 * replay actions.
 */
describe('get objects using path', function () {
    // get the street using the path
    var testState = testStore.getState();
    var newAddress = _.get(testState, 'name.address');
    var street = newAddress.street;
    var newStreet = '6 Genung Court';
    test('new and old streets do not match', function () {
        expect(street).not.toBe(newStreet);
    });
    src_1.getActionCreator(newAddress).insert('street', newStreet).dispatch();
    if (!testState || !testState.name || !testState.name.address) {
        throw new Error('testState.name.address must be defined');
    }
    var st = testState.name.address.street;
    test('newStreet is in state', function () {
        expect(st).toBe(newStreet);
    });
    // note that the action creator finds the property name for the given array in the parent
    var ra = _.get(nameState, 'addresses');
    // let creator = getArrayActionCreator(nameState, nameState.addresses);
    var creator = src_1.getArrayActionCreator(nameState, ra);
    testStore.dispatch.apply(testStore, creator.appendElement(newAddress));
    // other tests are mucking with nameState.addresses, so copy here for comparison
    var testAddress = __assign({}, nameState.addresses[0]);
    test('addresses[0] should be newAddress', function () {
        expect(testAddress.city).toBe(newAddress.city);
        expect(testAddress.street).toBe(newAddress.street);
        expect(testAddress.zip).toBe(newAddress.zip);
    });
    testStore.dispatch.apply(testStore, creator.removeElement(0));
});
describe('actionLogging tests', function () {
    var logging = [];
    var loggerObject = actions_1.actionLogging(logging, false);
    testStore.getManager().getActionProcessorAPI().appendPreProcessor(loggerObject.processor);
    test('updating all array elements using addresses3 should update all the addresses in state', function () {
        var addresses3 = [
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
        var deleteActions = [];
        deleteActions.splice.apply(deleteActions, [0, 0].concat(src_1.getArrayActionCreator(nameState, nameState.addresses).removeElement(2)));
        deleteActions.splice.apply(deleteActions, [deleteActions.length, 0].concat(src_1.getArrayActionCreator(nameState, nameState.addresses).removeElement(1)));
        expect(nameState.addresses.length).toBe(3);
        testStore.dispatch.apply(testStore, deleteActions);
        expect(nameState.addresses.length).toBe(1);
        expect(logging.length).toBeGreaterThan(0);
        var loggingLength = logging.length;
        var updateAllActions = src_1.getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
        testStore.dispatch.apply(testStore, updateAllActions);
        // updateAllActions.forEach(action => action.dispatch());
        expect(addresses3.length).toBe(3);
        expect(nameState.addresses.length).toBe(3);
        addresses3.forEach(function (addr, index) { return expect(nameState.addresses[index]).toBe(addresses3[index]); });
        expect(loggerObject.logging).toBeTruthy();
        if (loggerObject.logging) {
            expect(loggerObject.logging.length).toBeGreaterThan(loggingLength);
        }
    });
});
describe('Update if changed', function () {
    test('updateIfChanged', function () {
        var ns = testStore.getState().name;
        expect(ns).toBeTruthy();
        expect(ns === nameState).toBe(true);
        expect(nameState.middle).toBe('J');
        var nameActionCreator = src_1.getActionCreator(nameState);
        // update should throw if you try to update with the same value
        expect(function () { return nameActionCreator.update('middle', 'J').dispatch(); }).toThrow();
        // updateIfChanged should not...
        expect(function () { return nameActionCreator.updateIfChanged('middle', 'J').dispatch(); }).not.toThrow();
        // updateIfChanged should update if the value is changed...
        nameActionCreator.updateIfChanged('middle', 'Z').dispatch();
        expect(nameState.middle).toBe('Z');
    });
});
//# sourceMappingURL=actions.test.js.map