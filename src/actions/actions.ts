import { changeArray, changeValue } from './changeState';
import { AnyContainerComponent, ContainerComponent } from '../components/ContainerComponent';
import { StateObject } from '../types/Store';
import { Manager } from '../types/Manager';
import { arrayMapDelete, arrayMapInsert } from '../types/MappingState';
import { ActionProcessorFunctionType } from '../types/ActionProcessor';

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
  RERENDER,
  INSERT_STATE_OBJECT,
  DELETE_STATE_OBJECT,
  INSERT_PROPERTY,
  UPDATE_PROPERTY,
  DELETE_PROPERTY,
  MAP_STATE_TO_PROP,
  UPDATE_PROPERTY_NO_OP, // typically due to newValue === oldValue
  INSERT_PROPERTY_NO_OP, // typically due to newValue === oldValue
  DELETE_PROPERTY_NO_OP, // typically due to newValue === oldValue
}

export const ActionTypeIsNoOp = (actionId: ActionId): boolean => {
  return actionId >= ActionId.UPDATE_PROPERTY_NO_OP;
};

/* tslint:disable:no-any */
/**
 * ContainerPostReducers are functions that can optionally be attached to mappings (see {@link MappingAction}).
 *
 * They are executed after a dispatched action has updated the component with the new state values, but immediately
 * before the component renders.  So this is a place where the component's view props could be modified.
 *
 * See {@link ContainerComponent#handleChange} and {@link ContainerComponent#invokeContainerPostReducers}
 *
 * Note that these differ from actionPostReducer in that those are attached to specific actions, and actionPostReducer
 * execute immediately before ContainerPostReducer callbacks.
 */
export type ContainerPostReducer = (action: StateCrudAction<any, any>) => void;
/* tslint:enable:no-any */

export abstract class Action {
  /**
   * Optional function to be invoked after an action has been dispatched and its reducer executed, but before rendering,
   * see {@link ActionProcessor} ar {ActionProcessor#postProcess}.
   */
  public actionPostReducer?: () => void;
  type: ActionId;
  changed: boolean = false;
  pristine: boolean = true;

  /**
   * Performs the change on the action, called by the {@link Manager}, and should only be called by it, with
   * the possible exception of testing.
   *
   * @param {Action} action
   * @param {boolean} perform - optional, will default to true, false means undo
   */
  public static perform(action: Action, perform?: boolean): void {
    action.performChange(perform);
  }

  /**
   * Undo the change on the action.  This is only called by the {@link Manager} and should never be called directly.
   * @param {Action} action
   */
  public static undo(action: Action): void {
    action.undoChange();
  }

  protected abstract change(perform: boolean): void;

  public abstract clone(): Action;

  public abstract dispatch(): void;

  constructor(actionType: ActionId) {
    this.type = actionType;
  }

  protected performChange(perform?: boolean): void {
    this.change(perform ? perform : true);
  }

  protected assignProps(from: Action) {
    this.type = from.type;
    this.changed = from.changed;
    this.pristine = from.pristine;
  }

  /**
   * Invert this action's type, or throw an error if its not invertible.
   * @returns {ActionId}
   */
  getUndoActionId(): ActionId {
    let undoAction: ActionId | undefined;

    if (this.type === ActionId.UPDATE_PROPERTY || this.type === ActionId.MAP_STATE_TO_PROP) {
      undoAction = this.type;
    }
    if (this.type === ActionId.DELETE_PROPERTY || this.type === ActionId.INSERT_PROPERTY) {
      undoAction = this.type === ActionId.INSERT_PROPERTY ? ActionId.DELETE_PROPERTY : ActionId.INSERT_PROPERTY;
    }
    if (this.type === ActionId.DELETE_STATE_OBJECT || this.type === ActionId.INSERT_STATE_OBJECT) {
      undoAction = this.type === ActionId.INSERT_STATE_OBJECT
          ? ActionId.DELETE_STATE_OBJECT
          : ActionId.INSERT_STATE_OBJECT;
    }
    if (!undoAction) {
      throw new Error(`Failed to find undoAction for ${this.type}, ${ActionId[this.type]}`);
    }
    return undoAction;
  }

  protected undoChange(): void {
    this.change(false);
  }

  public containersToRender(containersBeingRendered: AnyContainerComponent[]): void { return; }
}

export abstract class StateAction<S extends StateObject, K extends Extract<keyof S, string>> extends Action {

  parent: S;
  propertyName: K;
  mappingActions: AnyMappingAction[];

