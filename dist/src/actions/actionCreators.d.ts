import { StateObject } from '../';
import { Action } from './actions';
export declare class CrudActionCreator<S extends StateObject> {
    private parent;
    private propertyKey;
    constructor(parent: S, propertyKey: keyof S);
    crudInsert(value: S[keyof S]): Action;
    crudUpdate(value: S[keyof S]): Action;
    crudDelete(): Action;
    crudNest(value: S[keyof S]): Action;
    crudUnnest(value: S[keyof S]): Action;
}
export declare class ArrayCrudActionCreator<S extends StateObject, V> {
    private parent;
    private propertyKey;
    private valuesArray;
    /**
     * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
     * parameter in order to provide TypeScript with a strongly typed object that
     * we can use in conjunction with a typeguard so that we the property value is an
     * appropriately typed array.
     *
     * There may be some TS experts out there who know how to do this, but this appears
     * to be outside of the capabilities of 2.7 judging by the docs.
     *
     * Recent PR's targeted for 2.8 may change this, see https://github.com/Microsoft/TypeScript/pull/21496
     *
     * @param {S} parent
     * @param {keyof S} propertyKey
     * @param {Array<V>} valuesArray
     */
    constructor(parent: S, propertyKey: keyof S, valuesArray: Array<V>);
    insert(index: number, value: V): Action;
    update(index: number, value: V): Action;
    delete(index: number): Action;
}
