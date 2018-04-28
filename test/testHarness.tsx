import { Store, StateObject } from '../src/types/State';
// import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';
import { ArrayCrudActionCreator, CrudActionCreator } from '../src/actions/actionCreators';
import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';

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
export interface NameAccessors {
  getActionCreator: (nameState: NameState) => CrudActionCreator<Name & StateObject>;
  addressKeyGen: ArrayKeyGeneratorFn<Address>;
  getAddressesActionCreator: (nameState: NameState) => ArrayCrudActionCreator<NameState, 'addresses', Address>;
}

export interface NameState extends Name, StateObject, NameAccessors { }

// Example of WebStorm Live Template ("getset") for creating getters and setters
// get $PROPNAME$$END$(): $TYPE$$END$ { return $VAR$$END$; },
// set $PROPNAME$(value: $TYPE$) { $VAR$ = value; },

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
export function createNameContainer(nameData: Name, parent: StateObject, myName: string): NameState {

  // lazy initialization held in the closure
  let actionCreator: CrudActionCreator<NameState>;
  let _getActionCreator = function(_nameState: NameState) {
    if (!actionCreator) {
      actionCreator = new CrudActionCreator<NameState>(_nameState);
    }
    return actionCreator;
  };

  // define the keyGeneratorFn, to be used in multiple places below
  let keyGeneratorFn: ArrayKeyGeneratorFn<Address> =
    (addr: Address): React.Key => propertyKeyGenerator(addr, 'street');

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

    // get prefix(): string | undefined { return nameData.prefix; },
    // set prefix(value: string | undefined) { nameData.prefix = value; },
    //
    // get suffix(): string | undefined { return nameData.suffix; },
    // set suffix(value: string | undefined) { nameData.suffix = value; },
    //
    // get first(): string { return nameData.first; },
    // set first(value: string) { nameData.first = value; },
    //
    // get middle(): string { return nameData.middle; },
    // set middle(value: string) { nameData.middle = value; },
    //
    // get last(): string { return nameData.last; },
    // set last(value: string) { nameData.last = value; },
    //
    // get address(): Address | undefined { return nameData.address; },
    // set address(value: Address | undefined) { nameData.address = value; },
    //
    // get addresses(): Array<Address> { return nameData.addresses; },
    // set addresses(value: Array<Address>) { nameData.addresses = value; },
    //
    // get bowlingScores(): Array<number> { return nameData.bowlingScores; },
    // set bowlingScores(value: Array<number>) { nameData.bowlingScores = value; },

    getActionCreator: _getActionCreator,

    addressKeyGen: keyGeneratorFn,

    getAddressesActionCreator

  };
  parent[myName] = nameState;
  return nameState;
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
 * @returns {Store<TestState>}
 */
export function createTestStore() {
  return new Store(createTestState(), {});
}
