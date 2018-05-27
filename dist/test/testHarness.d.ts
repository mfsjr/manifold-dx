import { Store, StateObject } from '../src/types/State';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';
import { ArrayKeyGeneratorFn } from '../src/actions/actions';
export interface Address {
    id: number;
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
export interface NameState extends Name, StateObject {
    getActionCreator: (nameState: NameState) => CrudActionCreator<Name & StateObject>;
    addressKeyGen: ArrayKeyGeneratorFn<Address>;
    getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
}
/**
 * Factory method for creating instances of {@link NameState}.  Note that the technique we use for
 * providing options that are a function of the same NameState, is to provide a function that takes the
 * NameState as an arg and lazily instantiates the object within a closure.
 *
 * Result is that the state object can contain functions that are a function of the same state object.
 *
 * Written out so that the closure variable and the lazy instantiator are side-by-side (fn could be done inline tho)
 *
 * @param {Name} nameData
 * @param {StateObject} parent
 * @param {string} myName
 * @returns {NameState}
 */
export declare function createNameContainer(nameData: Name, parent: StateObject, myName: string): NameState;
/**
 * This class creates a POJO that is both a state object and contains action creation functions.
 * Seems a bit more compact than the function-based construction, but can function-based be improved?
 */
export declare class NameStateCreator {
    nameState: NameState;
    constructor(nameData: Name, parent: StateObject, myName: string);
    getActionCreator: (nameState: NameState) => CrudActionCreator<NameState>;
    getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
}
export interface TestState {
    name?: Name & StateObject;
    me?: Name & StateObject;
    address?: Address & StateObject;
    appName?: string;
    helper?: () => string;
}
export declare function createTestState(): TestState;
/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {Store<TestState>}
 */
export declare function createTestStore(): Store<TestState>;
