import { Action } from '../actions/actions';
import { State, StateConfigOptions } from './State';
import { StateMutationCheck } from './StateMutationCheck';
export declare type ActionProcessorFunctionType = (actions: Action[]) => Action[];
export interface ActionProcessors {
    pre: ActionProcessorFunctionType[];
    post: ActionProcessorFunctionType[];
}
export declare type ActionProcessorAPI = {
    appendPreProcessor: (processor: ActionProcessorFunctionType) => void;
    removePreProcessor: (toBeRemoved: ActionProcessorFunctionType) => void;
    appendPostProcessor: (processor: ActionProcessorFunctionType) => void;
    removePostProcessor: (toBeRemoved: ActionProcessorFunctionType) => void;
    isMutationCheckingEnabled(): boolean;
    enableMutationChecking(): void;
    disableMutationChecking(): void;
    getProcessorClones(): ActionProcessors;
    setMutationCheckOnFailureFunction<T>(newFunction: (baseline: T, source: T) => string): void;
    getMutationCheckOnFailureFunction<T>(): (baseline: T, source: T) => string;
};
export declare class ActionProcessor implements ActionProcessorAPI {
    protected mutationCheck: StateMutationCheck<any>;
    private preProcessors;
    private postProcessors;
    constructor(state: State<any>, options: StateConfigOptions);
    setMutationCheckOnFailureFunction<T>(newFunction: (baseline: T, source: T) => string): void;
    getMutationCheckOnFailureFunction<T>(): (baseline: T, source: T) => string;
    isMutationCheckingEnabled(): boolean;
    enableMutationChecking(): void;
    disableMutationChecking(): void;
    protected renderer(actions: Action[]): Action[];
    preProcess(actions: Action[]): Action[];
    postProcess(actions: Action[]): Action[];
    process(actions: Action[], processors: ActionProcessorFunctionType[]): Action[];
    /**
     * Processors executed in order, after the action is performed
     * @param {ActionProcessorFunctionType} processor
     */
    appendPostProcessor(processor: ActionProcessorFunctionType): void;
    removePostProcessor(toBeRemoved: ActionProcessorFunctionType): void;
    protected removeProcessorFrom(toBeRemoved: ActionProcessorFunctionType, processors: ActionProcessorFunctionType[]): void;
    removePreProcessor(toBeRemoved: ActionProcessorFunctionType): void;
    /**
     * Processors executed in order, before the action is performed.
     * @param {ActionProcessorFunctionType} processor
     */
    appendPreProcessor(processor: ActionProcessorFunctionType): void;
    getProcessorClones(): ActionProcessors;
}