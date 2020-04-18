import { Manager } from './Manager';
import { Action } from '..';
/**
 * State data is comprised of plain objects that are modified to implement this interface.
 *
 * Note the root/top state object's parent is null.
 */
export interface StateObject {
    _parent: StateObject | null;
    _myPropname: string;
}
/**
 * Helper interface for composing the initial state, not necessary, but improves usability.
 * Uses generics to enforce that this obect's _myPropname is defined in the parent.
 *
 * P: the generic type of the parent.
 */
export interface State<P extends StateObject | null> extends StateObject {
    _parent: StateParent<P>;
    _myPropname: StateProp<P>;
}
export declare type StateParent<P> = P extends StateObject ? P : null;
export declare type StateProp<P> = StateParent<P> extends null ? '' : Extract<keyof P, string>;
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
    static StateKeys: string[];
    /** the single store of data for this application */
    private state;
    private manager;
    /**
     * Create state as a plain object.
     * @param parent container for this container, if undefined it implies this is to be root/top state
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
     * Convert an arbitrary data object of type T to type StateObject & T, and add to the parent.
     *
     * The resulting state object is ready-to-use upon return, having had its own
     * properties set, and inserted into its parent.
     *
     * Also note that the root app state is never initialized here, but
     * in the constructor of the State class.
     *
     * @param {StateObject} _parent
     * @param {string} propertyName
     * @param {T} data
     * @returns {StateObject & T}
     */
    static convertAndAdd<T>(_parent: StateObject, propertyName: string, data: T): StateObject & T;
    static getRootState(stateObject: StateObject): StateObject;
    /**
     * Iterate through parent containers up to and including the root application state.
     *
     * This reference points out how to make iterators work, basically by including the lib.es6.d.ts, see
     * the very bottom of https://basarat.gitbooks.io/typescript/content/docs/iterators.html.
     *
     * Also note that lib.es6.d.ts defines IteratorResult<T> as { done: boolean, value: T }, ie, value is required,
     * so examples that omit it are also hosed, that interface should be { done: boolean, value?: T }.
     *
     * Will not be 'done' until next() is called when iterator's current stateObject/value equals null.
     *
     * This code looks a little awkward, since we need to return State once before returning done = true.
     * But, that seems to be the most sensible behavior.
     *
     * @param {StateObject} stateObject
     * @returns {Iterator<StateObject>}
     */
    static createStateObjectIterator: (stateObject: StateObject) => Iterator<StateObject, any, undefined>;
    /**
     * The intention here is to strip the state object down to a simple object, or optionally go even
     * further and remove all functions so that it is pure data.
     */
    static stripStateObject(stateObject: any, includingFunctions?: boolean): any;
    private static getStateKeys;
    constructor(appData: A, options: StateConfigOptions);
    /**
     * Add a child state object to the parent state object.  Note that the parent is assumed to be
     * in this store, and if it isn't this method will throw an error.
     *
     * @param parent
     * @param child
     * @param childPropName
     */
    addChildToParent<P extends StateObject, K extends Extract<keyof P, string>, C extends P[K] & StateObject>(parent: P, child: C, childPropName: K): void;
    reset(appData: A, options: StateConfigOptions): void;
    getState(): StateObject & A;
    getManager(): Manager;
    /**
     * Convenience method, seems likely that devs with Flux/Redux experience might expect this method to be here
     * @param {Action} actions
     * @returns {Action[]}
     */
    dispatch(...actions: Action[]): Action[];
    dispatchUndo(nActions?: number): Action[];
    dispatchRedo(nActions?: number): Action[];
    /**
     * This method should only be called during action dispatch, which means you should do your
     * best to avoid calling it at all.
     *
     * A use-case for calling this would be when you start to render something that requires
     * authorization, so you can check to see whether the user is authorized, so you can
     * respond accordingly, eg render if authorized, redirect elsewhere, pop up a message for the user, etc.
     *
     * Note that this only allows simple dispatches, no undo or redo.
     *
     * @param actions
     */
    dispatchNext(...actions: Action[]): Promise<Action[]>;
}
/**
 * This is only used in {@link JSON.stringify}, to prevent cyclic errors arising from
 * container._parent === container.  To serialize app state, see the JSOG npm.
 * @param key
 * @param value
 * @returns {string}
 */
export declare function JSON_replaceCyclicParent(key: any, value: any): any;
