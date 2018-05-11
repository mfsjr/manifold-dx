import { mutateArray, mutateValue } from './mutations';
import { AnyContainerComponent, ContainerComponent } from '../components/ContainerComponent';
import { StateObject } from '../types/State';
import { Manager } from '../types/Manager';

/**
 * ActionId's for calling api's that change state.
 *
 * Separate CRUD operations for state objects ({@link StateObject}) vs regular data
 * properties, since  state objects have special requirements that have to be checked.
 *
 * Also note that state objects themselves are not updated, ie swapped out for
 * one another since they need to have refs to parents set/unset.
 */
export enum ActionId {
  NULL,
  INSERT_STATE_OBJECT,
  DELETE_STATE_OBJECT,
  INSERT_PROPERTY,
  UPDATE_PROPERTY,
  DELETE_PROPERTY,
  MAP_STATE_TO_PROP,
}

/* tslint:disable:no-any */
export type DispatchType = (action: StateCrudAction<any, any>) => void;
/* tslint:enable:no-any */

export abstract class Action {

  /**
   * Optional action to be performed after the execution of the action,
   * see {@link ActionProcessor}
   */
  public postHook?: () => void;
  type: ActionId;
  mutated: boolean = false;
  pristine: boolean = true;

  /**
   * Performs the mutation on the action, called by the {@link Manager}, and should only be called by it, with
   * the possible exception of testing.
   *
   * @param {Action} action
   */
  public static perform(action: Action): void {
    action.performMutation();
  }

  /**
   * Undo the mutation on the action.  This is only called by the {@link Manager} and should never be called directly.
   * @param {Action} action
   */
  public static undo(action: Action): void {
    action.undoMutation();
  }

  protected abstract mutate(perform: boolean): void;

  public abstract clone(): Action;

  public abstract process(): void;

  constructor(actionType: ActionId) {
    this.type = actionType;
  }

  protected performMutation(): void {
    this.mutate(true);
  }

  protected assignProps(from: Action) {
    this.type = from.type;
    this.mutated = from.mutated;
    this.pristine = from.pristine;
  }

  getUndoAction(): ActionId {
    // Invert the action (note that UPDATE is the inverse of UPDATE)
    let undoAction = ActionId.UPDATE_PROPERTY;
    if (this.type === ActionId.DELETE_PROPERTY || this.type === ActionId.INSERT_PROPERTY) {
      undoAction = this.type === ActionId.INSERT_PROPERTY ? ActionId.DELETE_PROPERTY : ActionId.INSERT_PROPERTY;
    }
    if (this.type === ActionId.DELETE_STATE_OBJECT || this.type === ActionId.INSERT_STATE_OBJECT) {
      undoAction = this.type === ActionId.INSERT_STATE_OBJECT
          ? ActionId.DELETE_STATE_OBJECT
          : ActionId.INSERT_STATE_OBJECT;
    }
    return undoAction;
  }

  protected undoMutation(): void {
    this.mutate(false);
  }

  public containersToRender(containersBeingRendered: AnyContainerComponent[]): void { return; }
}

export abstract class StateAction<S extends StateObject, K extends keyof S> extends Action {
  parent: S;
  propertyName: K;
  mappingActions: AnyMappingAction[];

  protected assignProps(from: StateAction<S, K>) {
    super.assignProps(from);
    this.parent = from.parent;
    this.propertyName = from.propertyName;
    this.mappingActions = from.mappingActions;
  }

  constructor(actionType: ActionId, _parent: S, _propertyName: K) {
    super(actionType);
    this.parent = _parent;
    this.propertyName = _propertyName;
  }

  /**
   * Process the action.  A convenience method that calls Manager.get().actionPerform, which is the correct
   * way to process an action or an array of actions.
   */
  public process(): void {
    Manager.get(this.parent).actionProcess(this);
  }
  public containersToRender(containersBeingRendered: AnyContainerComponent[]): void {
    let fullPath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    let mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullPath);
    this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
    // if (mappingActions) {
    //   let containers = mappingActions.map((mapping) => mapping.component);
    //   containers.forEach((container) => {
    //     if (containersBeingRendered.indexOf(container) < 0) {
    //       containersBeingRendered.push(container);
    //     }
    //   });
    // }
  }
  
  protected concatContainersFromMappingActions(
    containersBeingRendered: AnyContainerComponent[],
    mappingActions?: AnyMappingAction[]
  ): void {
    if (mappingActions) {
      let containers = mappingActions.map((mapping) => mapping.component);
      containers.forEach((container) => {
        if (containersBeingRendered.indexOf(container) < 0) {
          containersBeingRendered.push(container);
        }
      });
    }
  }
}

