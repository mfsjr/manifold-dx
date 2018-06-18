import { Store, StateObject, StateConfigOptions } from './Store';
import { Action } from '../actions/actions';
import { MappingState } from './MappingState';
import { ActionQueue } from './ActionQueue';
import { ActionProcessor } from './ActionProcessor';
export declare type ActionSignature = (n?: number, ...actions: Action[]) => Action[];
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
export declare class Manager {
    /**
     * First section deals with statics, these aren't really singletons since this is
     * designed to allow testing methods to repeatedly create state, each with their
     * own manager.
     */
    protected static manager: Manager;
    protected static stateManagerMap: Map<StateObject, Manager>;
    protected dispatchingActions: boolean;
    protected dispatchArgs: DispatchArgs[];
    protected state: Store<any>;
    protected actionQueue: ActionQueue;
    protected mappingState: MappingState;
    protected actionProcessor: ActionProcessor;
    static get(stateObject: StateObject): Manager;
    static set(stateObject: StateObject, manager: Manager): void;
    constructor(state: Store<any>, options: StateConfigOptions);
    resetManager(state: Store<any>, options: StateConfigOptions): void;
    getActionProcessorAPI(): ActionProcessor;
    resetActionProcessors(state: Store<any>, options: StateConfigOptions): void;
    getActionQueue(): ActionQueue;
    actionUndo(nActions?: number, ..._undoActions: Action[]): Action[];
    actionRedo(nActions?: number): Action[];
    /**
     * All new actions are performed here.  Actions may be undone via {@link actionUndo} or replayed via
     * {@link actionRedo}.
     *
     * @param {Action} actions
     * @returns {number}
     */
    actionProcess(...actions: Action[]): Action[];
    protected dispatch(actionMethod: (action: Action) => void, ...actions: Action[]): Action[];
    dispatchFromNextArgs(_dispatchArgs: DispatchArgs[]): Action[];
    getFullPath(container: StateObject, propName: string): string;
    getMappingState(): MappingState;
}
