import { State, StateObject } from '../src/types/State';
import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Name {
  prefix?: string;
  suffix?: string;
  first: string;
  middle: string;
  last: string;
  address?: Address;
  addresses: Array<Address>;
  bowlingScores: Array<number>;
}

/**
 * Accessors to be used on our Name & StateObject data.
 */
export interface NameAccessors {
  actionCreator: CrudActionCreator<Name & StateObject>;
  addressKeyGen: ArrayKeyGeneratorFn<Address>;
  addressesActionCreator: ArrayCrudActionCreator<Name & StateObject, keyof Name & StateObject, Address>;
}

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
export function createNameContainer(nameData: Name, parent: StateObject, myName: string): Name & StateObject {
  let nameStateData: Name & StateObject = {
    _myPropname: myName,
    _parent: parent,
    ...nameData,
  };
  // define the keyGeneratorFn, to be used in multiple places below
  let keyGeneratorFn: ArrayKeyGeneratorFn<Address> =
    (addr: Address): React.Key => propertyKeyGenerator(addr, 'street');

  // build NameAccessors
  let accessors: NameAccessors = {
    actionCreator: new CrudActionCreator(nameStateData),
    addressKeyGen: keyGeneratorFn,
    addressesActionCreator: new ArrayCrudActionCreator(nameStateData, nameStateData.addresses, keyGeneratorFn)
  };
  nameStateData[`_accessors`] = accessors;
  parent[myName] = nameStateData;
  return nameStateData;
}

export interface TestState {
  name?: Name & StateObject;
  me?: Name & StateObject;
  address?: Address & StateObject;
  appName?: string;
}

export function createTestState(): TestState {
  return {};
}

// In a normal application, we would want to create a single state object like this:
// export const testState = new State(createTestState(), {});

/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {State<TestState>}
 */
export function createAppTestState() {
  return new State(createTestState(), {});
}