/* tslint:disable:no-any */
export type GenericStateCrudAction = StateCrudAction<any, any>;
/* tslint:enable:no-any */

/**
 * Action classes contain instructions for mutating state, in the form
 * of StateObjects.
 */
export class StateCrudAction<S extends StateObject, K extends keyof S> extends StateAction<S, K> {
  mutateResult?: {oldValue?: S[K]};
  oldValue?: S[K];
  value: S[K] | undefined;

  public getOldValue(): S[K] | undefined {
    return this.oldValue;
  }

  protected assignProps(from: StateCrudAction<S, K>) {
    super.assignProps(from);
    this.mutateResult = from.mutateResult;
    this.oldValue = from.oldValue;
    this.value = from.value;
  }

  public clone(): StateCrudAction<S, K> {
    let copy = new StateCrudAction(this.type, this.parent, this.propertyName, this.value);
    copy.assignProps(this);
    return copy;
  }

  constructor(actionType: ActionId, _parent: S, _propertyName: K, _value?: S[K]) {
    super(actionType, _parent, _propertyName);
    this.value = _value;
  }

  protected mutate(perform: boolean = true): void {
    this.pristine = false;

    let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    this.mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath) || [];

    // annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoAction();
    let _value = perform ? this.value : this.oldValue;
    this.mutateResult = mutateValue(actionId, this.parent, _value, this.propertyName);
    if (perform) {
      this.oldValue = this.mutateResult ? this.mutateResult.oldValue : undefined;
      this.mutated = true;
    } else {
      this.mutateResult = undefined;
      this.oldValue = undefined;
      this.mutated = false;
    }
  }

}

/**
 * Functions like this are necessary to create mappings between React keys and StateObject array indexes, as
 * in ArrayKeyIndexMap below.
 *
 * These functions should be created in StateObject's _accessors, so that both
 * 1. invocations of ArrayKeyIndexMap's getKeyIndexMap, and...
 * 2. ArrayMutateAction's constructor's 'index' argument
 * ... can use this function (since they have to be the same).
 *
 */
export type ArrayKeyGeneratorFn<V> = (arrayElement: V, index?: number, array?: Array<V>) => React.Key;

/**
 * The name of this function is intended to convey the fact that it uses a property of the array
 * object type to use as the key.
 *
 * Seems like this is the usual / expected case, so export this function to be used for that.
 * Note that the signature is not the same as KeyGeneratorFnType, so to use it you will need to
 * generate the actual KeyGeneratorFnType like so:
 *
 * `let idGenerator = bookKeyGenerator<Book>(book: Book) {
 *    return propertyKeyGenerator<Book>(books, index, { propertyKey: 'id' } );
 *  }
 * `
 *
 * @param {Array<V>} array
 * @param {number} index
 * @param {{propertyKey: keyof V}} options
 * @returns {React.Key}
 */
export function propertyKeyGenerator<V>(arrayElement: V, propertyKey: keyof V): React.Key {
  let keyValue = arrayElement[propertyKey];
  if (typeof keyValue === 'string' || typeof keyValue === 'number') { // typeguard for React.Key
    return keyValue;
  }
  let message = `keyValue ${JSON.stringify(keyValue, null, 4)} is not a React.Key!`;
  throw new Error(message);
}

/**
 * React requires 'key' data elements for list rendering, and we need to keep track of
 * what indexes are associated with keys, for the purposes of modifying array state, since
 * the mutate array api's require array indexes.
 *
 * This class holds mappings for all the arrays in the app state, and for each will return
 * a map of type Map<React.Key, number>, which relates React's unique keys to the index
 * which holds the array element.
 *
 * V the generic type of the values held in the array, eg, Array<V>
 */
export class ArrayKeyIndexMap {

  private static instance: ArrayKeyIndexMap;
  /* tslint:disable:no-any */
  protected arrayMapper = new Map<Array<any>, Map<React.Key, number>>();
  protected keyGenMapper = new Map<Array<any>, ArrayKeyGeneratorFn<any>>();
  /* tslint:enable:no-any */

  public static get = function(): ArrayKeyIndexMap {
    if (!ArrayKeyIndexMap.instance) {
      ArrayKeyIndexMap.instance = new ArrayKeyIndexMap();
    }
    return ArrayKeyIndexMap.instance;
  };

  public getOrCreateKeyIndexMap<V>(array: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>): Map<React.Key, number> {
    let keyIndexMap = this.arrayMapper.get(array);
    if (!keyIndexMap) {
      keyIndexMap = this.populateMaps(array, keyGenerator);
      this.arrayMapper.set(array, keyIndexMap);
    }
    return keyIndexMap;
  }

