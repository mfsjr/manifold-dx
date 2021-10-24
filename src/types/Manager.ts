import { Store, StateObject, StateConfigOptions, JSON_replaceCyclicParent } from './Store';
import { Action, actionDescription, ActionTypeIsNoOp, MappingAction } from '../actions/actions';
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

  // protected dispatchingActions: boolean = false;

  protected dispatchArgs: DispatchArgs[] = [];

  /* tslint:disable:no-any */
  protected store: Store<any>;
  /* tslint:disable:no-any */

  protected currentDataAction: Action | null = null;

  protected actionQueue: ActionQueue;
  protected mappingState: MappingState;
  protected actionProcessor: ActionProcessor;

  public static get(stateObject: StateObject): Manager {
    let rootState = Store.getRootState(stateObject);
    let result = Manager.stateManagerMap.get(rootState);
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

  constructor(_store: Store<any>, options: StateConfigOptions) {
    this.resetManager(_store, {});
    Manager.manager = this;
  }

  public resetManager(_store: Store<any>, options: StateConfigOptions): void {
    this.store = _store;
    this.actionQueue = createActionQueue(options.actionQueueSize);
    this.mappingState = new MappingState();
    this.resetActionProcessors(_store, options);
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

  /**
   * This method allows you to undo actions, from the most recent on backwards.
   * @param nActions
   * @param _undoActions
   */
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

  // NOTE: This commented dispatch code will catch if an action is dispatched while another executes, hold it until the
  // current action(s) are done executing, and then execute it.  Seems better to rule this out, but not really sure...
  // /**
  //  * Dispatch actions if none are being dispatched, else queue them for execution when current dispatch completes
  //  * @param actionMethod
  //  * @param actions
  //  */
  // protected dispatch2(actionMethod: (action: Action) => void, ...actions: Action[]): Action[] {
  //   if (this.dispatchingActions) {
  //     this.dispatchArgs.push({actionMethod, actions});
  //     return [];
  //   }
  //
  //   try {
  //     this.dispatchingActions = true;
  //     actions = this.actionProcessor.preProcess(actions);
  //     actions.forEach((action) => actionMethod(action));
  //     actions = this.actionProcessor.postProcess(actions);
  //     this.dispatchingActions = false;
  //   } catch (err) {
  //     this.dispatchingActions = false;
  //     /*tslint:disable:no-console*/
  //     console.log(`Error during dispatch, action(s) = ${JSON.stringify(actions, JSON_replaceCyclicParent, 4)}`);
  //     /*tslint:disable:no-console*/
  //     throw err;
  //   }
  //   while (this.dispatchArgs.length > 0) {
  //     let deferredActions = this.dispatchFromNextArgs(this.dispatchArgs);
  //     actions.push(...deferredActions);
  //   }
  //   return actions;
  // }

  /**
   * Strictly enforce that no data action can be dispatched while another is dispatching.
   * Mapping actions are invoked on rendering, so are dependent on React, which is async,
   * so we cannot enforce that here.
   *
   * @param actionMethod
   * @param actions
   */
  protected dispatch(actionMethod: (action: Action) => void, ...actions: Action[]): Action[] {
    // if a no-op exists, filter it and any others out of the array
    if (actions.find(action => ActionTypeIsNoOp(action.type))) {
      actions = actions.filter(action => !ActionTypeIsNoOp(action.type));
    }
    if (actions.length === 0) {
      return actions;
    }
    let dataAction = !(actions[0] instanceof MappingAction);

    if (dataAction && this.currentDataAction) {
      // attempting to dispatch actions while another is dispatching, so handle by deferring until we're done.
      this.store.dispatchNext(...actions);
      return [];
      // let currentDescription = actionDescription(this.currentDataAction);
      // let message = `Dispatch ${currentDescription} interrupted by another: ${actionDescription(actions[0])}`;
      // console.log(`Warning: ${message}`);
      // message += `\nNOTE: use the dispatchNext api to avoid this error (waits until current dispatch completes)`;
      // throw new Error(message);
    }
    try {
      if (dataAction) {
        this.currentDataAction = actions[0];
      }
      actions = this.actionProcessor.preProcess(actions);
      actions.forEach((action) => actionMethod(action));
      actions = this.actionProcessor.postProcess(actions);
    } catch (err) {
      let actionMessage = actionDescription(actions[0]);
      /*tslint:disable:no-console*/
      console.log(`Error dispatching ${actionMessage}, actions length = ${actions.length}`);
      /*tslint:disable:no-console*/
      throw err;
    } finally {
      if (dataAction) {
        this.currentDataAction = null;
      }
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