  protected assignProps(from: StateAction<S, K>) {
    super.assignProps(from);
    this.parent = from.parent;
    this.propertyName = from.propertyName;
    this.mappingActions = from.mappingActions;
  }

  constructor(actionType: ActionId, _parent: S | undefined, _propertyName: K) {
    super(actionType);
    if (!_parent) {
      throw new Error(`getMappingActionCreator received an undefined parent state object`);
    }
    this.parent = _parent;
    this.propertyName = _propertyName;
  }

  /**
   * Process the action.  A convenience method that calls Manager.get().actionPerform, which is the correct
   * way to process an action or an array of actions.
   */
  public dispatch(): void {
    Manager.get(this.parent).actionProcess(this);
  }
  public containersToRender(containersBeingRendered: AnyContainerComponent[]): void {
    let fullPath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    let mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullPath);
    this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
  }

  /**
   * Implementation used by property and array based actions to add unique containers to be rendered
   * to an array of other containers to be rendered.
   * @param containersBeingRendered
   * @param mappingActions
   */
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
 * Action classes contain instructions for changing state, in the form
 * of StateObjects.
 */
export class StateCrudAction<S extends StateObject, K extends Extract<keyof S, string>> extends StateAction<S, K> {
  changeResult?: {oldValue?: S[K]};
  oldValue?: S[K];
  value: S[K] | undefined;

  public getOldValue(): S[K] | undefined {
    return this.oldValue;
  }

  protected assignProps(from: StateCrudAction<S, K>) {
    super.assignProps(from);
    this.changeResult = from.changeResult;
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
    // if (actionType === ActionId.UPDATE_PROPERTY && _value instanceof Array) {
    //   throw new Error(
    //     `Arrays may be inserted or deleted, but not updated (you can insert, update or delete array elements)`);
    // }
  }

  protected change(perform: boolean = true): void {
    this.pristine = false;

    let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    this.mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath) || [];

    // annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoActionId();
    let _value = perform ? this.value : this.oldValue;
    this.changeResult = changeValue(actionId, this.parent, _value, this.propertyName);
    if (perform) {
      this.oldValue = this.changeResult ? this.changeResult.oldValue : undefined;
      this.changed = true;
    } else {
      this.changeResult = undefined;
      this.oldValue = undefined;
      this.changed = false;
    }
  }

}

/**
 * For mutating the elements in the array.
 */
