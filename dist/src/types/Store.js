"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.reset(appData, options);
    }
    /**
     * Create state as a plain object.
     * @param parent container for this container, if undefined it implies this is to be top-level state
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
            throw Error("parent and propName should either both be defined or undefined; propName=" + propertyName);
        }
        return state;
    };
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
    Store.createStateObject = function (_parent, propertyName, data) {
        var stateObject = Store.convertToStateObject(data, _parent, propertyName);
        return stateObject;
    };
    Store.getTopState = function (stateObject) {
        var result = stateObject;
        while (result._parent !== null) {
            result = result._parent;
        }
        return result;
    };
    /**
     * The intention here is to strip the state object down to a simple object, or optionally go even
     * further and remove all functions so that it is pure data.
     */
    /* tslint:disable:no-any */
    Store.stripStateObject = function (stateObject, includingFunctions) {
        /* tslint:enable:no-any */
        if (Store.isInstanceOfStateObject(stateObject)) {
            delete stateObject._myPropname;
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
        var appState = new Store({}, {});
        return Object.keys(appState.getState());
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
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i] = arguments[_i];
        }
        var _a;
        return (_a = this.manager).actionProcess.apply(_a, actions);
    };
    Store.prototype.dispatchUndo = function (nActions) {
        if (nActions === void 0) { nActions = 1; }
        var _undoActions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _undoActions[_i - 1] = arguments[_i];
        }
        var _a;
        return (_a = this.manager).actionUndo.apply(_a, [nActions].concat(_undoActions));
    };
    Store.prototype.dispatchRedo = function (nActions) {
        if (nActions === void 0) { nActions = 1; }
        return this.manager.actionRedo(nActions);
    };
    Store.StateKeys = Store.getStateKeys();
    /**
     * Iterate through parent containers up to and including the top-level application state.
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
/**
 * This is only used in JSON.stringify, to prevent cyclic errors arising from
 * container._parent === container
 * @param key
 * @param value
 * @returns {string}
 */
/* tslint:disable:no-any */
function JSON_replaceCyclicParent(key, value) {
    /* tslint:enable:no-any */
    return key === '_parent' ? '(parent)' : value;
}
exports.JSON_replaceCyclicParent = JSON_replaceCyclicParent;
//# sourceMappingURL=Store.js.map