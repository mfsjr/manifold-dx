import { StateObject } from '../';
import {
  ActionId, ArrayChangeAction, MappingHook, MappingAction, StateAction, StateCrudAction,
} from './actions';
import { ContainerComponent } from '../components/ContainerComponent';

export type NotArray<T> = T;
// TODO: figure out how to do type checking with this instead of RTE
export function isNotArray<T>(value: T): value is NotArray<T> {
  return !(value instanceof Array);
}

/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayActionCreator}
 */
export class ActionCreator<S extends StateObject> {
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

  protected throwIfArray<K extends keyof S>(propValue: S[K]): void {
    if (propValue instanceof Array) {
      throw new Error(`Invalid action type for ActionCreator using an array, try using ArrayActionCreator`);
    }
  }

  public rerender<K extends keyof S>(propertyKey: K): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.RERENDER, this.parent, propertyKey, this.parent[propertyKey]);
  }

  public insert<K extends keyof S>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.INSERT_PROPERTY, this.parent, propertyKey, value);
  }
  public update<K extends keyof S>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
  }

  /**
   * Similar to Object.assign, only difference being that if property values happen
   * to match, nothing is done (no action will be performed).
   *
   * @param newObject
   */
  public assignAll<K extends keyof S>(newObject: S): StateCrudAction<S, K>[] {
    let keys: Array<string> = Object.getOwnPropertyNames(newObject);
    let actions: StateCrudAction<S, K>[] = [];
    keys.forEach(key => {
      if (newObject[key] && this.parent[key]) {
        if (this.isKeyOf(this.parent, key)) {
          if (newObject[key] !== this.parent[key]) {
            let action = this.update(key, newObject[key]) as StateCrudAction<S, K>;
            actions.push(action);
          }
        }
        if (newObject[key] && !this.parent[key]) {
          if (this.isKeyOf(this.parent, key)) {
            let action = this.insert(key, newObject[key]) as StateCrudAction<S, K>;
            actions.push(action);
          }
        }
      }
    });
    return actions;
  }

  public isKeyOf<K extends keyof S>(value: S, key: string): key is K {
    return value.hasOwnProperty(key);
  }

  /**
   * Delete the property (named 'remove' because 'delete' is a reserved word)
   * @param {K} propertyKey
   * @returns {Action}
   */
  public remove<K extends keyof S>(propertyKey: K): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.DELETE_PROPERTY, this.parent, propertyKey);
  }
  // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
  public insertStateObject<K extends keyof S>(value: S[K] & StateObject, propertyKey: K): StateCrudAction<S, K> {
    return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.parent, propertyKey, value);
  }
  public removeStateObject<K extends keyof S>(propertyKey: K): StateCrudAction<S, K> {
    this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.parent, propertyKey, this.parent[propertyKey]);
  }
}

/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {ActionCreator<S extends StateObject>}
 */
export function getActionCreator<S extends StateObject>(parent: S): ActionCreator<S> {
  return new ActionCreator(parent);
}

export function getArrayActionCreator<S extends StateObject, K extends keyof S, V extends Object>
(parent: S, childArray: Array<V> & S[K])
: ArrayActionCreator<S, K, V> {
  return new ArrayActionCreator(parent, childArray);
}
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link ActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * usage example from tests:  new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn)
 *
 * S is the StateObject which the array is a property of
 */
