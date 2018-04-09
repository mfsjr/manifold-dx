import { Store, StateObject } from '../src/types/State';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';
import { ArrayKeyGeneratorFn } from '../src/actions/actions';
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
    getActionCreator: (nameState: NameState) => CrudActionCreator<Name & StateObject>;
    addressKeyGen: ArrayKeyGeneratorFn<Address>;
    getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
}
export interface NameState extends Name, StateObject, NameAccessors {
}
/**
 * Factory method for creating instances of {@link NameState}.  Note that the technique we use for
 * providing options that are a function of the same NameState, is to provide a function that takes the
 * NameState as an arg and lazily instantiates the object within the closure.
 *
 * Result is that the state object can contain functions that are a function of the same state object.
 *
 * Written out so that the closure variable and the lazy instantiator are side-by-side (fn could be done inline tho)
 *
 * Using getters and setters isn't necessary, just done as an exercise to demonstrate that data passed in could
 * be used directly if needed, rather than copying the key/value pairs via spreads.
 *
 * @param {Name} nameData
 * @param {StateObject} parent
 * @param {string} myName
 * @returns {NameState}
 */
export declare function createNameContainer(nameData: Name, parent: StateObject, myName: string): NameState;
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
 * @returns {Store<TestState>}
 */
export declare function createTestStore(): Store<TestState>;
