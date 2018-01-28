import { State, StateObject, StateConfigOptions } from './State';
import { Action } from '../actions/actions';
import { MappingState } from './MappingState';
import { ActionQueue } from './ActionQueue';
import { ActionProcessor, ActionProcessorAPI } from './ActionProcessor';
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
    protected state: State<any>;
    protected actionQueue: ActionQueue;
    protected mappingState: MappingState;
    protected actionProcessor: ActionProcessor;
    static get(): Manager;
    static set(_manager: Manager): void;
    constructor(state: State<any>, options: StateConfigOptions);
    resetManager(state: State<any>, options: StateConfigOptions): void;
    getActionProcessorAPI(): ActionProcessorAPI;
    resetActionProcessors(state: State<any>, options: StateConfigOptions): void;
    getActionQueue(): ActionQueue;
    actionUndo(nActions?: number, ..._undoActions: Action[]): number;
    actionRedo(nActions?: number): number;
    actionPerform(...actions: Action[]): number;
    /**
     * Undo actions that have been performed.
     * @param {number} lastN
     * @returns {number}
     */
    undoAction(lastN?: number): number;
    /**
     * Redo actions that have been undone.
     * @param {number} nextN
     * @returns {number}
     */
    redoAction(nextN?: number): number;
    getFullPath(container: StateObject, propName: string): string;
    getMappingState(): MappingState;
}
