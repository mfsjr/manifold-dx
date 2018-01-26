import { Action } from '../actions/actions';
import { State, StateConfigOptions } from './State';
import { ContainerComponent } from '../components/ContainerComponent';
import { StateMutationCheck } from './StateMutationCheck';

export type ActionProcessorFunctionType = (actions: Action[]) => Action[];

export interface ActionProcessors {
  pre: ActionProcessorFunctionType[];
  post: ActionProcessorFunctionType[];
}

export type ActionProcessorAPI = {
  appendPreProcessor: (processor: ActionProcessorFunctionType) => void,
  removePreProcessor: (toBeRemoved: ActionProcessorFunctionType) => void
  appendPostProcessor: (processor: ActionProcessorFunctionType) => void,
  removePostProcessor: (toBeRemoved: ActionProcessorFunctionType) => void
  isMutationCheckingEnabled(): boolean,
  enableMutationChecking(): void,
  disableMutationChecking(): void,
  getProcessorClones(): ActionProcessors,
  setMutationCheckOnFailureFunction<T>(newFunction: (baseline: T, source: T) => string): void,
  getMutationCheckOnFailureFunction<T>(): (baseline: T, source: T) => string
};

export class ActionProcessor implements ActionProcessorAPI {
  protected mutationCheck: StateMutationCheck<any>;
  private preProcessors: ActionProcessorFunctionType[] = [];
  private postProcessors: ActionProcessorFunctionType[] = [];
  private state: State<any>;

  constructor(state: State<any>, options: StateConfigOptions) {
    this.state = state;
    this.mutationCheck = new StateMutationCheck<any>(state);
  }

  public setMutationCheckOnFailureFunction<T>(newFunction: (baseline: T, source: T) => string): void {
    this.mutationCheck.onFailure = newFunction;
  }

  public getMutationCheckOnFailureFunction<T>(): (baseline: T, source: T) => string {
    return this.mutationCheck.onFailure;
  }

  public isMutationCheckingEnabled(): boolean {
    return this.mutationCheck.isEnabled();
  }

  public enableMutationChecking(): void {
    this.mutationCheck.enableMutationChecks();
  }

  public disableMutationChecking(): void {
    this.mutationCheck.disableMutationChecks();
  }

  protected renderer(actions: Action[]): Action[] {
    let updated: ContainerComponent<any, any, any>[] = [];
    actions.forEach(function (action: Action) {
      action.containersToRender(updated);
    });
    if (updated.length > 0) {
      updated.forEach(function (container: ContainerComponent<any, any, any>) {
        container.handleChange(actions);
      });
    }
    return actions;
  }

  public preProcess(actions: Action[]): Action[] {
    actions = this.process(actions, this.preProcessors);
    if (this.mutationCheck.isEnabled()) {
      this.mutationCheck.preActionTestState(actions);
    }
    return actions;
  }

  public postProcess(actions: Action[]): Action[] {
    // if checking for changes, do it immediately after actions have executed
    if (this.mutationCheck.isEnabled()) {
      this.mutationCheck.postActionCopyState(actions);
    }
    this.renderer(actions);
    return this.process(actions, this.postProcessors);
  }

  public process(actions: Action[], processors: ActionProcessorFunctionType[]): Action[] {
    if (processors) {
      let _actions = actions;
      for (let i = 0; i < processors.length; i++) {
        _actions = processors[i](_actions);
      }
      return _actions;
    }
    return actions;
  }

  /**
   * Processors executed in order, after the action is performed
   * @param {ActionProcessorFunctionType} processor
   */
  public appendPostProcessor(processor: ActionProcessorFunctionType): void {
    this.postProcessors.push(processor);
  }

  public removePostProcessor(toBeRemoved: ActionProcessorFunctionType): void {
    this.removeProcessorFrom(toBeRemoved, this.postProcessors);
  }

  protected removeProcessorFrom(toBeRemoved: ActionProcessorFunctionType, processors: ActionProcessorFunctionType[]) {
    let index = processors.indexOf(toBeRemoved);
    if (index > -1) {
      processors.splice(index, 1);
    }
  }

  public removePreProcessor(toBeRemoved: ActionProcessorFunctionType): void {
    this.removeProcessorFrom(toBeRemoved, this.preProcessors);
  }

  /**
   * Processors executed in order, before the action is performed.
   * @param {ActionProcessorFunctionType} processor
   */
  public appendPreProcessor(processor: ActionProcessorFunctionType): void {
    this.preProcessors.push(processor);
  }

  public getProcessorClones(): ActionProcessors {
    return {
      pre: [...this.preProcessors],
      post: [...this.postProcessors]
    };
  }
}