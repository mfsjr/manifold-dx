import { ActionId } from './actions';
import * as _ from 'lodash';
import { MutationError } from '../types/StateMutationCheck';
import { JSON_replaceCyclicParent, StateObject, Store } from '../types/Store';

/**
 * These are reducers invoked by actions, the only place where state may be changed.
 */

/**
 * Check to see that the provided indexes are valid for the given action type (allowing for insertions at the end
 * of the array), throw an informative error if not.
 */
/* tslint:disable:no-any */
export function validateArrayIndex(actionType: ActionId, ra: Array<any>, index: number,  propertyName: string) {
  /* tslint:enable:no-any */
  let di = actionType === ActionId.INSERT_PROPERTY || actionType === ActionId.INSERT_STATE_OBJECT ? 1 : 0;
  let max = ra.length - 1 + di;
  if (index < 0 || index > max) {
    throw new Error(`Index=${index} is not in [0, ${ra.length}] for array property=${propertyName}`);
  }
  return ra;
}

let throwIf = function(condition: boolean, message: string) {
  if (condition) {
    throw new Error(message);
  }
};

/**
 * Used by callers to throw a message about unexpected types of mutations.
 */
/* tslint:disable:no-any */
let actionMutationCheck = function(actionId: ActionId, oldValue: any, newValue: any,
                                   propertyName: any, index?: number) {
  /* tslint:enable:no-any */
  if (oldValue === newValue && actionId !== ActionId.UPDATE_PROPERTY_NO_OP) {
    let oldJson = JSON.stringify(oldValue, JSON_replaceCyclicParent, 4);
    let newJson = JSON.stringify(newValue, JSON_replaceCyclicParent, 4);
    let message = `Action mutation check (${ActionId[actionId]})  
      mutation in property '${propertyName}', oldValue=${oldJson}, newValue=${newJson}`;
    message = index !== undefined ? `at index=${index}, ${message} ` : message;
    throw new MutationError(message);
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
export function changeArray<S extends StateObject, K extends Extract<keyof S, string>, V>
(actionType: ActionId, stateObject: S, values: Array<V>,
 value: V,  propertyName: K, index: number)
: {oldValue?: V} {

  if (!values) {
    throw new Error(`${propertyName} array is falsy, insert the array property before trying to change it`);
  }
  validateArrayIndex(actionType, values, index, propertyName);
  switch (actionType) {
    case ActionId.UPDATE_PROPERTY_NO_OP ||
         ActionId.INSERT_PROPERTY_NO_OP ||
         ActionId.DELETE_PROPERTY_NO_OP:
      return {oldValue: value};
    case ActionId.UPDATE_PROPERTY: {
      let oldValue: V = values[index];
      values[index] = value;
      actionMutationCheck(actionType, oldValue, value, propertyName, index);
      return {oldValue: oldValue};
    }
    case ActionId.INSERT_PROPERTY: {
      values.splice(index, 0, value);
      actionMutationCheck(actionType, undefined, value, propertyName, index);
      return {};
    }
    case ActionId.DELETE_PROPERTY: {
      let subArray = values.splice(index, 1);
      return {oldValue: subArray[0]};
    }
    case ActionId.RERENDER: {
      return { oldValue: values[index] };
    }
    default: throw new Error(`changeArray: unhandled actionType=${actionType}`);
  }
}

export function changeValue<S extends StateObject, K extends Extract<keyof S, string>>
(actionType: ActionId, stateObject: S, value: S[K] | undefined, propertyName: K)
: { oldValue?: S[K] } {
  if (!propertyName) {
    throw new Error(`propertyName must be a string!`);
  }
  switch (actionType) {
    case ActionId.RERENDER: {
      return { oldValue: stateObject[propertyName] };
    }
    case ActionId.UPDATE_PROPERTY_NO_OP ||
         ActionId.INSERT_PROPERTY_NO_OP ||
         ActionId.DELETE_PROPERTY_NO_OP:
      return {oldValue: value};
    case ActionId.UPDATE_PROPERTY: {
      let isStateObject = Store.isInstanceOfStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action isn't applicable to state objects`);
      let oldValue: S[K] = _.get(stateObject, propertyName);
      actionMutationCheck(actionType, oldValue, value, propertyName);
      _.set(stateObject, propertyName, value);
      return {oldValue: oldValue};
    }
    case ActionId.INSERT_PROPERTY: {
      let isStateObject = Store.isInstanceOfStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action is not applicable to state objects`);
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
    case ActionId.DELETE_PROPERTY: {
      let isStateObject = Store.isInstanceOfStateObject(_.get(stateObject, propertyName));
      throwIf(isStateObject, `${ActionId[actionType]} action isn''t applicable to state objects`);
      // delete performance is improving but still slow, but these are likely to be rare.
      // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
      let oldValue: S[K] = stateObject[propertyName];
      _.unset(stateObject, propertyName);

      actionMutationCheck(actionType, oldValue, undefined, propertyName);

      return {oldValue: oldValue};
    }
    case ActionId.INSERT_STATE_OBJECT: {
      throwIf(
        !_.isPlainObject(value),
        `${ActionId[actionType]} action is applicable to plain objects; value = ${value}`);

      if (!value) {
        throw new Error('Cannot insert a falsy value, consider using delete instead');
      }
      Store.convertAndAdd<S[K]>(stateObject, propertyName, value);
      actionMutationCheck(actionType, undefined, value, propertyName);
      return {};
    }
    case ActionId.DELETE_STATE_OBJECT: {
      let oldValue: S[K] = _.get(stateObject, propertyName);
      let isStateObject = Store.isInstanceOfStateObject(oldValue);
      throwIf(!isStateObject, `${ActionId[actionType]} action is applicable to state objects; value = ${oldValue}`);
      let valueStateObject = _.get(stateObject, propertyName);
      if (Store.isInstanceOfStateObject(valueStateObject)) {
        actionMutationCheck(actionType, oldValue, undefined, propertyName);

        // delete the valueStateObject from the app state graph
        _.unset(stateObject, propertyName);
        // delete the stateObject from mappings of state to react commentsUI
        // disable _parent as an indicator, and to prevent accidental traversal
        valueStateObject._parent = valueStateObject;
      } else {
        throw new Error(`Expecting a StateObject for ${propertyName} but is not a StateObject`);
      }

      return {oldValue: oldValue};
    }
    default:
      throw new Error(`Unhandled actionType=${actionType}`);
  }
}
