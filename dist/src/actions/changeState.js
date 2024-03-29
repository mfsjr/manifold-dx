"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeValue = exports.changeArray = exports.validateArrayIndex = void 0;
var actions_1 = require("./actions");
var _ = require("lodash");
var StateMutationCheck_1 = require("../types/StateMutationCheck");
var Store_1 = require("../types/Store");
/**
 * These are reducers invoked by actions, the only place where state may be changed.
 */
/**
 * Check to see that the provided indexes are valid for the given action type (allowing for insertions at the end
 * of the array), throw an informative error if not.
 */
/* tslint:disable:no-any */
function validateArrayIndex(actionType, ra, index, propertyName) {
    /* tslint:enable:no-any */
    var di = actionType === actions_1.ActionId.INSERT_PROPERTY || actionType === actions_1.ActionId.INSERT_STATE_OBJECT ? 1 : 0;
    var max = ra.length - 1 + di;
    if (index < 0 || index > max) {
        throw new Error("Index=".concat(index, " is not in [0, ").concat(ra.length, "] for array property=").concat(propertyName));
    }
    return ra;
}
exports.validateArrayIndex = validateArrayIndex;
var throwIf = function (condition, message) {
    if (condition) {
        throw new Error(message);
    }
};
/**
 * Used by callers to throw a message about unexpected types of mutations.
 */
/* tslint:disable:no-any */
var actionMutationCheck = function (actionId, oldValue, newValue, propertyName, index) {
    /* tslint:enable:no-any */
    if (oldValue === newValue && actionId !== actions_1.ActionId.UPDATE_PROPERTY_NO_OP) {
        var oldJson = JSON.stringify(oldValue, Store_1.JSON_replaceCyclicParent, 4);
        var newJson = JSON.stringify(newValue, Store_1.JSON_replaceCyclicParent, 4);
        var message = "Action mutation check (".concat(actions_1.ActionId[actionId], ")  \n      mutation in property '").concat(propertyName, "', oldValue=").concat(oldJson, ", newValue=").concat(newJson);
        message = index !== undefined ? "at index=".concat(index, ", ").concat(message, " ") : message;
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
function changeArray(actionType, stateObject, values, value, propertyName, index) {
    if (!values) {
        throw new Error("".concat(propertyName, " array is falsy, insert the array property before trying to change it"));
    }
    validateArrayIndex(actionType, values, index, propertyName);
    switch (actionType) {
        case actions_1.ActionId.UPDATE_PROPERTY_NO_OP ||
            actions_1.ActionId.INSERT_PROPERTY_NO_OP ||
            actions_1.ActionId.DELETE_PROPERTY_NO_OP:
            return { oldValue: value };
        case actions_1.ActionId.UPDATE_PROPERTY: {
            var oldValue = values[index];
            values[index] = value;
            actionMutationCheck(actionType, oldValue, value, propertyName, index);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_PROPERTY: {
            values.splice(index, 0, value);
            actionMutationCheck(actionType, undefined, value, propertyName, index);
            return {};
        }
        case actions_1.ActionId.DELETE_PROPERTY: {
            var subArray = values.splice(index, 1);
            return { oldValue: subArray[0] };
        }
        case actions_1.ActionId.RERENDER: {
            return { oldValue: values[index] };
        }
        default: throw new Error("changeArray: unhandled actionType=".concat(actionType));
    }
}
exports.changeArray = changeArray;
function changeValue(actionType, stateObject, value, propertyName) {
    if (!propertyName) {
        throw new Error("propertyName must be a string!");
    }
    switch (actionType) {
        case actions_1.ActionId.RERENDER: {
            return { oldValue: stateObject[propertyName] };
        }
        case actions_1.ActionId.UPDATE_PROPERTY_NO_OP:
        case actions_1.ActionId.INSERT_PROPERTY_NO_OP:
        case actions_1.ActionId.DELETE_PROPERTY_NO_OP: {
            return { oldValue: stateObject[propertyName] };
        }
        case actions_1.ActionId.UPDATE_PROPERTY: {
            var isStateObject = Store_1.Store.isInstanceOfStateObject(value);
            throwIf(isStateObject, "".concat(actions_1.ActionId[actionType], " action isn't applicable to state objects"));
            var oldValue = _.get(stateObject, propertyName);
            actionMutationCheck(actionType, oldValue, value, propertyName);
            _.set(stateObject, propertyName, value);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_PROPERTY: {
            var isStateObject = Store_1.Store.isInstanceOfStateObject(value);
            throwIf(isStateObject, "".concat(actions_1.ActionId[actionType], " action is not applicable to state objects"));
            // only assign if value is not undefined
            if (value === undefined) {
                throw new Error('Cannot insert an undefined value, consider deleting instead');
            }
            // let oldValue: S[K] = stateObject[propertyName];
            // if (oldValue !== undefined && oldValue !== null) {
            //   throw new Error('Cannot insert where data already exists');
            // }
            // TODO: seems this should be uncommented, unless we decide ease-of-use is more important, and we document it
            if (stateObject[propertyName]) {
                throw new Error('Cannot insert, a value already exists, use update instead');
            }
            stateObject[propertyName] = value;
            actionMutationCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_PROPERTY: {
            var isStateObject = Store_1.Store.isInstanceOfStateObject(_.get(stateObject, propertyName));
            throwIf(isStateObject, "".concat(actions_1.ActionId[actionType], " action isn''t applicable to state objects"));
            // delete performance is improving but still slow, but these are likely to be rare.
            // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
            var oldValue = stateObject[propertyName];
            _.unset(stateObject, propertyName);
            actionMutationCheck(actionType, oldValue, undefined, propertyName);
            return { oldValue: oldValue };
        }
        case actions_1.ActionId.INSERT_STATE_OBJECT: {
            throwIf(!_.isPlainObject(value), "".concat(actions_1.ActionId[actionType], " action is applicable to plain objects; value = ").concat(value));
            if (!value) {
                throw new Error('Cannot insert a falsy value, consider using delete instead');
            }
            Store_1.Store.convertAndAdd(stateObject, propertyName, value);
            actionMutationCheck(actionType, undefined, value, propertyName);
            return {};
        }
        case actions_1.ActionId.DELETE_STATE_OBJECT: {
            var oldValue = _.get(stateObject, propertyName);
            var isStateObject = Store_1.Store.isInstanceOfStateObject(oldValue);
            throwIf(!isStateObject, "".concat(actions_1.ActionId[actionType], " action is applicable to state objects; value = ").concat(oldValue));
            var valueStateObject = _.get(stateObject, propertyName);
            if (Store_1.Store.isInstanceOfStateObject(valueStateObject)) {
                actionMutationCheck(actionType, oldValue, undefined, propertyName);
                // delete the valueStateObject from the app state graph
                _.unset(stateObject, propertyName);
                // delete the stateObject from mappings of state to react commentsUI
                // disable _parent as an indicator, and to prevent accidental traversal
                valueStateObject._parent = valueStateObject;
            }
            else {
                throw new Error("Expecting a StateObject for ".concat(propertyName, " but is not a StateObject"));
            }
            return { oldValue: oldValue };
        }
        default:
            throw new Error("Unhandled actionType=".concat(actionType));
    }
}
exports.changeValue = changeValue;
//# sourceMappingURL=changeState.js.map