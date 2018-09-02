import { Store, StateObject, StateConfigOptions, JSON_replaceCyclicParent } from './Store';
import { Action } from '../actions/actions';
import { MappingState } from './MappingState';
import { createActionQueue, ActionQueue } from './ActionQueue';
import { ActionProcessor } from './ActionProcessor';

export type ActionSignature = (n?: number, ...actions: Action[]) => Action[];

export interface DispatchArgs {
  actionMethod: (action: Action) => void;
  actions: Action[];
}

/**
 * Manages state, contains no references to app-specific data, which is handled in the
 * State class.
 *
 * Note that the state class contains an instance of this class.
 */
export class Manager {
  /**
   * First section deals with statics, these aren't really singletons since this is
   * designed to allow testing methods to repeatedly create state, each with their
   * own manager.
   */
  protected static manager: Manager;

  protected static stateManagerMap: Map<StateObject, Manager> = new Map();

  protected dispatchingActions: boolean = false;

  protected dispatchArgs: DispatchArgs[] = [];

  /* tslint:disable:no-any */
  protected state: Store<any>;
  /* tslint:disable:no-any */

  protected actionQueue: ActionQueue;
  protected mappingState: MappingState;
  protected actionProcessor: ActionProcessor;

  public static get(stateObject: StateObject): Manager {
    let topState = Store.getTopState(stateObject);
    let result = Manager.stateManagerMap.get(topState);
    if (!result) {
      let err = `Failed to find manager for stateObject = 
        ${JSON.stringify(stateObject, JSON_replaceCyclicParent, 4)}`;
      throw Error(err);
    }
    return result;
  }

  public static set(stateObject: StateObject, manager: Manager): void {
    if (Manager.stateManagerMap.has(stateObject)) {
      let message = `Map already has key for 
        ${JSON.stringify(stateObject, JSON_replaceCyclicParent, 4)}`;
      throw new Error(message);
    }
    Manager.stateManagerMap.set(stateObject, manager);
  }

  constructor(state: Store<any>, options: StateConfigOptions) {
    this.resetManager(state, {});
    Manager.manager = this;
  }

  public resetManager(state: Store<any>, options: StateConfigOptions): void {
    this.state = state;
    this.actionQueue = createActionQueue(options.actionQueueSize);
    this.mappingState = new MappingState();
    this.resetActionProcessors(state, options);
  }

  public getActionProcessorAPI(): ActionProcessor {
    return this.actionProcessor;
  }

  public resetActionProcessors(state: Store<any>, options: StateConfigOptions) {
    this.actionProcessor = new ActionProcessor(state, options);
  }

  public getActionQueue() {
    return this.actionQueue;
  }
  // TODO: implement a single method for dispatching safely
  public actionUndo(nActions: number = 1, ..._undoActions: Action[]): Action[] {
    if (nActions === 0 && _undoActions.length === 0 ) {
      throw Error(`Expecting to undo existing actions or receive actions to undo, received neither`);
    }
    let actions = _undoActions.length > 0 ? _undoActions : this.actionQueue.lastActions(nActions);

    actions.forEach((action) => {
      if (actions !== _undoActions) {
        if (action.pristine) {
          throw Error('undo cannot be performed on new/original/pristine actions');
        }
      } else {
        if (!action.pristine) {
          throw Error('expecting actions passed in to be new/original/pristine');
        }
      }
    });
    let actionMethod = (action: Action) => {
      Action.undo(action);
      this.actionQueue.incrementCurrentIndex(-1);
    };
    return this.dispatch(actionMethod, ...actions);
  }

  public actionRedo(nActions: number = 1): Action[] {
    let actions = this.actionQueue.nextActions(nActions);
    actions.forEach((action) => {
      if (action.pristine) {
        throw Error('redo cannot be performed on new/original/pristine actions');
      }
    });
    let actionMethod = (action: Action) => {
      Action.perform(action);
      this.actionQueue.incrementCurrentIndex(1);
    };
    return this.dispatch(actionMethod, ...actions);
  }

  /**
   * All new actions are performed here.  Actions may be undone via {@link actionUndo} or replayed via
   * {@link actionRedo}.
   *
   * @param {Action} actions
   * @returns {number}
   */
  public actionProcess(...actions: Action[]): Action[] {
    actions.forEach((action) => {
      if (!action.pristine) {
        throw new Error('you can only perform actions for new/original/pristine actions');
      }
    });
    let actionMethod = (action: Action) => {
      Action.perform(action);
      this.actionQueue.push(action);
    };
    return this.dispatch(actionMethod, ...actions);
  }

  /**
   * Dispatch actions if none are being dispatched, else queue them for execution when current dispatch completes
   * @param actionMethod
   * @param actions
   */
  protected dispatch(actionMethod: (action: Action) => void, ...actions: Action[]): Action[] {
    if (this.dispatchingActions) {
      this.dispatchArgs.push({actionMethod, actions});
      return [];
    }

    try {
      this.dispatchingActions = true;
      actions = this.actionProcessor.preProcess(actions);
      actions.forEach((action) => actionMethod(action));
      actions = this.actionProcessor.postProcess(actions);
      this.dispatchingActions = false;
    } catch (err) {
      this.dispatchingActions = false;
      /*tslint:disable:no-console*/
      console.log(`Error during dispatch, action(s) = ${JSON.stringify(actions, JSON_replaceCyclicParent, 4)}`);
      /*tslint:disable:no-console*/
      throw err;
    }
    while (this.dispatchArgs.length > 0) {
      let deferredActions = this.dispatchFromNextArgs(this.dispatchArgs);
      actions.push(...deferredActions);
    }
    return actions;
  }

  public dispatchFromNextArgs(_dispatchArgs: DispatchArgs[]): Action[] {
    let args: DispatchArgs[] = _dispatchArgs.splice(0, 1);
    return this.dispatch(args[0].actionMethod, ...args[0].actions);
  }

  public getFullPath(container: StateObject, propName: string): string {
    let fullPath: string = propName;
    let containerIterator = Store.createStateObjectIterator(container);
    let iteratorResult: IteratorResult<StateObject> = containerIterator.next();
    while (!iteratorResult.done) {
      if (iteratorResult.value._parent !== iteratorResult.value && iteratorResult.value._parent !== null) {
        fullPath = iteratorResult.value._myPropname + '.' + fullPath;
      }
      iteratorResult = containerIterator.next();
    }
    return fullPath;
  }

  public getMappingState(): MappingState {
    return this.mappingState;
  }
}