  public getKeyGeneratorFn<V>(array: Array<V>): ArrayKeyGeneratorFn<V> {
    let result = this.keyGenMapper.get(array);
    if (!result) {
      throw new Error(`Failed to find key gen fn for array`);
    }
    return result;
  }

  public size(): number {
    return this.arrayMapper.size;
  }

  public get<V>(array: Array<V>): Map<React.Key, number> {
    let result = this.arrayMapper.get(array);
    if (!result) {
      throw new Error(`Failed to find map for array`);
    }
    return result;
  }

  public hasKeyIndexMap<V>(array: Array<V>): boolean {
    return this.arrayMapper.has(array) && this.keyGenMapper.has(array);
  }

  /**
   * Creates the key index map, then inserts into it and the keyGenMapper
   * @param {Array<V>} array
   * @param {ArrayKeyGeneratorFn<V>} keyGenerator
   * @returns {Map<React.Key, number>} the key/index map
   */
  protected populateMaps<V>(array: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>): Map<React.Key, number> {
    this.keyGenMapper.set(array, keyGenerator);
    let map = new Map<React.Key, number>();
    array.forEach((value, index, values) => {
      let reactKey = keyGenerator(value, index, values);
      if (map.has(reactKey)) {
        throw new Error(`Duplicate React key calculated at index ${index}, key=${reactKey}`);
      }
      map.set(reactKey, index);
    });
    return map;
  }

  public deleteFromMaps<V>(array: Array<V>): boolean {
    this.keyGenMapper.delete(array);
    return this.arrayMapper.delete(array);
  }
}

/**
 * Standalone data structure: for each array in state, maps React list keys to array indexes.
 *
 * - singleton created at startup
 * - entries <Array, KeyIndexMap> are created lazily
 * - updated upon ArrayMutateAction update
 * - deleted upon StateCrudAction array delete
 *
 * Note that duplicated keys result in an Error being thrown.
 */
// export const arrayKeyIndexMap = new ArrayKeyIndexMap();

/**
 *
 */
export class ArrayMutateAction
  <S extends StateObject, K extends keyof S, V> extends StateAction<S, K> {

  mutateResult?: {oldValue?: V};
  oldValue?: V | undefined;
  value: V | undefined;
  // see Typescript issue 20177 at https://github.com/Microsoft/TypeScript/issues/20771#issuecomment-367834171
  // ms: changed from optional to required, since arrays are simple properties that must be explicitly inserted
  valuesArray: Array<V> & S[K];
  index: number;
  keyGen: ArrayKeyGeneratorFn<V>;

  protected assignProps(from: ArrayMutateAction<S, K, V>) {
    super.assignProps(from);
    this.mutateResult = from.mutateResult;
    this.oldValue = from.oldValue;
    this.value = from.value;
    this.valuesArray = from.valuesArray;
    this.index = from.index;
    this.keyGen = from.keyGen;
  }

  public clone(): ArrayMutateAction<S, K, V> {
    let copy: ArrayMutateAction<S, K, V> = new ArrayMutateAction(
        this.type, this.parent,
        this.propertyName,
        this.index,
        this.valuesArray,
        this.keyGen,
        this.value);

    return copy;
  }

  // TODO: restrict the set of ActionId's here to regular property insert/update/delete
  constructor(actionType: ActionId, _parent: S, _propertyName: K, _index: number,
              valuesArray: Array<V> & S[K], _keyGen: ArrayKeyGeneratorFn<V>, _value?: V) {
    super(actionType, _parent, _propertyName);

    this.index = _index;
    this.value = _value;
    this.valuesArray = valuesArray;
    this.keyGen = _keyGen;
  }

  public containersToRender(containersBeingRendered: AnyContainerComponent[])
    : void {
    if (this.index > -1) {
      let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
      // super.concatContainersFromMappingActions(containersBeingRendered);
      // // super.containersToRender(containersBeingRendered, arrayOptions);
      let key = this.keyGen(this.valuesArray[this.index]);
      let mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath, key);
      this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
    } else {
      super.containersToRender(containersBeingRendered);
    }
  }

  protected mutate(perform: boolean = true): void {
    this.pristine = false;
    // annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoAction();

    let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    this.mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath) || [];

    this.mutateResult = mutateArray(actionId, this.parent, this.valuesArray, this.value, this.propertyName, this.index);
    if (perform) {
      this.oldValue = this.mutateResult ? this.mutateResult.oldValue : undefined;
      this.mutated = true;
    } else {
      this.mutateResult = undefined;
      this.oldValue = undefined;
      this.mutated = false;
    }
  }
}

