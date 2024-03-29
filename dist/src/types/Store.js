"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStateObject = exports.JSON_replaceCyclicParent = exports.Store = void 0;
var Manager_1 = require("./Manager");
var _ = require("lodash");
var StateMutationDiagnostics_1 = require("./StateMutationDiagnostics");
/**
 * Facade that joins the user's data with the framework's management of it.
 *
 * The generic type for the resulting state is StateObject & A.
 *
 * A: represents the type (structure) of the app data that the state will be initialized to.
 */
var Store = /** @class */ (function () {
    function Store(appData, options) {
        /**
         * for testing/debugging
         * @private
         */
        this._deferredDispatchCount = 0;
        this.reset(appData, options);
    }
    /**
     * Create state as a plain object.
     * @param parent container for this container, if undefined it implies this is to be root/top state
     * @param propertyName of this container in its parent, ie parent[propName] = returnValue (state)
     * @returns {StateObject}
     */
    Store.convertToStateObject = function (initialState, parent, propertyName) {
        if (!_.isPlainObject(initialState)) {
            throw Error('State objects must be plain objects');
        }
        var state = initialState;
        state["_parent"] = parent ? parent : state;
        state["_myPropname"] = propertyName ? propertyName : '';
        if (parent && propertyName) {
            parent[propertyName] = state;
        }
        else if (parent || propertyName) {
            throw Error("parent and propName should either both be defined or undefined; propName=".concat(propertyName));
        }
        return state;
    };
    /* tslint:disable:no-any */
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
    Store.isInstanceOfStateObject = function (object) {
        /* tslint:enable:no-any */
        if (!object) {
            return false;
        }
        if (!_.isPlainObject(object)) {
            return false;
        }
        var objectKeys = Object.keys(object);
        for (var key in this.StateKeys) {
            if (objectKeys.indexOf(this.StateKeys[key]) < 0) {
                return false;
            }
        }
        return true;
    };
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
    Store.convertAndAdd = function (_parent, propertyName, data) {
        var stateObject = Store.convertToStateObject(data, _parent, propertyName);
        return stateObject;
    };
    Store.getRootState = function (stateObject) {
        var _a;
        var result = stateObject;
        while (result._parent !== null) {
            result = result._parent;
            if (result._parent === ((_a = result._parent) === null || _a === void 0 ? void 0 : _a._parent)) { // this has only been observed during unit testing
                throw new Error("parents are self referencing in prop ".concat(result._myPropname));
            }
        }
        return result;
    };
    /* tslint:disable:no-any */
    /**
     * The intention here is to strip the state object down to a simple object, or optionally go even
     * further and remove all functions so that it is pure data.
     */
    Store.stripStateObject = function (stateObject, includingFunctions) {
        /* tslint:enable:no-any */
        if (Store.isInstanceOfStateObject(stateObject)) {
            // @ts-ignore we intend to break this StateObject (surfaced in TS 4.0.8)
            delete stateObject._myPropname;
            // @ts-ignore we intend to break this StateObject (surfaced in TS 4.0.8)
            delete stateObject._parent;
            // let childStateObjects: StateObject[];
            for (var obj in stateObject) {
                if (Store.isInstanceOfStateObject(stateObject[obj])) {
                    this.stripStateObject(stateObject[obj]);
                }
                else {
                    if (includingFunctions && typeof stateObject[obj] === 'function') {
                        delete stateObject[obj];
                    }
                }
            }
        }
    };
    Store.getStateKeys = function () {
        // let state = State.createState();
        var appStore = new Store({}, {});
        return Object.keys(appStore.getState());
    };
    Object.defineProperty(Store.prototype, "deferredDispatchCount", {
        get: function () {
            return this._deferredDispatchCount;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Add a child state object to the parent state object.  Note that the parent is assumed to be
     * in this store, and if it isn't this method will throw an error.
     *
     * @param parent
     * @param child
     * @param childPropName
     */
    Store.prototype.addChildToParent = function (parent, child, childPropName) {
        var myAppState = Store.getRootState(parent);
        if (myAppState !== this.getState()) {
            throw new Error('attempting to add a child to a parent that is not in this appState!');
        }
        parent[childPropName] = child;
    };
    Store.prototype.reset = function (appData, options) {
        // appData is modified s.t. its type becomes A & StateObject
        // if appData holds anything in a closure, its preserved by doing the type conversion (and casting) this way
        appData["_parent"] = null;
        appData["_myPropname"] = '';
        this.state = appData;
        // this.state = Object.assign(State.createState(), appData);
        this.manager = new Manager_1.Manager(this, options);
        Manager_1.Manager.set(this.state, this.manager);
        var stateMutateChecking = false;
        try {
            stateMutateChecking = process.env.REACT_APP_STATE_MUTATION_CHECKING === 'true';
        }
        catch (err) {
            // console.log(`process defined = ${!!process}`);
        }
        if (stateMutateChecking) {
            /*tslint:disable:no-console*/
            console.log("WARNING: mutation checking - REACT_APP_STATE_MUTATION_CHECKING - is on (intended for development only)");
            /*tslint:enable:no-console*/
        }
        if (stateMutateChecking) {
            this.manager.getActionProcessorAPI().enableMutationChecking();
            this.manager.getActionProcessorAPI().setMutationCheckOnFailureFunction(StateMutationDiagnostics_1.onFailureDiff);
        }
    };
    Store.prototype.getState = function () {
        return this.state;
    };
    Store.prototype.getManager = function () {
        return this.manager;
    };
    /**
     * Convenience method, seems likely that devs with Flux/Redux experience might expect this method to be here
     * @param {Action} actions
     * @returns {Action[]}
     */
    Store.prototype.dispatch = function () {
        var _a;
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i] = arguments[_i];
        }
        return (_a = this.manager).actionProcess.apply(_a, actions);
    };
    Store.prototype.dispatchUndo = function (nActions) {
        if (nActions === void 0) { nActions = 1; }
        return this.manager.actionUndo(nActions);
    };
    Store.prototype.dispatchRedo = function (nActions) {
        if (nActions === void 0) { nActions = 1; }
        return this.manager.actionRedo(nActions);
    };
    /**
     * This method performs async dispatch.  It may be needed if you are trying to dispatch while
     * React is rendering.
     *
     * A use-case for calling this would be when doing an auth check in a rendering function/component, so you can
     * respond accordingly, eg render if authorized, redirect elsewhere, pop up a message for the user, etc.
     *
     * Note that this api only allows simple dispatches, no undo or redo, although the actions dispatched
     * here will be undoable and/or redoable.
     *
     * @param actions
     */
    Store.prototype.dispatchNext = function () {
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i] = arguments[_i];
        }
        this._deferredDispatchCount++; // testing/debugging
        var dispatcher = this.dispatch.bind(this);
        /*tslint:disable:no-any*/
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve(dispatcher.apply(void 0, actions));
            }, 0);
        });
        /*tslint:enable:no-any*/
    };
    Store.StateKeys = Store.getStateKeys();
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
    Store.createStateObjectIterator = function (stateObject) {
        var currentContainer = stateObject;
        var done = false;
        var next = function () {
            var result = { done: done, value: currentContainer };
            // if we have just returned State, then we are now done
            done = null === currentContainer._parent;
            if (currentContainer._parent) {
                currentContainer = currentContainer._parent;
            }
            return result;
        };
        return { next: next };
    };
    return Store;
}());
exports.Store = Store;
/* tslint:disable:no-any */
/**
 * This is only used in {@link JSON.stringify}, to prevent cyclic errors arising from
 * container._parent === container.  To serialize app state, see the JSOG npm.
 * @param key
 * @param value
 * @returns {string}
 */
function JSON_replaceCyclicParent(key, value) {
    /* tslint:enable:no-any */
    return key === '_parent' ? '(parent)' : value;
}
exports.JSON_replaceCyclicParent = JSON_replaceCyclicParent;
/**
 * Get the state object.
 * @param state
 * @throws if the state object supplied is falsy.
 */
function getStateObject(state) {
    if (!state) {
        throw new Error("getStateObject received an undefined state object");
    }
    return state;
}
exports.getStateObject = getStateObject;
//# sourceMappingURL=Store.js.map