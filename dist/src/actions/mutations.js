"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
var _ = require("lodash");
var StateMutationCheck_1 = require("../types/StateMutationCheck");
var State_1 = require("../types/State");
/**
 * StateObjects are mutated here, any other mutations will be detected and throw an error.
 */
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
        var oldJson = JSON.stringify(oldValue, State_1.JSON_replaceCyclicParent, 4);
        var newJson = JSON.stringify(newValue, State_1.JSON_replaceCyclicParent, 4);
        var message = "Action immutability violated (" + actions_1.ActionId[actionId] + ")  \n      mutation in property '" + propertyName + "', oldValue=" + oldJson + ", newValue=" + newJson;
        message = index !== undefined ? "at index=" + index + ", " + message + " " : message;
        throw new StateMutationCheck_1.MutationError(message);
    }
};
// seems like changes to 2.7 and our simplifications have eliminated this problem:
// https://github.com/Microsoft/TypeScript/issues/20771
/**
 *
 * @param {ActionId} actionType
 * @param {S} stateObject
 * @param {Array<V> | undefined} values
 * @param {V} value
 * @param {K} propertyName
 * @param {number} index
 * @returns {{oldValue?: V}}
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
        case actions_1.ActionId.NULL: {
            return { oldValue: values[index] };
        }
        default: throw new Error("mutateArray: unhandled actionType=" + actionType);
    }
}
exports.mutateArray = mutateArray;
function mutateValue(actionType, stateObject, value, propertyName) {
    switch (actionType) {
        case actions_1.ActionId.UPDATE_PROPERTY: {
            var isStateObject = State_1.Store.isInstanceOfStateObject(value);
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action isn't applicable to state objects");
            var oldValue = _.get(stateObject, propertyName);
            actionImmutabilityCheck(actionType, oldValue, value, propertyName);
            _.set(stateObject, propertyName, value);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_PROPERTY: {
            var isStateObject = State_1.Store.isInstanceOfStateObject(value);
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action is not applicable to state objects");
            // only assign if value is not undefined or null
            if (value === undefined || value == null) {
                throw new Error('Cannot insert an undefined/null value, consider deleting instead');
            }
            // TODO: seems this should be uncommented, unless we decide ease-of-use is more important, and we document it
            // if (stateObject[propertyName]) {
            //   throw new Error('Cannot insert, a value already exists, use update instead');
            // }
            stateObject[propertyName] = value;
            actionImmutabilityCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_PROPERTY: {
            var isStateObject = State_1.Store.isInstanceOfStateObject(_.get(stateObject, propertyName));
            throwIf(isStateObject, actions_1.ActionId[actionType] + " action isn''t applicable to state objects");
            // delete performance is improving but still slow, but these are likely to be rare.
            // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
            var oldValue = stateObject[propertyName];
            _.unset(stateObject, propertyName);
            // TODO: is this really necessary?
            actionImmutabilityCheck(actionType, oldValue, value, propertyName);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_STATE_OBJECT: {
            throwIf(!_.isPlainObject(value), actions_1.ActionId[actionType] + " action is applicable to plain objects; value = " + value);
            if (!value) {
                throw new Error('Cannot insert a falsey value, consider using delete instead');
            }
            State_1.Store.createStateObject(stateObject, propertyName, value);
            actionImmutabilityCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_STATE_OBJECT: {
            var oldValue = _.get(stateObject, propertyName);
            var isStateObject = State_1.Store.isInstanceOfStateObject(oldValue);
            throwIf(!isStateObject, actions_1.ActionId[actionType] + " action is applicable to state objects; value = " + oldValue);
            var valueStateObject = _.get(stateObject, propertyName);
            if (State_1.Store.isInstanceOfStateObject(valueStateObject)) {
                actionImmutabilityCheck(actionType, oldValue, value, propertyName);
                // delete the valueStateObject from the app state graph
                _.unset(stateObject, propertyName);
                // delete the stateObject from mappings of state to react commentsUI
                // disable _parent as an indicator, and to prevent accidental traversal
                valueStateObject._parent = valueStateObject;
            }
            else {
                throw new Error("Expecting a StateObject for " + propertyName + " but is not a StateObject");
            }
            return { oldValue: oldValue };
        }
        default:
            throw new Error("Unhandled actionType=" + actionType);
    }
}
exports.mutateValue = mutateValue;
//# sourceMappingURL=mutations.js.map