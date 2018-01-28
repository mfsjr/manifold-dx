"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
var _ = require("lodash");
var StateMutationCheck_1 = require("../types/StateMutationCheck");
var State_1 = require("../types/State");
/* tslint:disable:no-any */
var validateArrayIndex = function (actionType, ra, index, propertyName) {
    /* tslint:enable:no-any */
    var di = actionType === actions_1.ActionId.INSERT_PROPERTY || actionType === actions_1.ActionId.INSERT_STATE_OBJECT ? 1 : 0;
    var max = ra.length - 1 + di;
    if (index < 0 || index > max) {
        throw new Error("Index=" + index + " is not in [0, " + ra.length + "] for array property=" + propertyName);
    }
    return ra;
};
var throwIf = function (condition, message) {
    if (condition) {
        throw new Error(message);
    }
};
/* tslint:disable:no-any */
var actionImmutabilityCheck = function (actionId, oldValue, newValue, propertyName, index) {
    /* tslint:enable:no-any */
    if (oldValue === newValue) {
        var message = "Action immutability violated: " + actions_1.ActionId[actionId] + ": \n      mutation in property '" + propertyName + "', oldValue=" + oldValue + ", newValue=" + newValue;
        message = index ? message + " at index=" + index : message;
        throw new StateMutationCheck_1.MutationError(message);
    }
};
// see https://github.com/Microsoft/TypeScript/issues/20771
/**
 * @deprecated may be able to resurrect this if/when this is fixed: https://github.com/Microsoft/TypeScript/issues/20771
 * @param {ActionId} actionType
 * @param {S} stateObject
 * @param {Array<S[K][V]> | undefined} values
 * @param {S[K][V]} value
 * @param {K} propertyName
 * @param {number} index
 * @returns {{oldValue?: S[K][V]}}
 */
function mutateArray(actionType, stateObject, values, value, propertyName, index) {
    if (!values) {
        throw new Error(propertyName + " array is falsey, insert the array property before trying to change it");
    }
    validateArrayIndex(actionType, values, index, propertyName);
    switch (actionType) {
        case actions_1.ActionId.UPDATE_PROPERTY: {
            var oldValue = values[index];
            values[index] = value;
            actionImmutabilityCheck(actionType, oldValue, value, propertyName, index);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_PROPERTY: {
            values.splice(index, 0, value);
            actionImmutabilityCheck(actionType, undefined, value, propertyName, index);
            return {};
        }
        case actions_1.ActionId.DELETE_PROPERTY: {
            var subArray = values.splice(index, 1);
            return { oldValue: subArray[0] };
        }
        default: throw new Error("mutateArray: unhandled actionType=" + actionType);
    }
}
exports.mutateArray = mutateArray;
function mutateValue(actionType, stateObject, value, propertyName) {
    switch (actionType) {
        case actions_1.ActionId.UPDATE_PROPERTY: {
            var isStateObject = State_1.State.isInstanceOfStateObject(value);
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action isn't applicable to state objects");
            var oldValue = _.get(stateObject, propertyName);
            actionImmutabilityCheck(actionType, oldValue, value, propertyName);
            _.set(stateObject, propertyName, value);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_PROPERTY: {
            var isStateObject = State_1.State.isInstanceOfStateObject(value);
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action is not applicable to state objects");
            // NOTE: we don't care if its an object, the user will have to be aware and handle it
            stateObject[propertyName] = value;
            actionImmutabilityCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_PROPERTY: {
            var isStateObject = State_1.State.isInstanceOfStateObject(_.get(stateObject, propertyName));
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action isn''t applicable to state objects");
            // delete performance is improving but still slow, but these are likely to be rare.
            // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
            var oldValue = stateObject[propertyName];
            _.unset(stateObject, propertyName);
            actionImmutabilityCheck(actionType, oldValue, value, propertyName);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_STATE_OBJECT: {
            throwIf(!_.isPlainObject(value), actions_1.ActionId[actionType] + " action is applicable to plain objects; value = " + value);
            State_1.State.createStateObject(stateObject, propertyName, value);
            actionImmutabilityCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_STATE_OBJECT: {
            var oldValue = _.get(stateObject, propertyName);
            var isStateObject = State_1.State.isInstanceOfStateObject(oldValue);
            throwIf(!isStateObject, actions_1.ActionId[actionType] + " action is applicable to state objects; value = " + oldValue);
            var valueStateObject = _.get(stateObject, propertyName);
            actionImmutabilityCheck(actionType, oldValue, value, propertyName);
            // delete the valueStateObject from the app state graph
            _.unset(stateObject, propertyName);
            // delete the stateObject from mappings of state to react commentsUI
            // disable __parent__ as an indicator, and to prevent accidental traversal
            valueStateObject.__parent__ = valueStateObject;
            return { oldValue: oldValue };
        }
        default:
            throw new Error("Unhandled actionType=" + actionType);
    }
}
exports.mutateValue = mutateValue;
//# sourceMappingURL=mutations.js.map