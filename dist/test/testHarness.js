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
var actions_1 = require("../src/actions/actions");
var actionCreators_1 = require("../src/actions/actionCreators");
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
function createNameContainer(nameData, parent, myName) {
    var nameStateData = __assign({ _my_propname: myName, _parent: parent }, nameData);
    // define the keyGeneratorFn, to be used in multiple places below
    var keyGeneratorFn = function (addr) { return actions_1.propertyKeyGenerator(addr, 'street'); };
    // build NameAccessors
    var accessors = {
        actionCreator: new actionCreators_1.CrudActionCreator(nameStateData),
        addressKeyGen: keyGeneratorFn,
        addressesActionCreator: new actionCreators_1.ArrayCrudActionCreator(nameStateData, nameStateData.addresses, keyGeneratorFn)
    };
    nameStateData["_accessors"] = accessors;
    parent[myName] = nameStateData;
    return nameStateData;
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
 * @returns {State<TestState>}
 */
function createAppTestState() {
    return new State_1.State(createTestState(), {});
}
exports.createAppTestState = createAppTestState;
//# sourceMappingURL=testHarness.js.map