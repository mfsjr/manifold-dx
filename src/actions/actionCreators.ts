import { StateObject } from '../';
import {
  ActionId, ArrayChangeAction, ContainerPostReducer, MappingAction, StateAction, StateCrudAction,
} from './actions';
import { ContainerComponent } from '../components/ContainerComponent';

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

  protected throwIfArray<K extends Extract<keyof S, string>>(propValue: S[K]): void {
    if (propValue instanceof Array) {
      throw new Error(`Invalid action type for ActionCreator using an array, try using ArrayActionCreator`);
    }
  }

  public rerender<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.RERENDER, this.parent, propertyKey, this.parent[propertyKey]);
  }

  /**
   * Insert the value.  If the current value exists, an error will be thrown.
   * @param propertyKey
   * @param value
   */
  public insert<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    return new StateCrudAction(ActionId.INSERT_PROPERTY, this.parent, propertyKey, value);
  }

  /**
   * Insert the value if the current property is empty, else provide a no-op action type so that
   * dispatch will ignore it.
   * {@see insert}, {@see update}
   * @param propertyKey
   * @param value
   */
  public insertIfEmpty<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    const type = !this.parent[propertyKey] ? ActionId.INSERT_PROPERTY : ActionId.INSERT_PROPERTY_NO_OP;
    return new StateCrudAction(type, this.parent, propertyKey, value);
  }

  // NOTE: 'assignAll'?  Seems unnecessary, we can simply insert/update the parent

  /**
   * Update the existing value.  If the value being passed in is the same as the current value, an
   * error will be thrown.  If there is no existing value, an error will be thrown.
   * @param propertyKey
   * @param value
   */
  public update<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
  }

  /**
   * Tests to see if the update is using the same object as the current value; if it is, the resulting action
   * is a no-op (does nothing), else a regular update is created.
   *
   * @param propertyKey
   * @param value
   */
  public updateIfChanged<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    let actionId = this.parent[propertyKey] !== value ? ActionId.UPDATE_PROPERTY : ActionId.UPDATE_PROPERTY_NO_OP;
    return new StateCrudAction(actionId, this.parent, propertyKey, value);
  }

  /**
   * This is the preferred action creation api, capable of performing inserts, updates and deletes.
   * If the new value is 'undefined', then this is equivalent to deletion/removal.
   *
   * This method works by determining whether it needs to call {@link insert}, {@link update} or {@link remove}.
   * It will not throw errors, but it may create actions that are no-ops (e.g., update the same value, delete
   * a property that is undefined, etc).
   *
   * If the developer knows what a value is, then using insert, update or remove directly is perfectly valid.
   *
   * If you need to squeeze out the highest possible levels of performance, using insert, update or remove
   * directly might make things a little faster.
   *
   * @param propertyKey
   * @param value
   */
  public set<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K> {
    if (value === undefined) {
      return this.removeIfHasData(propertyKey);
    } else if (this.parent[propertyKey] === null || this.parent[propertyKey] === undefined) {
      return this.insert(propertyKey, value);
    }
    return this.updateIfChanged(propertyKey, value);
  }

  /**
   * Delete the property (named 'remove' because 'delete' is a reserved word).
   *
   * If it is not empty, throw
   * @param {K} propertyKey
   * @returns {Action}
   */
  public remove<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K> {
    // this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.DELETE_PROPERTY, this.parent, propertyKey);
  }

  /**
   * If the value of the property is not undefined or null, remove it, else return a no-op action.
   * @param propertyKey
   */
  public removeIfHasData<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K> {
    const type = this.parent[propertyKey] === undefined || this.parent[propertyKey] === null ?
      ActionId.DELETE_PROPERTY_NO_OP :
      ActionId.DELETE_PROPERTY;
    return new StateCrudAction(type, this.parent, propertyKey);
  }

  // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
  public insertStateObject<K extends Extract<keyof S, string>>(value: S[K] & StateObject, propertyKey: K)
      : StateCrudAction<S, K> {
    return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.parent, propertyKey, value);
  }
  public removeStateObject<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K> {
    this.throwIfArray(this.parent[propertyKey]);
    return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.parent, propertyKey, this.parent[propertyKey]);
  }
}

/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent.
 *
 * @returns {ActionCreator<S extends StateObject>}
 * @throws if the parent state object passed in is falsy.
 */
export function getActionCreator<S extends StateObject>(parent?: S): ActionCreator<S> {
  if (!parent) {
    throw new Error(`getActionCreator received an undefined parent state object`);
  }
  return new ActionCreator(parent);
}

/**
 * Map an array from application state, to be mapped to a target.
 * @param parent
 * @param childArray
 * @throws if the parent state object passed in is falsy.
 */
