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
var State_1 = require("../src/types/State");
// import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';
var actionCreators_1 = require("../src/actions/actionCreators");
var actions_1 = require("../src/actions/actions");
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
function createNameContainer(nameData, parent, myName) {
    // lazy initialization held in the closure
    var actionCreator;
    var _getActionCreator = function (_nameState) {
        if (!actionCreator) {
            actionCreator = new actionCreators_1.CrudActionCreator(_nameState);
        }
        return actionCreator;
    };
    // define the keyGeneratorFn, to be used in multiple places below
    var keyGeneratorFn = function (addr) { return actions_1.propertyKeyGenerator(addr, 'street'); };
    var addressesActionCreator;
    var getAddressesActionCreator = function (_nameState) {
        addressesActionCreator = addressesActionCreator ||
            new actionCreators_1.ArrayCrudActionCreator(_nameState, _nameState.addresses, keyGeneratorFn);
        return addressesActionCreator;
    };
    var nameState = __assign({ _parent: parent, _myPropname: myName }, nameData, { 
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
        getActionCreator: _getActionCreator, addressKeyGen: keyGeneratorFn, getAddressesActionCreator: getAddressesActionCreator });
    parent[myName] = nameState;
    return nameState;
}
exports.createNameContainer = createNameContainer;
function createTestState() {
    return {};
}
exports.createTestState = createTestState;
// In a normal application, we would want to create a single state object like this:
// export const testState = new State(createTestState(), {});
/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {Store<TestState>}
 */
function createTestStore() {
    return new State_1.Store(createTestState(), {});
}
exports.createTestStore = createTestStore;
//# sourceMappingURL=testHarness.js.map