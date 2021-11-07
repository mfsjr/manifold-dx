"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFailureDiff = void 0;
var jsondiffpatch_1 = require("jsondiffpatch");
var _ = require("lodash");
var Store_1 = require("./Store");
var StateMutationCheck_1 = require("./StateMutationCheck");
/**
 * Separating this script from {@link StateMutationCheck} opens up the possibility of
 * doing environment-based initialization at some point in the future.
 *
 * Right now, there's no obvious way to do that, since start.js and test.js
 * scripts are written in JS, and we can't initialize this from those places (easily, yet).
 *
 * @type {DiffPatcher}
 */
var diffPatcher = new jsondiffpatch_1.DiffPatcher();
var onFailureDiff = function (baseline, failure) {
    // console.log(`StateMutationCheck failed: `);
    var baselineClone = _.cloneDeep(baseline);
    Store_1.Store.stripStateObject(baselineClone);
    var failureClone = _.cloneDeep(failure);
    Store_1.Store.stripStateObject(failureClone);
    var delta = diffPatcher.diff(baselineClone, failureClone);
    var result = JSON.stringify(delta, null, 4);
    // console.log(result);
    throw new StateMutationCheck_1.MutationError(result);
};
exports.onFailureDiff = onFailureDiff;
//# sourceMappingURL=StateMutationDiagnostics.js.map