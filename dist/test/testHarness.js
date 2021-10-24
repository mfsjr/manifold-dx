"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerPromise = exports.createTestStore = exports.createTestState = exports.NameStateCreator = exports.createNameContainer = void 0;
var Store_1 = require("../src/types/Store");
// import { ArrayKeyGeneratorFn, propertyKeyGenerator } from '../src/actions/actions';
var actionCreators_1 = require("../src/actions/actionCreators");
var src_1 = require("../src");
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
function createNameContainer(nameData, parent, myName) {
    // lazy initialization held in a closure
    var actionCreator;
    var _getActionCreator = function (_nameState) {
        if (!actionCreator) {
            actionCreator = new actionCreators_1.ActionCreator(_nameState);
        }
        return actionCreator;
    };
    var addressesActionCreator;
    var getAddressesActionCreator = function (_nameState) {
        addressesActionCreator = addressesActionCreator ||
            new actionCreators_1.ArrayActionCreator(_nameState, _nameState.addresses);
        return addressesActionCreator;
    };
    var nameState = __assign(__assign({ _parent: parent, _myPropname: myName }, nameData), { getActionCreator: _getActionCreator, getAddressesActionCreator: getAddressesActionCreator });
    parent[myName] = nameState;
    return nameState;
}
exports.createNameContainer = createNameContainer;
/**
 * This class creates a POJO that is both a state object and contains action creation functions.
 * Seems a bit more compact than the function-based construction, but can function-based be improved?
 */
var NameStateCreator = /** @class */ (function () {
    function NameStateCreator(nameData, parent, myName) {
        var _this = this;
        this.getActionCreator = function (nameState) { return src_1.getActionCreator(_this.nameState); };
        this.getAddressesActionCreator = function (nameState) { return src_1.getArrayActionCreator(_this.nameState, _this.nameState.addresses); };
        this.nameState = __assign(__assign({}, nameData), { _parent: parent, _myPropname: myName, getAddressesActionCreator: this.getAddressesActionCreator, getActionCreator: this.getActionCreator });
        parent[myName] = this.nameState;
    }
    return NameStateCreator;
}());
exports.NameStateCreator = NameStateCreator;
function createTestState() {
    return {
        _parent: null,
        _myPropname: '',
    };
}
exports.createTestState = createTestState;
/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {Store<TestState>}
 */
function createTestStore() {
    return new Store_1.Store(createTestState(), {});
}
exports.createTestStore = createTestStore;
function timerPromise(millis, resolve) {
    // const resolve = (delay: number) => `waited ${delay}`;
    // const reject = () => {};
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, millis);
    });
}
exports.timerPromise = timerPromise;
//# sourceMappingURL=testHarness.js.map