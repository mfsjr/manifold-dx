"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMutationCheck = exports.MutationError = void 0;
var _ = require("lodash");
var MutationError = /** @class */ (function (_super) {
    __extends(MutationError, _super);
    function MutationError(message) {
        return _super.call(this, message) || this;
    }
    return MutationError;
}(Error));
exports.MutationError = MutationError;
/**
 * Default implementation for lightweight state mutation warnings, meaning that
 * libraries that do diagnostics are not loaded.  To be used only in PROD, non-PROD
 * environments should be using StateMutationDiagnostics "onFailureDiff".
 *
 * @param {S} baseline
 * @param {S} failure
 * @returns {string}
 */
var onFailureWarn = function (baseline, failure) {
    var result = "StateMutationCheck ERROR: state is being changed by something other than an action!!!";
    throw new MutationError(result);
};
/**
 * This class implements mutation checking by taking, storing and testing snapshots
 * of application state, and should only be used in non-prod environments (and obviously
 * automated testing).
 *
 * If a developer accidentally makes a change to any piece of state data, other than through
 * actions, this is what can detect and warns you about it.  You should use it for all your
 * testing and development.
 *
 * It relies on lodash _.isEqual for deep comparison, and if not equal, will print out the
 * differences.
 *
 * This should always be disabled in production!
 *
 */
var StateMutationCheck = /** @class */ (function () {
    function StateMutationCheck(store, onFailure) {
        this.enabled = false;
        this.store = store;
        this.onFailure = onFailure ? onFailure : onFailureWarn;
        // this.enableMutationChecks();
    }
    StateMutationCheck.prototype.isEnabled = function () {
        return this.enabled;
    };
    StateMutationCheck.prototype.enableMutationChecks = function () {
        this.lastGood = _.cloneDeep(this.store.getState());
        this.enabled = true;
    };
    StateMutationCheck.prototype.disableMutationChecks = function () {
        this.enabled = false;
    };
    StateMutationCheck.prototype.check = function (testState) {
        if (!_.isEqual(this.lastGood, testState)) {
            this.onFailure(this.lastGood, testState);
        }
    };
    StateMutationCheck.prototype.postActionCopyState = function (actions) {
        this.lastGood = _.cloneDeep(this.store.getState());
        return actions;
    };
    StateMutationCheck.prototype.preActionStateCheck = function (actions) {
        this.check(this.store.getState());
        return actions;
    };
    return StateMutationCheck;
}());
exports.StateMutationCheck = StateMutationCheck;
//# sourceMappingURL=StateMutationCheck.js.map