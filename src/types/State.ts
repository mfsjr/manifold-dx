import {Manager} from "./Manager";
import * as _ from 'lodash';


/**
 * State data is comprised of plain objects that are modified to implement this interface.
 *
 * Note that __parents__ are never null (top level app state is self-referencing)
 */
export interface IStateObject {

  __parent__: IStateObject,
  __my_propname__: string
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
 * The generic type for the resulting state is IStateObject & A.
 *
 * A: represents the type (structure) of the app data that the state will be initialized to.
 */
export class State<A> {

  private static state_keys: string[] = State.getStateKeys();

  private static getStateKeys(): string[] {
    let state = State.createState();
    return Object.keys(state);
  }

  /**
   * Create state as a plain object.
   * @param parent container for this container, falsey implies this is to be top-level state
   * @param propName of this container in its parent, ie parent[propName] = this
   * @returns {IStateObject}
   */
  public static createState(parent?: IStateObject, propName?: string): IStateObject {
    let state: {} = {};
    //state['__actions__'] = null;
    state['__parent__'] = parent ? parent : state;
    state['__my_propname__'] = propName ? propName : '';
    return state as IStateObject;
  };

  /**
   * Is the object an IStateObject?  Note this is not the same as an instance of
   * the State class.
   *
   * Also note that this is a type guard, see "Type Guards" in
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html
   *
   * @param object
   * @returns {boolean}
   */
  public static isInstanceOfIStateObject(object: any): object is IStateObject {
    if (!object) {
      return false;
    }

    if (!_.isPlainObject(object)) {
      return false;
    }
    let object_keys: string[] = Object.keys(object);
    for (let key in this.state_keys) {
      if (object_keys.indexOf(this.state_keys[key]) < 0) {
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
   * @param {IStateObject} _parent
   * @param {string} propertyName
   * @param {T} data
   * @returns {IStateObject & T}
   */
  public static createStateObject<T extends {}>(_parent: IStateObject, propertyName: string, data: T): IStateObject & T {
    let stateObject = State.createState(_parent, propertyName);

    let newStateObject = Object.assign(data, stateObject);
    _parent[propertyName] = newStateObject;

    return newStateObject;
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
   * top-level application State (also an IStateObject).
   *
   * This code looks a little awkward, since we need to return State once before returning done = true.
   * But, that seems to be the most sensible behavior.
   *
   * @param {IStateObject} stateObject
   * @returns {Iterator<IStateObject>}
   */
  public static createStateObjectIterator = function (stateObject: IStateObject): Iterator<IStateObject> {
    let currentContainer: IStateObject = stateObject;
    let done: boolean = false;
    const next = function (): IteratorResult<IStateObject> {
      let result = {done: done, value: currentContainer};
      // if we have just returned State, then we are now done
      done = currentContainer === currentContainer.__parent__;
      currentContainer = currentContainer.__parent__;
      return result;
    };

    return {next: next};
  };

  /** the single store of data for this application */
  private state: IStateObject & A;

  private manager: Manager;

  constructor(appData: A, options: StateConfigOptions) {
    this.reset(appData, options);
  }

  public reset(appData: A, options: StateConfigOptions): void {
    this.state = Object.assign(State.createState(), appData);
    this.manager = new Manager(this, options);
    let stateMutateChecking = false;
    try {
      stateMutateChecking = process.env.REACT_APP_MUTATION_CHECKING == 'true';
      //console.log(`process.env.REACT_APP_MUTATION_CHECKING = '${process.env.REACT_APP_MUTATION_CHECKING}'`);
    } catch (err) {
      console.log(`process defined = ${!!process}`);
    }
    if (stateMutateChecking) {
      this.manager.getActionProcessorAPI().enableMutationChecking();
    }
  }

  public getState(): IStateObject & A {
    return this.state;
  }

  public getManager(): Manager {
    return this.manager;
  }

  public static stripStateObject(stateObject: any): any {
    if (State.isInstanceOfIStateObject(stateObject)) {
      delete stateObject.__my_propname__;
      delete stateObject.__parent__;
      //let childStateObjects: IStateObject[];
      for (let obj in stateObject) {
        if (State.isInstanceOfIStateObject(stateObject[obj])) {
          this.stripStateObject(stateObject[obj]);
        }
      }
    }
  }
}


/**
 * This is only used in JSON.stringify, to prevent cyclic errors arising from
 * container.__parent__ === container
 * @param key
 * @param value
 * @returns {string}
 */
export function JSON_replaceCyclicParent(key: any, value: any) {
  return key == "__parent__" ? "(parent)" : value;
}
