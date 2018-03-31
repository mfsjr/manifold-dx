import { ActionId, arrayKeyIndexMap } from './actions';
import * as _ from 'lodash';
import { MutationError } from '../types/StateMutationCheck';
import { StateObject, State } from '../types/State';
import { Manager } from '../types/Manager';

/* tslint:disable:no-any */
let validateArrayIndex = function(actionType: ActionId, ra: Array<any>, index: number,  propertyName: string) {
  /* tslint:enable:no-any */
  let di = actionType === ActionId.INSERT_PROPERTY || actionType === ActionId.INSERT_STATE_OBJECT ? 1 : 0;
  let max = ra.length - 1 + di;
  if (index < 0 || index > max) {
    throw new Error(`Index=${index} is not in [0, ${ra.length}] for array property=${propertyName}`);
  }
  return ra;
};

let throwIf = function(condition: boolean, message: string) {
  if (condition) {
    throw new Error(message);
  }
};

/* tslint:disable:no-any */
let actionImmutabilityCheck = function(actionId: ActionId, oldValue: any, newValue: any,
                                       propertyName: any, index?: number) {
  /* tslint:enable:no-any */
  if (oldValue === newValue) {
    let message = `Action immutability violated: ${ActionId[actionId]}: 
      mutation in property '${propertyName}', oldValue=${oldValue}, newValue=${newValue}`;
    message = index ? `${message} at index=${index}` : message;
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
export function mutateArray<S extends StateObject, K extends keyof S, V>
(actionType: ActionId, stateObject: S, values: Array<V>,
 value: V,  propertyName: K, index: number)
: {oldValue?: V} {

  if (!values) {
    throw new Error(`${propertyName} array is falsey, insert the array property before trying to change it`);
  }
  validateArrayIndex(actionType, values, index, propertyName);
  switch (actionType) {
    case ActionId.UPDATE_PROPERTY: {
      let oldValue: V = values[index];
      values[index] = value;
      actionImmutabilityCheck(actionType, oldValue, value, propertyName, index);
      return {oldValue: oldValue};
    }
    case ActionId.INSERT_PROPERTY: {
      values.splice(index, 0, value);
      actionImmutabilityCheck(actionType, undefined, value, propertyName, index);
      return {};
    }
    case ActionId.DELETE_PROPERTY: {
      let subArray = values.splice(index, 1);
      return {oldValue: subArray[0]};
    }
    default: throw new Error(`mutateArray: unhandled actionType=${actionType}`);
  }
}

export function mutateValue<S extends StateObject, K extends keyof S>
(actionType: ActionId, stateObject: S, value: S[K] | undefined, propertyName: K)
: { oldValue?: S[K] } {
  switch (actionType) {
    case ActionId.UPDATE_PROPERTY: {
      let isStateObject = State.isInstanceOfStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action isn't applicable to state objects`);
      let oldValue: S[K] = _.get(stateObject, propertyName);
      actionImmutabilityCheck(actionType, oldValue, value, propertyName);
      _.set(stateObject, propertyName, value);
      return {oldValue: oldValue};
    }
    case ActionId.INSERT_PROPERTY: {
      let isStateObject = State.isInstanceOfStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action is not applicable to state objects`);
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
    case ActionId.DELETE_PROPERTY: {
      let isStateObject = State.isInstanceOfStateObject(_.get(stateObject, propertyName));
      throwIf(isStateObject, `${ActionId[actionType]} action isn''t applicable to state objects`);
      // delete performance is improving but still slow, but these are likely to be rare.
      // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
      let oldValue: S[K] = stateObject[propertyName];
      _.unset(stateObject, propertyName);
      // if oldValue is an array, the array needs to be removed from the arrayKeyIndexMap
      if (oldValue instanceof Array) {
        if (!arrayKeyIndexMap.deleteFromMaps(oldValue)) {
          let fullPath = Manager.get(stateObject).getFullPath(stateObject, propertyName);
          let message = `Failed to delete array from arrayKeyIndexMap at ${fullPath}`;
          /* tslint:disable:no-console */
          console.log(message);
          /* tslint:enable:no-console */
          // throw Error(message);
        }
      }
      // TODO: is this really necessary?
      actionImmutabilityCheck(actionType, oldValue, value, propertyName);

      return {oldValue: oldValue};
    }
    case ActionId.INSERT_STATE_OBJECT: {
      throwIf(
        !_.isPlainObject(value),
        `${ActionId[actionType]} action is applicable to plain objects; value = ${value}`);

      if (!value) {
        throw new Error('Cannot insert a falsey value, consider using delete instead');
      }
      State.createStateObject<S[K]>(stateObject, propertyName, value);
      actionImmutabilityCheck(actionType, undefined, value, propertyName);
      return {};
    }
    case ActionId.DELETE_STATE_OBJECT: {
      let oldValue: S[K] = _.get(stateObject, propertyName);
      let isStateObject = State.isInstanceOfStateObject(oldValue);
      throwIf(!isStateObject, `${ActionId[actionType]} action is applicable to state objects; value = ${oldValue}`);
      let valueStateObject = _.get(stateObject, propertyName);
      if (State.isInstanceOfStateObject(valueStateObject)) {
        actionImmutabilityCheck(actionType, oldValue, value, propertyName);

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