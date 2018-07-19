"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Store_1 = require("../src/types/Store");
var changeState_1 = require("../src/actions/changeState");
var actions_1 = require("../src/actions/actions");
var _ = require("lodash");
var testHarness_1 = require("./testHarness");
var Store_2 = require("../src/types/Store");
var testStore = testHarness_1.createTestStore();
var name;
var address;
var nameState;
var addressState;
var bowlingScores;
var resetTestObjects = function () {
    testStore.reset(testHarness_1.createTestState(), {});
    // comment out the next line to test with a self-referenced parent
    testStore.getState()._parent = null;
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    nameState = Store_2.Store.createStateObject(testStore.getState(), 'name', name);
    address = { id: 1, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    addressState = Store_2.Store.createStateObject(nameState, 'address', address);
    bowlingScores = [111, 121, 131];
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};
/**
 * Let's begin with simple object inserts, updates and deletes
 */
describe('mutate object values', function () {
    // Reset test objects once, and insert a name
    resetTestObjects();
    var resultInsertName;
    test('should insert the name object', function () {
        resultInsertName = changeState_1.changeValue(actions_1.ActionId.INSERT_STATE_OBJECT, testStore.getState(), nameState, 'me');
        expect(testStore.getState().me).toBe(nameState);
        expect(nameState.last).toEqual('Hooper');
    });
    test('return from insert should have oldValue undefined', function () {
        expect(resultInsertName.oldValue).toBeUndefined();
    });
    test('return from insert should have no properties', function () {
        expect(Object.getOwnPropertyNames(resultInsertName).length).toBe(0);
    });
    // let's insert an optional property "suffix" into the nameState
    describe('insert the optional "suffix" property into the nameState', function () {
        test('result from inserting the new suffix property should be a {}', function () {
            var resultInsertNewProp = changeState_1.changeValue(actions_1.ActionId.INSERT_PROPERTY, nameState, 'Jr', 'suffix');
            expect(resultInsertNewProp).toEqual({});
        });
        test('nameState should have a new suffix property', function () {
            var received = nameState.suffix;
            expect(received).toBe('Jr');
        });
        describe('now delete the "suffix" property', function () {
            // let's delete the optional property that's there now...
            test('resultDeleteNewProp should have suffix value "Jr"', function () {
                var resultDeleteNewProp = changeState_1.changeValue(actions_1.ActionId.DELETE_PROPERTY, nameState, undefined, 'prefix');
                expect(resultDeleteNewProp).toEqual({ oldValue: 'Mr' });
            });
            test('nameState\'s "prefix" property shouldn\'t be there any more', function () {
                expect(Object.keys(nameState).indexOf('prefix') < 0).toBeTruthy();
            });
        });
    });
    // Insert addressState into name container
    var stateNameContainer = _.get(testStore.getState(), 'name');
    var resultInsertAddress;
    test('name should have an address', function () {
        resultInsertAddress = changeState_1.changeValue(actions_1.ActionId.INSERT_STATE_OBJECT, stateNameContainer, addressState, 'address');
        expect(testStore.getState().name).toBe(nameState);
        expect(nameState.address).toBe(addressState);
        expect(addressState.city).toEqual('Clinton Corners');
    });
    test('result should have no properties in it', function () {
        expect(Object.getOwnPropertyNames(resultInsertAddress).length).toBe(0);
    });
    // Let's update a name value
    var resultUpdateMiddle;
    test('middle initial should be J', function () {
        var appState = testStore.getState();
        // console.log(`appState has name? ${!!appState.name}`);
        resultUpdateMiddle = changeState_1.changeValue(actions_1.ActionId.UPDATE_PROPERTY, nameState, 'J', 'middle');
        expect(_.get(appState, 'name.middle')).toEqual('J');
    });
    test('old last middle initial to be F', function () {
        expect(resultUpdateMiddle.oldValue).toEqual('F');
    });
    describe('Verify that mismatched property/container actions throw', function () {
        test('deleting a property should throw when a container is supplied', function () {
            expect(function () { changeState_1.changeValue(actions_1.ActionId.DELETE_PROPERTY, nameState, undefined, 'address'); }).toThrow();
        });
        test('inserting a property should throw when a container is supplied', function () {
            expect(function () {
                changeState_1.changeValue(actions_1.ActionId.INSERT_PROPERTY, testStore.getState(), addressState, 'address');
            }).toThrow();
        });
    });
    describe('insert array of bowling scores to name', function () {
        test('result of adding scores should be {}', function () {
            var addScoresResult = changeState_1.changeValue(actions_1.ActionId.INSERT_PROPERTY, nameState, bowlingScores, 'bowlingScores');
            expect(addScoresResult).toEqual({});
        });
        test('scores should be a property of names', function () {
            expect(_.get(nameState, 'bowlingScores')).toBe(bowlingScores);
        });
        var newScore = 141;
        test('should be able to insert to the end of the array', function () {
            var appendScoreResult = changeState_1.changeArray(actions_1.ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores, newScore, 'bowlingScores', 3);
            expect(appendScoreResult).toEqual({});
        });
        test('new score property should be reachable', function () {
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[3]).toEqual(newScore);
        });
        var firstScore = 101;
        test('insert new first score', function () {
            var firstScoreResult = changeState_1.changeArray(actions_1.ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores, firstScore, 'bowlingScores', 0);
            expect(firstScoreResult).toEqual({});
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toBe(firstScore);
        });
        test('update the second score', function () {
            var secondScoreResult = changeState_1.changeArray(actions_1.ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 112, 'bowlingScores', 1);
            expect(secondScoreResult).toEqual({ oldValue: 111 });
            expect(_.get(nameState, 'bowlingScores[1]')).toEqual(112);
        });
        test('delete the third score', function () {
            var deleteThirdResult = changeState_1.changeArray(actions_1.ActionId.DELETE_PROPERTY, nameState, nameState.bowlingScores, undefined, 'bowlingScores', 2);
            expect(deleteThirdResult).toEqual({ oldValue: 121 });
            expect(bowlingScores.indexOf(121)).toEqual(-1);
        });
        test('array property notation to work', function () {
            var updateFirstBowlingScore = changeState_1.changeArray(actions_1.ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 99, 'bowlingScores', 0);
            expect(updateFirstBowlingScore.oldValue).toEqual(101);
            expect(nameState.bowlingScores).toBe(bowlingScores);
            expect(bowlingScores[0]).toEqual(99);
        });
        test('updating array with same property to fail with MutationError', function () {
            expect(function () {
                changeState_1.changeArray(actions_1.ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 99, 'bowlingScores', 0);
            }).toThrow();
        });
        test('deleting a container from an array should throw', function () {
            expect(function () {
                changeState_1.changeArray(actions_1.ActionId.DELETE_STATE_OBJECT, nameState, nameState.bowlingScores, undefined, 'bowlingScores', 2);
            }).toThrow();
        });
        test('inserting beyond the length of the array should throw', function () {
            expect(function () {
                changeState_1.changeArray(actions_1.ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores, 300, 'bowlingScores', 9);
            }).toThrow();
        });
        test('inserting into an array at a negative index should throw', function () {
            expect(function () {
                changeState_1.changeArray(actions_1.ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores, 300, 'bowlingScores', -1);
            }).toThrow();
        });
    });
    describe('insert "country" property, not part of IAddress', function () {
        test('result of insert country should be {}', function () {
            var resultInsertCountry = changeState_1.changeValue(actions_1.ActionId.INSERT_PROPERTY, addressState, 'USA', 'country');
            expect(resultInsertCountry).toEqual({});
        });
        test(' address should now have a country', function () {
            expect(_.get(addressState, 'country')).toEqual('USA');
        });
        describe('now delete the country', function () {
            test('result of deleting country should be "{country: "USA"}" ', function () {
                var resultDeleteCountry = changeState_1.changeValue(actions_1.ActionId.DELETE_PROPERTY, addressState, '', 'country');
                expect(resultDeleteCountry).toEqual({ oldValue: 'USA' });
            });
            test('address should not contain the country property', function () {
                expect(Object.keys(addressState).indexOf('country')).toBeLessThan(0);
            });
        });
        test('the JSON_replaceCyclicParent function, used to remove cyclic references for JSON.stringify', function () {
            var json = JSON.stringify(nameState, Store_1.JSON_replaceCyclicParent, 4);
            expect(json.indexOf('_parent')).toBeGreaterThan(0);
        });
        test('delete the nameState from the name container', function () {
            var deleteResult = changeState_1.changeValue(actions_1.ActionId.DELETE_STATE_OBJECT, testStore.getState(), undefined, 'name');
            expect(deleteResult.oldValue).toBe(nameState);
        });
        test('nameState should be disconnected', function () {
            expect(testStore.getState().name).toBeUndefined();
        });
    });
    /**
     * Mutability is all about changing data within state objects or state objects themselves,
     * remember that we rely on immutability of objects to be rendered.
     */
    describe('Test mutationChecks on mutable objects', function () {
        test('append element directly to array', function () {
            if (!nameState.bowlingScores) {
                throw new Error('Need bowlingScores to be defined to run this test');
            }
            nameState.bowlingScores.push(220);
            expect(function () {
                changeState_1.changeValue(actions_1.ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 'bowlingScores');
            }).toThrow();
        });
        test('reinsert same object doesn\'t throw since state objects are recreated upon insertion', function () {
            expect(function () {
                changeState_1.changeValue(actions_1.ActionId.INSERT_STATE_OBJECT, nameState, nameState.address, 'address');
            }).not.toThrow();
        });
    });
});
// shows that app state can mutate but still be used in maps
describe('Test maps with mutating keys', function () {
    var map = new Map();
    var k1 = { name: 'John' };
    map.set(k1, 'Doe');
    var k2 = { name: 'Evie' };
    map.set(k2, 'Hammond');
    test('retrieve from the map', function () {
        expect(map.get(k1)).toBe('Doe');
        expect(map.get(k2)).toBe('Hammond');
    });
    k1.name = 'Inspector';
    test('retrieve using same object with different contents', function () {
        expect(map.get(k1)).toBe('Doe');
    });
});
//# sourceMappingURL=mutations.test.js.map