import { State, StateObject } from '../src/types/State';
import { ArrayKeyGeneratorFn } from '../src/actions/actions';
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
    addressesActionCreator: ArrayCrudActionCreator<Name & StateObject, Address>;
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
export declare function createNameContainer(nameData: Name, parent: StateObject, myName: string): Name & StateObject;
export interface TestState {
    name?: Name & StateObject;
    me?: Name & StateObject;
    address?: Address & StateObject;
    appName?: string;
}
export declare function createTestState(): TestState;
/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {State<TestState>}
 */
export declare function createAppTestState(): State<TestState>;