export class ArrayChangeAction
  <S extends StateObject, K extends Extract<keyof S, string>, V> extends StateAction<S, K> {

  changeResult?: {oldValue?: V};
  oldValue?: V | undefined;
  value: V | undefined;
  // see Typescript issue 20177 at https://github.com/Microsoft/TypeScript/issues/20771#issuecomment-367834171
  // ms: changed from optional to required, since arrays are simple properties that must be explicitly inserted
  valuesArray: Array<V> & S[K];
  index: number;

  protected assignProps(from: ArrayChangeAction<S, K, V>) {
    super.assignProps(from);
    this.changeResult = from.changeResult;
    this.oldValue = from.oldValue;
    this.value = from.value;
    this.valuesArray = from.valuesArray;
    this.index = from.index;
  }

  public clone(): ArrayChangeAction<S, K, V> {
    let copy: ArrayChangeAction<S, K, V> = new ArrayChangeAction(
        this.type, this.parent,
        this.propertyName,
        this.index,
        this.valuesArray,
        this.value);

    return copy;
  }

  // TODO: restrict the set of ActionId's here to regular property insert/update/delete
  constructor(actionType: ActionId, _parent: S, _propertyName: K, _index: number,
              valuesArray: Array<V> & S[K], _value?: V) {
    super(actionType, _parent, _propertyName);

    this.index = _index;
    this.value = _value;
    this.valuesArray = valuesArray;
  }

  // Attempts to solve the problem of updating array actions for inserts/deletes above the index where it occurs.
  // This just doesn't work since container's viewProps get updated by using array actions' indexes and child values
  public containersToRender(containersBeingRendered: AnyContainerComponent[])
    : void {
    if (this.index > -1) {
      let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
      // super.concatContainersFromMappingActions(containersBeingRendered);
      // // super.containersToRender(containersBeingRendered, arrayOptions);
      // let key = this.keyGen(this.valuesArray[this.index]);
      let _index = this.index > -1 ? this.index : undefined;
      let mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath, _index);
      this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
    } else {
      super.containersToRender(containersBeingRendered);
    }
  }

  protected change(perform: boolean = true): void {
    this.pristine = false;
    // annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoActionId();

    let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    // let key = this.keyGen && this.index > -1 ? this.keyGen(this.valuesArray[this.index]) : undefined;

    // NOTE that index is of type number, required, not possibly undefined or null
    this.mappingActions = Manager.get(this.parent).getMappingState().getPathMappings(fullpath, this.index) || [];

    this.changeResult = changeArray(actionId, this.parent, this.valuesArray, this.value, this.propertyName, this.index);
    if (perform) {
      this.oldValue = this.changeResult ? this.changeResult.oldValue : undefined;
      this.changed = true;

      if (this.type === ActionId.INSERT_PROPERTY) {
        let mappingState = Manager.get(this.parent).getMappingState();
        let arrayMap = mappingState.getPathMappingsArrayMap(fullpath);
        if (!arrayMap) {
          /*tslint:disable:no-console*/
          console.log(`WARNING: action isn't wired to component, failed to get arrayMap for ${fullpath}`);
          /*tslint:enable:no-console*/
        }
        if (arrayMap) {
          // the component to be rendered will place its mapping actions in this slot
          arrayMapInsert(arrayMap, this.index, []);
        }
      } else if (this.type === ActionId.DELETE_PROPERTY) {
        let mappingState = Manager.get(this.parent).getMappingState();
        let arrayMap = mappingState.getPathMappingsArrayMap(fullpath);
        if (arrayMap) {
          // the component to be rendered will place its mapping actions in this slot
          arrayMapDelete(arrayMap, this.index);
        }
      }
    } else {
      this.changeResult = undefined;
      this.oldValue = undefined;
      this.changed = false;
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
  <S extends StateObject,
    K extends Extract<keyof S, string>, CP, VP,
    // TP extends ExtractMatching<S, K, VP> | ExtractMatchingArrayType<E, VP>,
    TP extends Extract<keyof VP, string>,
    // TP extends (E extends void ? ExtractMatching<S, K, VP> : ExtractMatchingArrayType<E, VP>),
    A extends StateObject,
    E extends unknown>
  extends StateAction<S, K> {

  component: ContainerComponent<CP, VP, A>;
  fullPath: string;
  targetPropName: TP;
  postReducerCallbacks: ContainerPostReducer[];

  //
  index: number | null = -1;
  propArray?: Array<E>;

  protected assignProps(from:  MappingAction<S, K, CP, VP, TP, A, E>) {
    super.assignProps(from);
    this.component = from.component;
    this.fullPath = from.fullPath;
    this.targetPropName = from.targetPropName;
    this.postReducerCallbacks = from.postReducerCallbacks;
    this.index = from.index;
  }

  public clone(): MappingAction<S, K, CP, VP, TP, A, E> {
    let copy = new MappingAction<S, K, CP, VP, TP, A, E>(
        this.parent,
        this.propertyName,
        this.component,
        this.targetPropName,
        ...this.postReducerCallbacks);
    copy.assignProps(this);
    return copy;
  }

  /**
   * Clone the action and modify the clone so that it 'undoes' this, i.e., unmaps this mapping.
   * @returns {MappingAction
   * <S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP, A extends StateObject, E>}
   */
  public getUndoAction() {
    let unmappingAction = this.clone();
    unmappingAction.pristine = true;
    unmappingAction.type = this.getUndoActionId();
    return unmappingAction;
  }

  /**
   * Create a new mapping action from a state property to a view property
   *
   * @param {S} parent
   * @param {K} _propertyOrArrayName
   * @param {ContainerComponent<CP, VP, any>} _component
   * @param {TP} targetPropName
   * @param {ContainerPostReducer} postReducerCallbacks - these are generally instance functions in the component that update other
   *          component view properties as a function of the target view property having changed.
   */

  constructor(
              parent: S,
              _propertyOrArrayName: K,
              _component: ContainerComponent<CP, VP, A>,
              targetPropName: TP,
              ...postReducerCallbacks: ContainerPostReducer[]
              ) {
    super(ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName);
    this.component = _component;
    this.fullPath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
    this.targetPropName = targetPropName;
    this.postReducerCallbacks = postReducerCallbacks;
  }

  getValue(): S[K] {
    return this.parent[this.propertyName];
  }

  getTargetPropName(): keyof VP {
    return this.targetPropName;
  }

  /**
   * Map this component to an array element object, e.g., a row of data.
   *
   * Note that this method will throw if the index is invalid or refers to an undefined value in the array.
   *
   * @param {number} _index
   * @param {S[K] & Array<E>} _propArray
   * @param {ArrayKeyGeneratorFn<E>} _keyGen
   */
  public setArrayElement(_index: number | null, _propArray: S[K] & Array<E>)
    : MappingAction<S, K, CP, VP, TP, A, E> {
    if ( (this.index !== -1 || this.index === null) || this.propArray) {
      // this can be done once and only once, or we throw
      throw new Error(`attempting to reset array ${this.propertyName} at index = ${_index}`);
    }
    if (_index !== null && (_propArray.length < _index || _propArray.length < 0 || !_propArray[_index])) {
      let fullpath = Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
      throw new Error(`Can't map to an undefined array index ${_index} at ${fullpath}`);
    }
    this.index = _index;

    this.propArray = _propArray;
    return this;
  }

  public getIndex(): number | null {
    return this.index;
  }

  /**
   * Map this property/component pair to the applications ContainerState, or if false, unmap it.
   * @param {boolean} perform
   */
  protected change(perform: boolean = true): void {
    this.pristine = false;

    // if this action refers to an element at an index, use that
    // if the index is -1 and the property is an array, set it to null and map the whole array, else
    // map the simple property
    let _index = this.index !== -1 ? this.index : (this.parent[this.propertyName] instanceof Array ? null : undefined);
    if (perform) {
      let components = Manager.get(this.parent).getMappingState().getOrCreatePathMapping(this.fullPath, _index);
      components.push(this);
    } else {
      Manager.get(this.parent).getMappingState().removePathMapping(this.fullPath, this, _index);
    }
  }

  // on componentDidMount
  performChange() {
    this.change(true);
  }
  // on componentWillUnmount
  undoChange() {
    this.change(false);
  }
  redo() {
    this.performChange();
  }
}

/* tslint:disable:no-any */
export type AnyMappingAction = MappingAction<any, any, any, any, any, any, any>;
/* tslint:enable:no-any */

export interface ActionLoggingObject {
  processor: ActionProcessorFunctionType;
  logging?: string[];
}

/**
 * Pure function that returns an object containing a logging ActionProcessorFunctionType.
 *
 * This optionally allows you to output to the console, and to retain the logging in an array.
 *
 * @param actions
 * @param _logging
 * @param _toConsole
 */
export function actionLogging(_logging?: string[], _toConsole?: boolean): ActionLoggingObject {
  let logging: string[] | undefined = _logging;

  let processor: ActionProcessorFunctionType = (actions: Action[]) => {
    let lines: string[] = [];
    actions.forEach(action => {
      // let isDataAction: boolean = !(actions[0] instanceof MappingAction);
      // lines.push(`isDataAction = ${isDataAction}`);
      lines.push(actionDescription(action));
    });
    if (_toConsole) {
      lines.forEach(line => {
        /*tslint:disable:no-console*/
        console.log(line);
        /*tslint:enable:no-console*/
      });
    }
    if (logging) {
      logging.splice(logging.length, 0, ...lines);
    }
    return actions;
  };

  return {
    processor,
    logging
  };
}

export const actionDescription = (action: Action): string => {
  if (action instanceof ArrayChangeAction) {
    let value: string = '';
    switch (action.type) {
      case ActionId.INSERT_PROPERTY:
        value = `new value = ${action.value}`;
        break;
      case ActionId.UPDATE_PROPERTY:
        value = `new value = ${action.value}`;
        break;
      default: value = '';
    }

    let path = Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
    let log = `StateCrudAction[${ActionId[action.type]}]: path: ${path}, index=${action.index}`;
    log += value ? ' value: ' + value : '';
    return log;
  }
  if (action instanceof StateCrudAction) {
    let path = Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
    let value: string = '';
    switch (action.type) {
      case ActionId.INSERT_PROPERTY:
        value = `new value = ${action.value}`;
        break;
      case ActionId.UPDATE_PROPERTY:
        value = `new value = ${action.value}`;
        break;
      default: value = '';
    }
    return `StateCrudAction[${ActionId[action.type]}]: path: ${path} ${value ? 'value: ' + value : ''}`;
  }
  if (action instanceof MappingAction) {
    let path = Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
    let indexMessage = action.index !== null && action.index > -1 ? `, index=${action.index}` : '';
    let message = `MappingAction[${path} => ${action.targetPropName}]${indexMessage}`;
    return message;
  } // TODO: throw?
  return `Not StateCrud, Array or Mapping; action.type === ${ActionId[action.type]}`;
};
