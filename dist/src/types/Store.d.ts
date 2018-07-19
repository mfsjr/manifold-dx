import { Manager } from './Manager';
import { Action } from '..';
/**
 * State data is comprised of plain objects that are modified to implement this interface.
 *
 * Note that __parents__ are never null (top level app state is self-referencing)
 */
export interface StateObject {
    _parent: StateObject | null;
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
export declare class Store<A> {
    private static StateKeys;
    /** the single store of data for this application */
    private state;
    private manager;
    /**
     * Create state as a plain object.
     * @param parent container for this container, if undefined it implies this is to be top-level state
     * @param propertyName of this container in its parent, ie parent[propName] = returnValue (state)
     * @returns {StateObject}
     */
    static convertToStateObject<T>(initialState: T, parent?: StateObject, propertyName?: string): T & StateObject;
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
    static isInstanceOfStateObject(object: any): object is StateObject;
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
    static createStateObject<T>(_parent: StateObject, propertyName: string, data: T): StateObject & T;
    static getTopState(stateObject: StateObject): StateObject;
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
    static createStateObjectIterator: (stateObject: StateObject) => Iterator<StateObject>;
    /**
     * The intention here is to strip the state object down to a simple object, or optionally go even
     * further and remove all functions so that it is pure data.
     */
    static stripStateObject(stateObject: any, includingFunctions?: boolean): any;
    private static getStateKeys();
    constructor(appData: A, options: StateConfigOptions);
    reset(appData: A, options: StateConfigOptions): void;
    getState(): StateObject & A;
    getManager(): Manager;
    /**
     * Convenience method, seems likely that devs with Flux/Redux experience might expect this method to be here
     * @param {Action} actions
     * @returns {Action[]}
     */
    dispatch(...actions: Action[]): Action[];
    dispatchUndo(nActions?: number, ..._undoActions: Action[]): Action[];
    dispatchRedo(nActions?: number): Action[];
}
/**
 * This is only used in JSON.stringify, to prevent cyclic errors arising from
 * container._parent === container
 * @param key
 * @param value
 * @returns {string}
 */
export declare function JSON_replaceCyclicParent(key: any, value: any): any;
