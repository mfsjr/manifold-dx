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
var State = /** @class */ (function () {
    function State(appData, options) {
        this.reset(appData, options);
    }
    /**
     * Create state as a plain object.
     * @param parent container for this container, falsey implies this is to be top-level state
     * @param propName of this container in its parent, ie parent[propName] = this
     * @returns {StateObject}
     */
    State.createState = function (parent, propName) {
        var state = {};
        var parentKey = '__parent__';
        state[parentKey] = parent ? parent : state;
        var propKey = '__my_propname__';
        state[propKey] = propName ? propName : '';
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
    State.isInstanceOfStateObject = function (object) {
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
    State.createStateObject = function (_parent, propertyName, data) {
        var stateObject = State.createState(_parent, propertyName);
        var newStateObject = Object.assign(data, stateObject);
        _parent[propertyName] = newStateObject;
        return newStateObject;
    };
    State.getTopState = function (stateObject) {
        var result = stateObject;
        while (result.__parent__ !== result) {
            result = result.__parent__;
        }
        return result;
    };
    /* tslint:disable:no-any */
    State.stripStateObject = function (stateObject) {
        /* tslint:enable:no-any */
        if (State.isInstanceOfStateObject(stateObject)) {
            delete stateObject.__my_propname__;
            delete stateObject.__parent__;
            // let childStateObjects: StateObject[];
            for (var obj in stateObject) {
                if (State.isInstanceOfStateObject(stateObject[obj])) {
                    this.stripStateObject(stateObject[obj]);
                }
            }
        }
    };
    State.getStateKeys = function () {
        var state = State.createState();
        return Object.keys(state);
    };
    State.prototype.reset = function (appData, options) {
        this.state = Object.assign(State.createState(), appData);
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
    State.prototype.getState = function () {
        return this.state;
    };
    State.prototype.getManager = function () {
        return this.manager;
    };
    State.StateKeys = State.getStateKeys();
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
    State.createStateObjectIterator = function (stateObject) {
        var currentContainer = stateObject;
        var done = false;
        var next = function () {
            var result = { done: done, value: currentContainer };
            // if we have just returned State, then we are now done
            done = currentContainer === currentContainer.__parent__;
            currentContainer = currentContainer.__parent__;
            return result;
        };
        return { next: next };
    };
    return State;
}());
exports.State = State;
/**
 * This is only used in JSON.stringify, to prevent cyclic errors arising from
 * container.__parent__ === container
 * @param key
 * @param value
 * @returns {string}
 */
/* tslint:disable:no-any */
function JSON_replaceCyclicParent(key, value) {
    /* tslint:enable:no-any */
    return key === '__parent__' ? '(parent)' : value;
}
exports.JSON_replaceCyclicParent = JSON_replaceCyclicParent;
//# sourceMappingURL=State.js.map