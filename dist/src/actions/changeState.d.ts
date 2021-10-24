import { ActionId } from './actions';
import { StateObject } from '../types/Store';
/**
 * These are reducers invoked by actions, the only place where state may be changed.
 */
/**
 * Check to see that the provided indexes are valid for the given action type (allowing for insertions at the end
 * of the array), throw an informative error if not.
 */
export declare function validateArrayIndex(actionType: ActionId, ra: Array<any>, index: number, propertyName: string): any[];
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
export declare function changeArray<S extends StateObject, K extends Extract<keyof S, string>, V>(actionType: ActionId, stateObject: S, values: Array<V>, value: V, propertyName: K, index: number): {
    oldValue?: V;
};
export declare function changeValue<S extends StateObject, K extends Extract<keyof S, string>>(actionType: ActionId, stateObject: S, value: S[K] | undefined, propertyName: K): {
    oldValue?: S[K];
};