/**
 * Define a mapping between a state property and a component property, and optionally
 * provide a function or functions that are executed after the mapping is performed
 * but before anything is rendered (e.g., to transform other property data).
 *
 * The functionality provided here is analogous to, but works very differently from,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent state
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 * TP: a particular key of VP
 * A: application state
 * E: array element type, if the property type is an array
 */

export class MappingAction
  <S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP, A extends StateObject, E>
  extends StateAction<S, K> {

  component: ContainerComponent<CP, VP, A>;
  fullPath: string;
  targetPropName: TP;
  dispatches: DispatchType[];

  //
  index: number = -1;
  keyGen?: ArrayKeyGeneratorFn<E>;
  propArray?: Array<E>;

  protected assignProps(from:  MappingAction<S, K, CP, VP, TP, A, E>) {
    super.assignProps(from);
    this.component = from.component;
    this.fullPath = from.fullPath;
    this.targetPropName = from.targetPropName;
    this.dispatches = from.dispatches;
    this.index = from.index;
  }

  public clone(): MappingAction<S, K, CP, VP, TP, A, E> {
    let copy = new MappingAction<S, K, CP, VP, TP, A, E>(
        this.parent,
        this.propertyName,
        this.component,
        this.targetPropName,
        ...this.dispatches);
    copy.assignProps(this);
    return copy;
  }

  /**
   * Create a new mapping action from a state property to a view property
   *
   * @param {S} parent
   * @param {K} _propertyOrArrayName
   * @param {ContainerComponent<CP, VP, any>} _component
   * @param {TP} targetPropName
   * @param {DispatchType} dispatches - these are generally instance functions in the component that update other
   *          component view properties as a function of the target view property having changed.
   */

  constructor(
              parent: S,
              _propertyOrArrayName: K,
              _component: ContainerComponent<CP, VP, A>,
              targetPropName: TP,
              ...dispatches: DispatchType[]
              ) {
    super(ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName);
    this.component = _component;
    this.fullPath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    this.targetPropName = targetPropName;
    this.dispatches = dispatches;
  }

  getValue(): S[K] {
    return this.parent[this.propertyName];
  }

  getTargetPropName(): keyof VP {
    return this.targetPropName;
  }

  /**
   * Map this component to an array element object, e.g., a row of data.  We are mapping the index of the
   * state array and the container, while populating the ArrayKeyIndexMap (maps React.Key to index).
   *
   * Note that this method will throw if the index is invalid or refers to an undefined value in the array.
   *
   * @param {number} _index
   * @param {S[K] & Array<E>} _propArray
   * @param {ArrayKeyGeneratorFn<E>} _keyGen
   */
  public setArrayElement(_index: number, _propArray: S[K] & Array<E>, _keyGen: ArrayKeyGeneratorFn<E>)
    : MappingAction<S, K, CP, VP, TP, A, E> {
    if (this.index > -1 || this.keyGen || this.propArray) {
      // this can be done once and only once, or we throw
      throw new Error(`attempting to reset array ${this.propertyName} at index = ${_index}`);
    }
    if (_propArray.length < _index || _propArray.length < 0 || !_propArray[_index]) {
      let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
      throw new Error(`Can't map to an undefined array index ${_index} at ${fullpath}`);
    }
    // initialize the map using current state values
    ArrayKeyIndexMap.get().getOrCreateKeyIndexMap(_propArray, _keyGen);
    this.index = _index;
    this.keyGen = _keyGen;
    this.propArray = _propArray;
    return this;
  }

  public getIndex(): number {
    return this.index;
  }

  /**
   * Map this property/component pair to the applications ContainerState, or if false, unmap it.
   * @param {boolean} perform
   */
  protected mutate(perform: boolean = true): void {
    this.pristine = false;

    // If this action refers to an element at an array index, compute the key
    let key = (this.propArray && this.keyGen && this.index > -1) ? this.keyGen(this.propArray[this.index]) : undefined;
    if (perform) {
      let components = Manager.get(this.parent).getMappingState().getOrCreatePathMappings(this.fullPath, key);
      components.push(this);
    } else {
      Manager.get(this.parent).getMappingState().removePathMapping(this.fullPath, this, key);
    }
  }

  // on componentDidMount
  performMutation() {
    this.mutate(true);
  }
  // on componentWillUnmount
  undoMutation() {
    this.mutate(false);
  }
  redo() {
    this.performMutation();
  }
}

/* tslint:disable:no-any */
export type AnyMappingAction = MappingAction<any, any, any, any, any, any, any>;
/* tslint:enable:no-any */