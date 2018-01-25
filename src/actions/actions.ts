import {mutateArray, mutateValue} from "./mutations";
import {ContainerComponent} from "../components/ContainerComponent";
import {IStateObject} from "../types/State";
import {Manager} from "../types/Manager";


/**
 * ActionId's for calling api's that change state.
 *
 * Separate CRUD operations for state objects ({@link IStateObject}) vs regular data
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

export type DispatchType = (action: StateCrudAction<any,any>) => void;

export abstract class Action {
  type: ActionId;
  mutated: boolean = false;
  pristine: boolean = true;

  protected abstract mutate(perform: boolean): void;
  
  public abstract clone() : Action;

  constructor(actionType: ActionId) {
    this.type = actionType;
  }

  perform(): void {
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
    if (this.type == ActionId.DELETE_PROPERTY || this.type == ActionId.INSERT_PROPERTY) {
      undoAction = this.type == ActionId.INSERT_PROPERTY ? ActionId.DELETE_PROPERTY : ActionId.INSERT_PROPERTY;
    }
    if (this.type == ActionId.DELETE_STATE_OBJECT || this.type == ActionId.INSERT_STATE_OBJECT) {
      undoAction = this.type == ActionId.INSERT_STATE_OBJECT ? ActionId.DELETE_STATE_OBJECT : ActionId.INSERT_STATE_OBJECT;
    }
    return undoAction;
  }

  undo(): void {
    this.mutate(false);
  }

  public containersToRender(_containers: ContainerComponent<any,any,any>[]): void { };
}

export abstract class StateAction<S extends IStateObject, K extends keyof S> extends Action {
  parent: S;
  propertyName: K;

  protected assignProps(from: StateAction<S,K>) {
    super.assignProps(from);
    this.parent = from.parent;
    this.propertyName = from.propertyName;
  }

    constructor(actionType: ActionId, _parent: S, _propertyName: K) {
    super(actionType);
    this.parent = _parent;
    this.propertyName = _propertyName;
  }
}

/**
 * Action classes contain instructions for mutating state, in the form
 * of IStateObjects.
 */
export class StateCrudAction<S extends IStateObject, K extends keyof S> extends StateAction<S, K> {
  mutateResult?: {oldValue?: S[K]};
  oldValue?: S[K];
  value: S[K];
  mappingActions: MappingAction<any,any,any,any,any>[];

  public getOldValue(): S[K] {
    return this.oldValue;
  }

  protected assignProps(from: StateCrudAction<S,K>) {
    super.assignProps(from);
    this.mutateResult = from.mutateResult;
    this.oldValue = from.oldValue;
    this.value = from.value;
    this.mappingActions = from.mappingActions;
  }

  public clone() : StateCrudAction<S,K> {
    let copy = new StateCrudAction(this.type, this.parent, this.propertyName, this.value);
    copy.assignProps(this);
    return copy;
  }

  constructor(actionType: ActionId,_parent: S, _propertyName: K, _value: S[K]) {
    super(actionType, _parent, _propertyName);
    this.value = _value;
  }

  protected mutate(perform: boolean = true): void {
    this.pristine = false;

    let fullpath = Manager.get().getFullPath(this.parent, this.propertyName);
    this.mappingActions = Manager.get().getMappingState().getPathMappings(fullpath) || [];
    this.mappingActions = Manager.get().getMappingState().getPathMappings(fullpath) || [];

    //annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoAction();
    let _value = perform ? this.value : this.oldValue;
    this.mutateResult = mutateValue(actionId, this.parent, _value, this.propertyName);
    if (perform) {
      this.oldValue = this.mutateResult.oldValue;
      this.mutated = true;
    } else {
      this.mutateResult = undefined;
      this.oldValue = undefined;
      this.mutated = false;
    }
  }