export class ArrayActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
  private parent: S;
  private propertyKey: K;

  private valuesArray: Array<V> & S[K];

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
  constructor(parent: S, childArray: Array<V> & S[K]) {
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
  }

  public rerenderArray(): StateAction<S, K> {
    return new StateCrudAction(ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey]);
  }

  public appendElement(value: V): StateAction<S, K>[] {
    return this.insertElement(this.valuesArray.length, value);
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
  public insertElement(index: number, value: V): StateAction<S, K>[] {
    let actions: Array<StateAction<S, K>> = [
      new ArrayChangeAction(
        ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value),
      new StateCrudAction(ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
    ];

    return actions;
  }

  public rerenderElement(index: number): StateAction<S, K> {
    return new ArrayChangeAction(
      ActionId.RERENDER, this.parent, this.propertyKey, index, this.valuesArray, this.valuesArray[index]
    );
  }

  public updateElement(index: number, newValue: V): ArrayChangeAction<S, K, V> {
    // let index = this.getIndexOf(oldValue);
    return new ArrayChangeAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, newValue);
  }

  /**
   * Replace the current array's elements with the contents of the newArray.
   *
   * Note that if an element at an index is the same in the new and old array, it will be left unchanged (no
   * actions will be dispatched).
   *
   * @param newArray
   */
  public replaceAll(newArray: Array<V>): StateAction<S, K>[] {
    let actions: StateAction<S, K>[] = [];
    let sup = Math.max(newArray.length, this.valuesArray.length);
    for (let i = 0; i < sup; i++) {
      if ( i < newArray.length && i < this.valuesArray.length) {
        if (newArray[i] !== this.valuesArray[i]) {
          actions.push(this.updateElement(i, newArray[i]));
        }
      }
      if (i >= newArray.length) {
        actions.push(new ArrayChangeAction(ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, i,
          this.valuesArray, newArray[i]));
        // actions.concat(this.removeElement(i));
        continue;
      }
      if ( i >= this.valuesArray.length ) {
        actions.push(
          new ArrayChangeAction(
            ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, i, this.valuesArray, newArray[i]),
        );
        // actions.concat(this.appendElement(array[i]));
        continue;
      }
    }
    actions.push(new StateCrudAction(ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey]));
    return actions;
  }

  public removeElement(index: number): StateAction<S, K>[] {
    let newValue = index + 1 < this.valuesArray.length ? this.valuesArray[index + 1] : this.valuesArray[index];
    return [
      new ArrayChangeAction(ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index,
                            this.valuesArray, newValue),
      new StateCrudAction(ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
    ];
  }
}

export function getMappingActionCreator<S extends StateObject, K extends keyof S, A extends StateObject, E>
(_parent: S, _propKey: K) {

  /**
   * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
   *
   * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
   * @param {TP} targetPropKey
   * @param {MappingHook} functions that are executed after mapping but before rendering
   * @returns {MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP,
   * A extends StateObject, E>}
   */
  let createPropertyMappingAction = function<CP, VP, TP extends keyof VP>
  (_component: ContainerComponent<CP, VP, A>, targetPropKey: TP, ...mappingHooks: MappingHook[])
  : MappingAction<S, K, CP, VP, TP, A, E> {
    return new MappingAction(_parent, _propKey, _component, targetPropKey, ...mappingHooks);
  };

  /**
   * Create a mapping from an array element, or the whole array, to a component
   * @param {S[K] & Array<E>} state array to be mapped
   * @param {number | null} index use number to map from an array element, or null to map the array itself
   * @param {ContainerComponent<CP, VP, A extends StateObject>} _component the component being mapped, typically 'this'
   * @param {TP} targetPropKey the name of the view/target property being updated
   * @param {MappingHook} optional functions executed after the action but before rendering.  View props
   *    may be updated here
   * @returns {MappingAction
   *  <S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP, A extends StateObject, E>}
   *  the mapping action
   */
  let createArrayIndexMappingAction = function<CP, VP, TP extends keyof VP>
  (
    _array: S[K] & Array<E>,
    index: number | null,
    _component: ContainerComponent<CP, VP, A>,
    targetPropKey: TP,
    ...mappingHooks: MappingHook[]
  )
      : MappingAction<S, K, CP, VP, TP, A, E> {

    let mappingAction = new MappingAction(_parent, _propKey, _component, targetPropKey, ...mappingHooks);
    // TODO: try building a custom type guard for Array<E>
    let propKey: K | undefined;
    for (let key in _parent) {
      if (_array === _parent[key] && _array instanceof Array) {
        propKey = key as K;
      }
    }
    if (!propKey) {
      throw Error(`Failed to find array in parent`);
    }

    let result = mappingAction.setArrayElement(index, _array);
    return result as MappingAction<S, K, CP, VP, TP, A, E>;
  };

  return {
    createPropertyMappingAction,
    createArrayIndexMappingAction
  };
}
