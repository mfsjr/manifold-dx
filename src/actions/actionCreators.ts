import { StateObject } from '../';
import {
  Action, ActionId, ArrayKeyGeneratorFn, ArrayMutateAction,
  StateCrudAction
} from './actions';

/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayCrudActionCreator}
 */
export class CrudActionCreator<S extends StateObject> {
  private parent: S;
  // private propertyKey: keyof S;

  constructor(parent: S) {
    this.parent = parent;
  }

  protected getPropertyKeyForValue<V>(value: V): keyof S {
    for (let key in this.parent) {
      /* tslint:disable:no-any */
      if (value as any === this.parent[key]) {
        /* tslint:enable:no-any */
        return key;
      }
    }
    throw new Error(`Failed to find property value ${value} in parent`);
  }

  public insert<K extends keyof S>(propertyKey: K, value: S[K]): Action {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
  }
  public update<K extends keyof S>(propertyKey: K, value: S[K]): Action {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
  }

  /**
   * Delete the property (named 'remove' because 'delete' is a reserved word)
   * @param {K} propertyKey
   * @returns {Action}
   */
  public remove<K extends keyof S>(propertyKey: K): Action {
    return new StateCrudAction(ActionId.DELETE_PROPERTY, this.parent, propertyKey);
  }
  // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
  public insertStateObject<K extends keyof S>(value: S[K], propertyKey: K): Action {
    return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.parent, propertyKey, value);
  }
  public removeStateObject<K extends keyof S>(propertyKey: K): Action {
    return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.parent, propertyKey, this.parent[propertyKey]);
  }
}

/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link CrudActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * S is the StateObject which the array is a property of
 */
export class ArrayCrudActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
  private parent: S;
  private propertyKey: keyof S;

  private valuesArray: Array<V> & S[K]; // & keyof S[keyof S];

  // private keyGenerator: ArrayKeyGeneratorFn<V>;

  /**
   * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
   * parameter in order to provide TypeScript with a strongly typed object that
   * we can use in conjunction with a typeguard so that we the property value is an
   * appropriately typed value.
   *
   * There may be some TS experts out there who know how to do this, but this appears
   * to be outside of the capabilities of 2.7 judging by the docs.
   *
   * Recent PR's targeted for 2.8 may change this, see https://github.com/Microsoft/TypeScript/pull/21496
   *
   * S extends StateObject
   *
   * @param {S} parent
   * @param {keyof S} propertyKey
   * @param {Array<V>} childArray
   * @param {ArrayKeyGeneratorFn} keyGenerator
   */
  constructor(parent: S, childArray: Array<V> & S[K], keyGenerator: ArrayKeyGeneratorFn<V>) {
    this.parent = parent;
    /* tslint:disable:no-any */
    let array: any = childArray;
    for (let key in parent) {
      if (array === parent[key]) {
        this.propertyKey = key;
      }
    }
    /* tslint:enable:no-any */
    if (!this.propertyKey) {
      throw Error(`Failed to find array in parent`);
    }
    this.valuesArray = array;
    // this.keyGenerator = keyGenerator;
  }

  public insert(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }

  // /**
  //  * Note that we are finding the index of this from a map (not scanning).
  //  * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
  //  * contain the key calculated by this.keyGenerator.
  //  * @param {V} value
  //  * @returns {number}
  //  */
  // protected getIndexOf(value: V): number {
  //   let keyIndexMap = arrayKeyIndexMap.getOrCreateKeyIndexMap(this.valuesArray, this.keyGenerator);
  //   let key = this.keyGenerator(value);
  //   let index = keyIndexMap.get(key);
  //   if (!index) {
  //     throw new Error(`failed to find index in array ${this.propertyKey} for key ${key}`);
  //   }
  //   return index;
  // }

  public update(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }

  public remove(index: number): Action {
    return new ArrayMutateAction(
      ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray);
  }
}
