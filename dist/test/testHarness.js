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
function createTestState() {
    return {};
}
exports.createTestState = createTestState;
exports.testState = new State_1.State(createTestState(), {});
var nameSample = {
    first: 'Bo',
    middle: 'F',
    last: 'Jackson',
    bowlingScores: [300],
    addresses: []
};
/**
 * A factory method for StateObjects with accessor methods.
 *
 * This simple example intends only to demo how methods can be added and StateObjects generated,
 * note that these accessors violate the framework rule that state changes may only be performed
 * by actions.
 *
 * @param {Name} nameData
 * @param {StateObject} parent
 * @param {string} myPropertyName
 * @returns {NameState & StateObject}
 */
function createNameState(nameData, parent, myPropertyName) {
    var result = __assign({ __parent__: parent, __my_propname__: myPropertyName }, nameData, { 
        // NOTE that these accessors violate state changes only by actions, they're here only for demonstration
        __accessors__: {
            updateFirst: function (newFirst) {
                var oldName = result.first;
                result.first = newFirst;
                return oldName;
            },
            appendScore: function (score) {
                result.bowlingScores.push(score);
                return result.bowlingScores.length;
            },
        } });
    result.__parent__[result.__my_propname__] = result;
    return result;
}
exports.nameState = createNameState(nameSample, State_1.State.createState(), 'myname');
exports.nameState.__accessors__.appendScore(240);
exports.nameState.__accessors__.updateFirst('Matt');
// /* tslint:disable:no-console */
// console.log(`nameState = ${JSON.stringify(nameState, JSON_replaceCyclicParent, 4)}`);
// // nope: console.log(ns2.first);
// /* tslint:enable:no-console */
// interface Mine {
//   phone: string;
//   homeValue: number;
//   accessors?: NameAccessors;
// }
//# sourceMappingURL=testHarness.js.map