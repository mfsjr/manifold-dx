import { JSON_replaceCyclicParent } from '../src/types/Store';
import { Name } from './testHarness';
import { changeArray, changeValue } from '../src/actions/changeState';
import { ActionId } from '../src/actions/actions';
import * as _ from 'lodash';
import { Address, createTestStore, createTestState, TestState } from './testHarness';
import { Store, StateObject } from '../src/types/Store';

const testStore = createTestStore();

let name: Name;
let address: Address;
let nameState: Name & StateObject;
let addressState: Address & StateObject;
let bowlingScores: Array<number>;

let resetTestObjects = () => {
  testStore.reset(createTestState(), {});
  // comment out the next line to test with a self-referenced parent
  testStore.getState()._parent = null;
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: []};
  nameState = Store.createStateObject<Name>(testStore.getState() as TestState & StateObject, 'name', name);
  address = {id: 1, street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  addressState = Store.createStateObject<Address>(nameState, 'address', address);
  bowlingScores = [111, 121, 131];
  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};

/**
 * Let's begin with simple object inserts, updates and deletes
 */
describe('mutate object values', () => {

  // Reset test objects once, and insert a name
  resetTestObjects();
  let resultInsertName: {oldValue?: Name};
  test('should insert the name object', () => {
    resultInsertName = changeValue(ActionId.INSERT_STATE_OBJECT, testStore.getState(), nameState, 'me');
    expect(testStore.getState().me).toBe(nameState);
    expect(nameState.last).toEqual('Hooper');
  });
  test('return from insert should have oldValue undefined', () => {
    expect(resultInsertName.oldValue).toBeUndefined();
  });
  test('return from insert should have no properties', () => {
    expect(Object.getOwnPropertyNames(resultInsertName).length).toBe(0);
  });

  // let's insert an optional property "suffix" into the nameState
  describe('insert the optional "suffix" property into the nameState', () => {
    test('result from inserting the new suffix property should be a {}', () => {
      let resultInsertNewProp = changeValue(ActionId.INSERT_PROPERTY, nameState, 'Jr', 'suffix');
      expect(resultInsertNewProp).toEqual({});
    });
    test('nameState should have a new suffix property', () => {
      let received = nameState.suffix;
      expect(received).toBe('Jr');
    });
    describe('now delete the "suffix" property', () => {
      // let's delete the optional property that's there now...
      test('resultDeleteNewProp should have suffix value "Jr"', () => {
        let resultDeleteNewProp = changeValue(ActionId.DELETE_PROPERTY, nameState, undefined, 'prefix');
        expect(resultDeleteNewProp).toEqual({oldValue: 'Mr'});
      });
      test('nameState\'s "prefix" property shouldn\'t be there any more', () => {
        expect(Object.keys(nameState).indexOf('prefix') < 0).toBeTruthy();
      });
    });
  });

  // Insert addressState into name container
  let stateNameContainer = _.get(testStore.getState(), 'name') as Name & StateObject;
  let resultInsertAddress: {oldValue?: Address};
  test('name should have an address', () => {
    resultInsertAddress = changeValue(ActionId.INSERT_STATE_OBJECT, stateNameContainer, addressState, 'address');
    expect(testStore.getState().name).toBe(nameState);
    expect(nameState.address).toBe(addressState);
    expect(addressState.city).toEqual('Clinton Corners');
  });
  test('result should have no properties in it', () => {
    expect(Object.getOwnPropertyNames(resultInsertAddress).length).toBe(0);
  });

  // Let's update a name value
  let resultUpdateMiddle: {oldValue?: string};
  test('middle initial should be J', () => {
    let appState = testStore.getState();
    // console.log(`appState has name? ${!!appState.name}`);
    resultUpdateMiddle  = changeValue(ActionId.UPDATE_PROPERTY, nameState, 'J', 'middle');
    expect(_.get(appState, 'name.middle')).toEqual('J');
  });
  test('old last middle initial to be F', () => {
    expect(resultUpdateMiddle.oldValue).toEqual('F');
  });

  describe('Verify that mismatched property/container actions throw', () => {
    test('deleting a property should throw when a container is supplied', () => {
      expect(() => { changeValue(ActionId.DELETE_PROPERTY, nameState, undefined, 'address'); }).toThrow();
    });
    test('inserting a property should throw when a container is supplied', () => {
      expect(() => {changeValue(
          ActionId.INSERT_PROPERTY, testStore.getState() as TestState & StateObject,
          addressState, 'address'); }).toThrow();
    });
  });

  describe('insert array of bowling scores to name', () => {
    test('result of adding scores should be {}', () => {
      let addScoresResult = changeValue(ActionId.INSERT_PROPERTY, nameState, bowlingScores, 'bowlingScores');
      expect(addScoresResult).toEqual({});
    });
    test('scores should be a property of names', () => {
      expect(_.get(nameState, 'bowlingScores')).toBe(bowlingScores);
    });
    let newScore = 141;
    test('should be able to insert to the end of the array', () => {
      let appendScoreResult = changeArray(
          ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores,
          newScore, 'bowlingScores', 3);
      expect(appendScoreResult).toEqual({});
    });
    test('new score property should be reachable', () => {
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[3]).toEqual(newScore);
    });
    let firstScore = 101;
    test('insert new first score', () => {
      let firstScoreResult = changeArray(
          ActionId.INSERT_PROPERTY, nameState,  nameState.bowlingScores,
          firstScore, 'bowlingScores', 0);
      expect(firstScoreResult).toEqual({});
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toBe(firstScore);
    });
    test('update the second score', () => {
      let secondScoreResult = changeArray(
          ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 112, 'bowlingScores', 1);
      expect(secondScoreResult).toEqual({oldValue: 111});
      expect(_.get(nameState, 'bowlingScores[1]')).toEqual(112);
    });
    test('delete the third score', () => {
      let deleteThirdResult = changeArray(
          ActionId.DELETE_PROPERTY, nameState, nameState.bowlingScores, undefined, 'bowlingScores', 2);
      expect(deleteThirdResult).toEqual({oldValue: 121});
      expect(bowlingScores.indexOf(121)).toEqual(-1);
    });
    test('array property notation to work', () => {
      let updateFirstBowlingScore = changeArray(
          ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 99, 'bowlingScores', 0);
      expect(updateFirstBowlingScore.oldValue).toEqual(101);
      expect(nameState.bowlingScores).toBe(bowlingScores);
      expect(bowlingScores[0]).toEqual(99);
    });

    test('updating array with same property to fail with MutationError', () => {
      expect(() => {
        changeArray(ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 99, 'bowlingScores', 0);
      }).toThrow();
    });
    test('deleting a container from an array should throw', () => {
      expect(() => {changeArray(
          ActionId.DELETE_STATE_OBJECT, nameState, nameState.bowlingScores,
          undefined, 'bowlingScores', 2); }).toThrow();
    });
    test('inserting beyond the length of the array should throw', () => {
      expect(() => {changeArray(
          ActionId.INSERT_PROPERTY, nameState, nameState.bowlingScores,
          300, 'bowlingScores', 9); }).toThrow();
    });
    test('inserting into an array at a negative index should throw', () => {
      expect(() => {changeArray(
          ActionId.INSERT_PROPERTY, nameState,  nameState.bowlingScores,
          300, 'bowlingScores', -1); } ).toThrow();
    });
  });

  describe('insert "country" property, not part of IAddress', () => {
    test('result of insert country should be {}', () => {
      let resultInsertCountry = changeValue(ActionId.INSERT_PROPERTY, addressState, 'USA', 'country');
      expect(resultInsertCountry).toEqual({});
    });
    test(' address should now have a country', () => {
      expect(_.get(addressState, 'country')).toEqual('USA');
    });
    describe('now delete the country', () => {
      test('result of deleting country should be "{country: "USA"}" ', () => {
        let resultDeleteCountry =  changeValue(ActionId.DELETE_PROPERTY, addressState, '', 'country');
        expect(resultDeleteCountry).toEqual({oldValue: 'USA'});
      });
      test('address should not contain the country property', () => {
        expect(Object.keys(addressState).indexOf('country')).toBeLessThan(0);
      });
    });
    test('the JSON_replaceCyclicParent function, used to remove cyclic references for JSON.stringify', () => {
      let json = JSON.stringify(nameState, JSON_replaceCyclicParent, 4);
      expect(json.indexOf('_parent')).toBeGreaterThan(0);
    });
    test('delete the nameState from the name container', () => {
      let deleteResult = changeValue(
          ActionId.DELETE_STATE_OBJECT, testStore.getState() as TestState & StateObject,
          undefined, 'name');
      expect(deleteResult.oldValue).toBe(nameState);
    });
    test('nameState should be disconnected', () => {
      expect(testStore.getState().name).toBeUndefined();
    });
  });
  /**
   * Mutability is all about changing data within state objects or state objects themselves,
   * remember that we rely on immutability of objects to be rendered.
   */
  describe('Test mutationChecks on mutable objects', () => {
    test('append element directly to array', () => {
      if (!nameState.bowlingScores) {
        throw new Error('Need bowlingScores to be defined to run this test');
      }
      nameState.bowlingScores.push(220);
      expect( () => {
        changeValue(ActionId.UPDATE_PROPERTY, nameState, nameState.bowlingScores, 'bowlingScores');
      }).toThrow();
    });
    test('reinsert same object doesn\'t throw since state objects are recreated upon insertion', () => {
      expect(() => {
        changeValue(ActionId.INSERT_STATE_OBJECT, nameState, nameState.address, 'address');
      }).not.toThrow();
    });
  });
});

// shows that app state can mutate but still be used in maps
describe('Test maps with mutating keys', () => {
  interface Test { name: string; }

  let map: Map<Test, string> = new Map();
  let k1: Test = {name: 'John'};
  map.set(k1, 'Doe');

  let k2: Test = {name: 'Evie' };
  map.set(k2, 'Hammond');

  test('retrieve from the map', () => {
    expect(map.get(k1)).toBe('Doe');
    expect(map.get(k2)).toBe('Hammond');
  });

  k1.name = 'Inspector';
  test('retrieve using same object with different contents', () => {
    expect(map.get(k1)).toBe('Doe');
  });

});