  public containersToRender(containersBeingRendered: ContainerComponent<any,any,any>[]): void {
    let fullPath = Manager.get().getFullPath(this.parent, this.propertyName);
    let mappingActions = Manager.get().getMappingState().getPathMappings(fullPath);
    if (mappingActions) {
      let containers = mappingActions.map((mapping) => mapping.component);
      containers.forEach((container) => {
        if (containersBeingRendered.indexOf(container) < 0) {
          containersBeingRendered.push(container);
        }
      })
    }
  }
}

/**
 * @deprecated replace the array itself when an element changes.
 */
export class ArrayMutateAction<S extends IStateObject, K extends keyof S, V extends keyof S[K]> extends StateAction<S, K> {
  mutateResult?: {oldValue?: S[K][V]};
  oldValue?: S[K][V];
  value: S[K][V];
  valuesArray?: S[K]; // see Typescript issue 20177
  index: number;

  protected assignProps(from: ArrayMutateAction<S,K,V>) {
    super.assignProps(from);
    this.mutateResult = from.mutateResult;
    this.oldValue = from.oldValue;
    this.value = from.value;
    this.valuesArray = from.valuesArray;
    this.index = from.index;
  }

  public clone() : ArrayMutateAction<S,K,V> {
    let copy = new ArrayMutateAction(this.type, this.parent, this.propertyName, this.valuesArray, this.index, this.value);

    return copy;
  }

  constructor(actionType: ActionId,_parent: S, _propertyName: K, _values: S[K], _index: number,  _value: S[K][V]) {
    super(actionType, _parent, _propertyName);
    this.valuesArray = _values;
    this.index = _index;
    this.value = _value;
  }

  protected mutate(perform: boolean = true): void {
    this.pristine = false;
    //annotateActionInState(this);
    let actionId = perform ? this.type : this.getUndoAction();
    this.mutateResult = mutateArray(actionId, this.parent, this.valuesArray, this.value, this.propertyName, this.index);
    if (perform) {
      this.oldValue = this.mutateResult.oldValue;
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
 * The functionality provided here is analogous to, but not the same as,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent
 * K: key of the propertyOrArrayName
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 *
 * TP: keys of VP, the view prop type
 */

export class MappingAction
      <S extends IStateObject, K extends keyof S, CP, VP, TP extends keyof VP>
      extends StateAction<S,K> {

  component: ContainerComponent<CP,VP,any>;
  fullPath: string;
  targetPropName: TP;
  dispatches: DispatchType[];

  protected assignProps(from:  MappingAction<S,K,CP,VP,TP>) {
    super.assignProps(from);
    this.component = from.component;
    this.fullPath = from.fullPath;
    this.targetPropName = from.targetPropName;
    this.dispatches = from.dispatches;
  }

  public clone() : MappingAction<S,K,CP,VP,TP> {
    let copy = new MappingAction(this.parent, this.propertyName, this.component, this.targetPropName, ...this.dispatches);
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
              _component: ContainerComponent<CP,VP,any>,
              targetPropName: TP,
              ...dispatches: DispatchType[]
              )

  {
    super(ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName);
    this.component = _component;
    this.fullPath = Manager.get().getFullPath(this.parent, this.propertyName);
    this.targetPropName = targetPropName;
    this.dispatches = dispatches;
  }

  getValue(): S[K] {
    return this.parent[this.propertyName];
  }

  getTargetPropName(): TP {
    return this.targetPropName;
  }

  /**
   * Map this property/component pair to the applications ContainerState, or if false, unmap it.
   * @param {boolean} perform
   */
  protected mutate(perform: boolean = true): void {
    this.pristine = false;

    if (perform) {
      let components = Manager.get().getMappingState().getOrCreatePathMappings(this.fullPath);
      components.push(this);
    } else {
      Manager.get().getMappingState().removePathMapping(this.fullPath, this);
    }
  }

  // on componentDidMount
  perform() {
    this.mutate(true);
  }
  // on componentWillUnmount
  undo() {
    this.mutate(false);
  }
  redo() {
    this.perform();
  }
}