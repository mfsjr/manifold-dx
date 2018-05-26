import { Store, StateObject } from '../src/types/State';
// import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';
import { ArrayKeyGeneratorFn } from '../src/actions/actions';
import { getArrayCrudCreator, getCrudCreator } from '../src';

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
// export interface NameAccessors {
//   getActionCreator: (nameState: NameState) => CrudActionCreator<Name & StateObject>;
//   addressKeyGen: ArrayKeyGeneratorFn<Address>;
//   getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
// }

export interface NameState extends Name, StateObject {
  getActionCreator: (nameState: NameState) => CrudActionCreator<Name & StateObject>;
  addressKeyGen: ArrayKeyGeneratorFn<Address>;
  getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
}

// Example of WebStorm Live Template ("getset") for creating getters and setters
// get $PROPNAME$$END$(): $TYPE$$END$ { return $VAR$$END$; },
// set $PROPNAME$(value: $TYPE$) { $VAR$ = value; },

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
export function createNameContainer(nameData: Name, parent: StateObject, myName: string): NameState {
  // lazy initialization held in a closure
  let actionCreator: CrudActionCreator<NameState>;
  let _getActionCreator = function(_nameState: NameState) {
    if (!actionCreator) {
      actionCreator = new CrudActionCreator<NameState>(_nameState);
    }
    return actionCreator;
  };

  // define the keyGeneratorFn, to be used in multiple places below
  let keyGeneratorFn: ArrayKeyGeneratorFn<Address> = (address: Address) => address.id;

  let addressesActionCreator: ArrayCrudActionCreator<NameState, 'addresses', Address>;
  let getAddressesActionCreator = function(_nameState: NameState) {
    addressesActionCreator = addressesActionCreator ||
      new ArrayCrudActionCreator(_nameState, _nameState.addresses, keyGeneratorFn);
    return addressesActionCreator;
  };

  let nameState: NameState = {
    _parent: parent,
    _myPropname: myName,
    ...nameData,
    getActionCreator: _getActionCreator,
    addressKeyGen: (address: Address) => address.id,
    getAddressesActionCreator
  };
  parent[myName] = nameState;
  return nameState;
}

/**
 * This class creates a POJO that is both a state object and contains action creation functions.
 * Seems a bit more compact than the function-based construction, but can function-based be improved?
 */
export class NameStateCreator {
  public nameState: NameState;

  constructor(nameData: Name, parent: StateObject, myName: string) {
    this.nameState = {
      ...nameData,
      _parent: parent,
      _myPropname: myName,
      addressKeyGen: (address: Address) => address.id,
      getAddressesActionCreator: this.getAddressesActionCreator,
      getActionCreator: this.getActionCreator
    };
    parent[myName] = this.nameState;
  }
  
  getActionCreator = (nameState: NameState) => getCrudCreator(this.nameState);

  getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address> =
    (nameState: NameState) => getArrayCrudCreator(
      this.nameState, this.nameState.addresses, this.nameState.addressKeyGen)
}

export interface TestState {
  name?: Name & StateObject;
  me?: Name & StateObject;
  address?: Address & StateObject;
  appName?: string;
  helper?: () => string;
}

export function createTestState(): TestState {
  return {};
}

/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {Store<TestState>}
 */
export function createTestStore() {
  return new Store(createTestState(), {});
}
