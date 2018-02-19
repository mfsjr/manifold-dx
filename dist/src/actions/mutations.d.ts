import { ActionId } from './actions';
import { StateObject } from '../types/State';
/**
 *
 * @param {ActionId} actionType
 * @param {S} stateObject
 * @param {Array<S[K][V]> | undefined} values
 * @param {S[K][V]} value
 * @param {K} propertyName
 * @param {number} index
 * @returns {{oldValue?: S[K][V]}}
 */
export declare function mutateArray<S extends StateObject, K extends keyof S, V extends keyof S[K]>(actionType: ActionId, stateObject: S, values: Array<S[K][V]> | undefined, value: S[K][V], propertyName: K, index: number): {
    oldValue?: S[K][V];
};
export declare function mutateValue<S extends StateObject, K extends keyof S>(actionType: ActionId, stateObject: S, value: S[K] | undefined, propertyName: K): {
    oldValue?: S[K];
};
