import { StateObject } from '../';
import {
  Action, ActionId, ArrayKeyGeneratorFn, arrayKeyIndexMap, ArrayMutateAction,
  StateCrudAction
} from './actions';

export class CrudActionCreator<S extends StateObject> {
  private parent: S;
  private propertyKey: keyof S;

  constructor(parent: S) {
    this.parent = parent;
  }

  protected getPropertyKeyForValue<V>(value: V): keyof S {
    for (let key in this.parent) {
      /* tslint:disable:no-any */
      if (value as any === this.parent[key]) {
        /* tslint:enable:no-any */
        this.propertyKey = key;
        break;
      }
    }
    if (!this.propertyKey) {
      throw new Error(`Failed to find property value ${value} in parent`);
    }
    return this.propertyKey;
  }

  public crudInsert(value: S[keyof S], propertyKey: keyof S): Action {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
  }
  public crudUpdate(value: S[keyof S]): Action {
    this.propertyKey = this.getPropertyKeyForValue(value);
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
  }
  public crudDelete(value: S[keyof S]): Action {
    this.propertyKey = this.getPropertyKeyForValue(value);
    return new StateCrudAction(
      ActionId.DELETE_PROPERTY,
      this.parent, this.propertyKey, this.parent[this.propertyKey]);
  }
  // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
  public crudNest(value: S[keyof S], propertyKey: keyof S): Action {
    return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.parent, this.propertyKey, value);
  }
  public crudUnnest(value: S[keyof S]): Action {
    return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.parent, this.propertyKey, value);
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
export class ArrayCrudActionCreator<S extends StateObject, V extends Object> {
  private parent: S;
  private propertyKey: keyof S;

  private valuesArray: Array<V>; // & keyof S[keyof S];

  private keyGenerator: ArrayKeyGeneratorFn<V>;

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
  constructor(parent: S, childArray: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>) {
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
    this.keyGenerator = keyGenerator;
  }

  public insert(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }

  /**
   * Note that we are finding the index of this from a map (not scanning).
   * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
   * contain the key calculated by this.keyGenerator.
   * @param {V} value
   * @returns {number}
   */
  protected getIndexOf(value: V): number {
    let keyIndexMap = arrayKeyIndexMap.getOrCreateKeyIndexMap(this.valuesArray, this.keyGenerator);
    let key = this.keyGenerator(value);
    let index = keyIndexMap.get(key);
    if (!index) {
      throw new Error(`failed to find index in array ${this.propertyKey} for key ${key}`);
    }
    return index;
  }

  public update(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }

  public delete(index: number): Action {
    return new ArrayMutateAction(
      ActionId.DELETE_PROPERTY,
      this.parent, this.propertyKey, index, this.valuesArray, undefined);
  }
}
