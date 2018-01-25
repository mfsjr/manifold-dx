
import {ActionId} from "./actions";
import * as _ from 'lodash';
import {MutationError} from "../types/StateMutationCheck";
import {IStateObject, State} from "../types/State";


// This works when arrays are not optional/nullable/undefinable, see https://github.com/Microsoft/TypeScript/issues/20771
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
export function mutateArray<S extends IStateObject, K extends keyof S, V extends keyof S[K]>
          (actionType: ActionId, stateObject: S, values: Array<S[K][V]> | undefined,  value: S[K][V],  propertyName: K, index: number)
        : {oldValue?: S[K][V]} {

// export let mutateArray = function<S extends IStateObject, K extends keyof S, T>
//           (actionType: ActionId, stateObject: S, values: Array<T> | undefined, value: T,  propertyName: K, index: number)
//         : {oldValue?: T} {
//
  if (!values) {
    throw new Error(`${propertyName} array is falsey, insert the array property before trying to change it`);
  }
  validateArrayIndex(actionType, values, index, propertyName);
  switch(actionType) {
    case ActionId.UPDATE_PROPERTY: {
      let oldValue: S[K] = values[index];
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
      let subArray: S[K][] = values.splice(index, 1);
      return {oldValue: subArray[0]};
    }
    default: throw new Error(`mutateArray: unhandled actionType=${actionType}`);
  }
};

let actionImmutabilityCheck = function(actionId: ActionId, oldValue: any, newValue: any, propertyName: any, index?: number) {
  if (oldValue === newValue) {
    let message = `Action immutability violated: ${ActionId[actionId]}: mutation in property '${propertyName}', oldValue=${oldValue}, newValue=${newValue}`;
    message = index ? `${message} at index=${index}` : message;
    throw new MutationError(message);
  }
}

let validateArrayIndex = function(actionType: ActionId, ra: Array<any>, index: number,  propertyName: string) {
  let di = actionType == ActionId.INSERT_PROPERTY || actionType == ActionId.INSERT_STATE_OBJECT ? 1 : 0;
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


export function mutateValue<S extends IStateObject, K extends keyof S>
        (actionType: ActionId, stateObject: S, value: S[K], propertyName: K)
      : { oldValue?: S[K] } {
  switch (actionType) {
    case ActionId.UPDATE_PROPERTY: {
      let isStateObject = State.isInstanceOfIStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action isn't applicable to state objects`);
      let oldValue: S[K] = _.get(stateObject, propertyName);
      actionImmutabilityCheck(actionType, oldValue, value, propertyName);
      _.set(stateObject, propertyName, value);
      return {oldValue: oldValue}
    }
    case ActionId.INSERT_PROPERTY: {
      let isStateObject = State.isInstanceOfIStateObject(value);
      throwIf(isStateObject, `${ActionId[actionType]} action is not applicable to state objects`);
      // NOTE: we don't care if its an object, the user will have to be aware and handle it
      stateObject[propertyName] = value;
      actionImmutabilityCheck(actionType, undefined, value, propertyName);
      return {};
    }
    case ActionId.DELETE_PROPERTY: {
      let isStateObject = State.isInstanceOfIStateObject(_.get(stateObject, propertyName));
      throwIf(isStateObject, `${ActionId[actionType]} action isn''t applicable to state objects`);
      // delete performance is improving but still slow, but these are likely to be rare.
      // Let's be rigorous until we can't be (or until VM's address this, and they've started to)
      let oldValue: S[K] = stateObject[propertyName];
      _.unset(stateObject, propertyName);
      actionImmutabilityCheck(actionType, oldValue, value, propertyName);

      return {oldValue: oldValue};
    }
    case ActionId.INSERT_STATE_OBJECT: {
      throwIf(!_.isPlainObject(value), `${ActionId[actionType]} action is applicable to plain objects; value = ${value}`);

      // if ( State.isInstanceOfIStateObject(value)) {
      //   throwIf(State.isInstanceOfIStateObject(value), "user data objects/types are required, an IStateObject was provided");
      // }
      State.createStateObject<S[K]>(stateObject, propertyName, value);
      actionImmutabilityCheck(actionType, undefined, value, propertyName);
      return {}
    }
    case ActionId.DELETE_STATE_OBJECT: {
      let oldValue: S[K] = _.get(stateObject, propertyName);
      let isStateObject = State.isInstanceOfIStateObject(oldValue);
      throwIf(!isStateObject, `${ActionId[actionType]} action is applicable to state objects; value = ${oldValue}`);
      let valueStateObject: IStateObject = _.get(stateObject, propertyName);
      actionImmutabilityCheck(actionType, oldValue, value, propertyName);

      // delete the valueStateObject from the app state graph
      _.unset(stateObject, propertyName);
      // delete the stateObject from mappings of state to react commentsUI
      // disable __parent__ as an indicator, and to prevent accidental traversal
      valueStateObject.__parent__ = valueStateObject;

      return {oldValue: oldValue};
    }
    default:
      throw new Error(`Unhandled actionType=${actionType}`);
  }
};