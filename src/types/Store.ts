import { Manager } from './Manager';
import * as _ from 'lodash';
import { onFailureDiff } from './StateMutationDiagnostics';
import { Action } from '..';

/**
 * State data is comprised of plain objects that are modified to implement this interface.
 *
 * Note that __parents__ are never null (top level app state is self-referencing)
 */
export interface StateObject {
  _parent: StateObject;
  _myPropname: string;
}

/**
 * Options which may be passed directly to the State constructor
 */
export interface StateConfigOptions {
  actionQueueSize?: number;
}

/**
 * Facade that joins the user's data with the framework's management of it.
 *
 * The generic type for the resulting state is StateObject & A.
 *
 * A: represents the type (structure) of the app data that the state will be initialized to.
 */
export class Store<A> {

  private static StateKeys: string[] = Store.getStateKeys();

  /** the single store of data for this application */
  private state: StateObject & A;

  private manager: Manager;

  /**
   * Create state as a plain object.
   * @param parent container for this container, if undefined it implies this is to be top-level state
   * @param propertyName of this container in its parent, ie parent[propName] = returnValue (state)
   * @returns {StateObject}
   */
  public static convertToStateObject<T>(initialState: T, parent?: StateObject, propertyName?: string): T & StateObject {
    if (!_.isPlainObject(initialState)) {
      throw Error('State objects must be plain objects');
    }
    let state = initialState;
    state[`_parent`] = parent ? parent : state;
    state[`_myPropname`] = propertyName ? propertyName : '';
    if (parent && propertyName) {
      parent[propertyName] = state;
    } else if (parent || propertyName) {
      throw Error(`parent and propName should either both be defined or undefined; propName=${propertyName}`);
    }
    return state as T & StateObject;
  }

  /**
   * Is the object an StateObject?  Note this is not the same as an instance of
   * the State class.
   *
   * Also note that this is a type guard, see "Type Guards" in
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html
   *
   * @param object
   * @returns {boolean}
   */
    /* tslint:disable:no-any */
  public static isInstanceOfStateObject(object: any): object is StateObject {
      /* tslint:enable:no-any */
      if (!object) {
          return false;
      }

      if (!_.isPlainObject(object)) {
          return false;
      }
      let objectKeys: string[] = Object.keys(object);
      for (let key in this.StateKeys) {
          if (objectKeys.indexOf(this.StateKeys[key]) < 0) {
              return false;
          }
      }
      return true;
  }

  /**
   * Create a state object given 'data' of type T.
   *
   * The resulting state object is ready-to-use upon return, having had its own
   * properties set, and inserted into its parent.
   *
   * Also note that the topmost app state is never initialized here, but
   * in the constructor of the State class.
   *
   * @param {StateObject} _parent
   * @param {string} propertyName
   * @param {T} data
   * @returns {StateObject & T}
   */
  public static createStateObject<T>(_parent: StateObject, propertyName: string, data: T): StateObject & T {
      let stateObject = Store.convertToStateObject(data, _parent, propertyName);
      return stateObject;
  }

  public static getTopState(stateObject: StateObject): StateObject {
    let result = stateObject;
    while (result._parent !== result) {
      result = result._parent;
    }
    return result;
  }

  /**
   * Iterate through parent containers up to and including the top-level application state.
   *
   * This reference points out how to make iterators work, basically by including the lib.es6.d.ts, see
   * the very bottom of https://basarat.gitbooks.io/typescript/content/docs/iterators.html.
   *
   * Also note that lib.es6.d.ts defines IteratorResult<T> as { done: boolean, value: T }, ie, value is required,
   * so examples that omit it are also hosed, that interface should be { done: boolean, value?: T }.
   *
   * Will not be 'done' until next() is called when iterator's current stateObject/value equals the
   * top-level application State (also an StateObject).
   *
   * This code looks a little awkward, since we need to return State once before returning done = true.
   * But, that seems to be the most sensible behavior.
   *
   * @param {StateObject} stateObject
   * @returns {Iterator<StateObject>}
   */
  public static createStateObjectIterator = function (stateObject: StateObject): Iterator<StateObject> {
      let currentContainer: StateObject = stateObject;
      let done: boolean = false;
      const next = function (): IteratorResult<StateObject> {
          let result = {done: done, value: currentContainer};
          // if we have just returned State, then we are now done
          done = currentContainer === currentContainer._parent;
          currentContainer = currentContainer._parent;
          return result;
      };

      return {next: next};
  };

  /**
   * The intention here is to strip the state object down to a simple object, or optionally go even
   * further and remove all functions so that it is pure data.
   */
    /* tslint:disable:no-any */
  public static stripStateObject(stateObject: any, includingFunctions?: boolean): any {
      /* tslint:enable:no-any */
      if (Store.isInstanceOfStateObject(stateObject)) {
          delete stateObject._myPropname;
          delete stateObject._parent;
          // let childStateObjects: StateObject[];
          for (let obj in stateObject) {
              if (Store.isInstanceOfStateObject(stateObject[obj])) {
                  this.stripStateObject(stateObject[obj]);
              } else {
                if (includingFunctions && typeof stateObject[obj] === 'function') {
                  delete stateObject[obj];
                }
              }
          }
      }
  }

  private static getStateKeys(): string[] {
    // let state = State.createState();
    let appState = new Store({}, {});
    return Object.keys(appState.getState());
  }

  constructor(appData: A, options: StateConfigOptions) {
    this.reset(appData, options);
  }

  public reset(appData: A, options: StateConfigOptions): void {
    // appData is modified s.t. its type becomes A & StateObject
    // if appData holds anything in a closure, its preserved by doing the type conversion (and casting) this way
    appData[`_parent`] = appData;
    appData[`_myPropname`] = '';
    this.state = appData as A & StateObject;
    // this.state = Object.assign(State.createState(), appData);
    this.manager = new Manager(this, options);
    Manager.set(this.state, this.manager);
    let stateMutateChecking = false;
    try {
      stateMutateChecking = process.env.REACT_APP_STATE_MUTATION_CHECKING === 'true';
    } catch (err) {
      // console.log(`process defined = ${!!process}`);
    }
    if (stateMutateChecking) {
      this.manager.getActionProcessorAPI().enableMutationChecking();
      this.manager.getActionProcessorAPI().setMutationCheckOnFailureFunction(onFailureDiff);
    }
  }

  public getState(): StateObject & A {
    return this.state;
  }

  public getManager(): Manager {
    return this.manager;
  }

  /**
   * Convenience method, seems likely that devs with Flux/Redux experience might expect this method to be here
   * @param {Action} actions
   * @returns {Action[]}
   */
  public dispatch(...actions: Action[]): Action[] {
    return this.manager.actionProcess(...actions);
  }

  public dispatchUndo(nActions: number = 1, ..._undoActions: Action[]): Action[] {
    return this.manager.actionUndo(nActions, ..._undoActions);
  }

  public dispatchRedo(nActions: number = 1): Action[] {
    return this.manager.actionRedo(nActions);
  }

}

/**
 * This is only used in JSON.stringify, to prevent cyclic errors arising from
 * container._parent === container
 * @param key
 * @param value
 * @returns {string}
 */
/* tslint:disable:no-any */
export function JSON_replaceCyclicParent(key: any, value: any) {
    /* tslint:enable:no-any */
  return key === '_parent' ? '(parent)' : value;
}
