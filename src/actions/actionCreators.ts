import { StateObject } from '../';
import {
  Action, ActionId, ArrayKeyGeneratorFn, ArrayMutateAction, DispatchType, MappingAction,
  StateCrudAction
} from './actions';
import { ContainerComponent } from '../components/ContainerComponent';

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
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {CrudActionCreator<S extends StateObject>}
 */
export function getCrudCreator<S extends StateObject>(parent: S): CrudActionCreator<S> {
  return new CrudActionCreator(parent);
}

export function getArrayCrudCreator<S extends StateObject, K extends keyof S, V extends Object>
(parent: S, childArray: Array<V> & S[K], keyGenerator: ArrayKeyGeneratorFn<V>)
: ArrayCrudActionCreator<S, K, V> {
  return new ArrayCrudActionCreator(parent, childArray, keyGenerator);
}
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link CrudActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * usage example from tests:  new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn)
 *
 * S is the StateObject which the array is a property of
 */
export class ArrayCrudActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
  private parent: S;
  private propertyKey: K;

  private valuesArray: Array<V> & S[K]; // & keyof S[keyof S];

  private keyGenerator: ArrayKeyGeneratorFn<V>;

  /**
   * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
   * parameter in order to provide TypeScript with a strongly typed object that
   * we can use in conjunction with a typeguard so that the array element's property is an
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
    let propKey: K | undefined;
    for (let key in parent) {
      if (array === parent[key] && array instanceof Array) {
        propKey = key as K;
      }
    }
    /* tslint:enable:no-any */
    if (!propKey) {
      throw Error(`Failed to find array in parent`);
    }
    this.propertyKey = propKey;
    this.valuesArray = array;
    this.keyGenerator = keyGenerator;
  }

  // /**
  //  * Note that we are finding the index of this from a map (not scanning).
  //  * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
  //  * contain the key calculated by this.keyGenerator.
  //  * @param {V} value
  //  * @returns {number}
  //  */
  // protected getIndexOf(value: V): number {
  //   let keyIndexMap = ArrayKeyIndexMap.get().getOrCreateKeyIndexMap(this.valuesArray, this.keyGenerator);
  //   let key = this.keyGenerator(value);
  //   let index = keyIndexMap.get(key);
  //   if (index === undefined) {
  //     throw new Error(`failed to find index in array ${this.propertyKey} for key ${key}`);
  //   }
  //   return index;
  // }

  public append(value: V): Action {
    return this.insert(this.valuesArray.length, value)[0];
  }

  /**
   * Insert into the StateObject's array, and return an array of actions for each element above the insertion.
   *
   * Mapping actions will remain unchanged, but the value of all the mapped state, and container view properties will
   * be updated.
   *
   * If the additional object at the end of the array is to be shown, an additional mapping action would have to be
   * performed, a {@link ContainerComponent} would be required, etc.
   *
   *
   * @param {number} index
   * @param {V} value
   * @returns {Action}
   */
  public insert(index: number, value: V): Action[] {
    // TODO: get rid of slice (new array), use only splice (mutation), return an array of actions for updating indexes
    // let newArray: Array<V> & S[K] = this.valuesArray.slice(0);
    // newArray.splice(index, 0, value);
    // ArrayKeyIndexMap.get().deleteFromMaps(this.valuesArray);
    // this.valuesArray = newArray;
    // ArrayKeyIndexMap.get().getOrCreateKeyIndexMap(this.valuesArray, this.keyGenerator);
    // return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, newArray);

    // TODO: ? what would devs expect, an insert that updates containers automatically, or a generated list of actions?
    let actions: Array<Action> = [
      new ArrayMutateAction(
        ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, value)
    ];

    // for (let i = 1 + index; i < this.valuesArray.length; i++) {
    //   actions.push( new ArrayMutateAction(
    //     ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, i,
    //     this.valuesArray, this.keyGenerator, this.valuesArray[i - 1]
    //   ));
    // }

    // // update at index with the new value
    // let actions: Array<Action> = [
    //   new ArrayMutateAction(
    //     ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, value)
    // ];
    //
    // // shift each existing value up one
    // for (let i = 1 + index; i < this.valuesArray.length - 1; i++) {
    //   actions.push( new ArrayMutateAction(
    //     ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, i,
    //     this.valuesArray, this.keyGenerator, this.valuesArray[i - 1]
    //   ));
    // }
    // // insert the last value at the end of the list
    // actions.push( new ArrayMutateAction(
    //   ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, this.valuesArray.length,
    //   this.valuesArray, this.keyGenerator, this.valuesArray[this.valuesArray.length - 1])
    // );

    return actions;
    // this.valuesArray.splice(index, 0, value);
    // return new ArrayMutateAction(
    //   ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, value);
  }

  public update(index: number, newValue: V): Action {
    // let index = this.getIndexOf(oldValue);
    return new ArrayMutateAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, newValue);
  }

  public remove(index: number): Action {
    // let value: V = this.valuesArray[index];
    // let index = this.getIndexOf(value);
    let result = new ArrayMutateAction(
      ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray,
      this.keyGenerator, undefined);

    // result.postHook = () => {
    //   let map = ArrayKeyIndexMap.get().get(this.valuesArray);
    //   let key = this.keyGenerator(value);
    //   map.delete(key);
    // };

    return result;
  }
}

export interface ArrayMappingCreatorOptions<S extends StateObject, K extends keyof S, E> {
  keyGen: ArrayKeyGeneratorFn<E>;
  array: Array<E> & S[K];
}

export function getMappingCreator<S extends StateObject, K extends keyof S, A extends StateObject, E>
(_parent: S, _propKey: K, arrayOptions?: ArrayMappingCreatorOptions<S, K, E>) {

  /**
   * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
   *
   * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
   * @param {TP} targetPropKey
   * @param {DispatchType} dispatches
   * @returns {MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP,
   * A extends StateObject, E>}
   */
  let createPropertyMappingAction = function<CP, VP, TP extends keyof VP>
  (_component: ContainerComponent<CP, VP, A>, targetPropKey: TP, ...dispatches: DispatchType[])
  : MappingAction<S, K, CP, VP, TP, A, E> {
    return new MappingAction(_parent, _propKey, _component, targetPropKey, ...dispatches);
  };

  let createArrayIndexMappingAction = function<CP, VP, TP extends keyof VP>
  (
    index: number,
    _component: ContainerComponent<CP, VP, A>,
    targetPropKey: TP,
    ...dispatches: DispatchType[]
  )
      : MappingAction<S, K, CP, VP, TP, A, E> {

    let mappingAction = new MappingAction(_parent, _propKey, _component, targetPropKey, ...dispatches);
    if (!arrayOptions) {
      throw new Error(`Can't invoke this method without arrayOptions!`);
    }
    // TODO: try building a custom type guard for Array<E>
    let array = arrayOptions.array;
    let propKey: K | undefined;
    for (let key in _parent) {
      if (array === _parent[key] && array instanceof Array) {
        propKey = key as K;
      }
    }
    if (!propKey) {
      throw Error(`Failed to find array in parent`);
    }

    let result = mappingAction.setArrayElement(index, arrayOptions.array, arrayOptions.keyGen);
    return result as MappingAction<S, K, CP, VP, TP, A, E>;
  };

  return {
    createPropertyMappingAction,
    createArrayIndexMappingAction
  };
}