export function getArrayActionCreator<S extends StateObject, K extends Extract<keyof S, string>, V extends Object>
(parent?: S, childArray?: Array<V> & S[K])
: ArrayActionCreator<S, K, V> {
  if (!parent) {
    throw new Error(`getArrayActionCreator received an undefined parent state object`);
  }
  if (!childArray) {
    throw new Error(`getArrayActionCreator received an undefined childArray`);
  }
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
export class ArrayActionCreator<S extends StateObject, K extends Extract<keyof S, string>, V extends Object> {
  private parent: S;
  private propertyKey: K;

  private valuesArray: Array<V> & S[K];

  /**
   * Construct an array crud creator.  We require a somewhat redundant 'childArray'
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
   * @param parent
   * @param childArray
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

  public updateArray(newArray: Array<V> & S[K]): StateAction<S, K> {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, newArray);
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

  // public rerenderElement(index: number): StateAction<S, K> {
  //   return new ArrayChangeAction(
  //     ActionId.RERENDER, this.parent, this.propertyKey, index, this.valuesArray, this.valuesArray[index]
  //   );
  // }

  public updateElement(index: number, newValue: V): ArrayChangeAction<S, K, V> {
    // let index = this.getIndexOf(oldValue);
    return new ArrayChangeAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, newValue);
  }

  public updateElementIfChanged(index: number, newValue: V): ArrayChangeAction<S, K, V> {
    const type = newValue !== this.valuesArray[index] ? ActionId.UPDATE_PROPERTY : ActionId.UPDATE_PROPERTY_NO_OP;
    return new ArrayChangeAction(
      type, this.parent, this.propertyKey, index, this.valuesArray, newValue);
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
        actions.push(new ArrayChangeAction(ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, newArray.length,
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

/**
 * Extract keys (which are strings) whose value's types match the type of S[K].
 * See "Conditional types are particularly useful when combined with mapped types:"
 * in https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
 */
export type ExtractMatching<S, K extends Extract<keyof S, string>, VP> =
  { [TP in Extract<keyof VP, string>]: VP[TP] extends S[K] ? TP : never; } [Extract<keyof VP, string>];

/**
 * Extract keys (which are strings) whose value match E, the specific unknown type of an array.
 */
export type ExtractMatchingArrayType<E, VP> =
  { [TP in Extract<keyof VP, string>]: VP[TP] extends E ? TP : never; } [Extract<keyof VP, string>];

export type ExtractArrayKeys<E, VP> =
  { [TP in Extract<keyof VP, string>]: VP[TP] extends Array<E> ? TP : never; } [Extract<keyof VP, string>];

/**
 * This seems like it should work for declaring TP in MappingAction class, but doesn't
 */
export type ExtractMatchingConditional<S, K extends Extract<keyof S, string>, VP, E extends unknown> =
  E extends void ? ExtractMatching<S, K, VP> : ExtractMatchingArrayType<E, VP>;

/**
 * Create a mapping from app state to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object passed in is falsy.
 */
export function getMappingActionCreator
  <S extends StateObject, K extends Extract<keyof S, string>, A extends StateObject, E extends void>
(_parent: S | undefined, _propKey: K) {
  if (!_parent) {
    throw new Error(`getMappingActionCreator received an undefined parent state object`);
  }
  /**
   * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
   *
   * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
   * @param {TP} targetPropKey
   * @param {ContainerPostReducer} functions that are executed after reducer but before rendering
   * @returns {MappingAction<S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP,
   * A extends StateObject, E>}
   */
  const createPropertyMappingAction = function<CP, VP, TP extends ExtractMatching<S, K, VP>>
  (_component: ContainerComponent<CP, VP, A>, targetPropKey: TP, ...postReducerCallbacks: ContainerPostReducer[])
  : MappingAction<S, K, CP, VP, TP, A, E> {
    return new MappingAction(_parent, _propKey, _component, targetPropKey, ...postReducerCallbacks);
  };

  return {
    createPropertyMappingAction,
  };
}

/**
 * Create a mapping from an app state array to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object is falsy
 */
export function getArrayMappingActionCreator
<S extends StateObject, K extends ExtractArrayKeys<unknown, S>, A extends StateObject>
(_parent: S | undefined, _propKey: K) {

  if (!_parent) {
    throw new Error(`getMappingActionCreator received an undefined parent state object`);
  }

  /**
   * Create a mapping from an array element, or the whole array, to a component
   * @param {S[K] & Array<E>} state array to be mapped
   * @param {number | null} index use number to map from an array element, or null to map the array itself
   * @param {ContainerComponent<CP, VP, A extends StateObject>} _component the component being mapped, typically 'this'
   * @param {TP} targetPropKey the name of the view/target property being updated
   * @param {ContainerPostReducer} optional functions executed after the action but before rendering.  View props
   *    may be updated here
   * @returns {MappingAction
   * <S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP, A extends StateObject, E>}
   *  the mapping action
   */
  const createArrayIndexMappingAction =
    function <CP, VP, E extends unknown, TP extends ExtractMatchingArrayType<E, VP>>
    (
      _array: S[K] & Array<E>,
      index: number | null,
      _component: ContainerComponent<CP, VP, A>,
      targetPropKey: TP,
      ...postReducerCallbacks: ContainerPostReducer[]
    )
      : MappingAction<S, K, CP, VP, TP, A, E> {

      let mappingAction = new MappingAction(_parent, _propKey, _component, targetPropKey, ...postReducerCallbacks);

      let result = mappingAction.setArrayElement(index, _array);
      return result as MappingAction<S, K, CP, VP, TP, A, E>;
    };

  return {
    createArrayIndexMappingAction
  };
}
