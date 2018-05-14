import { Action } from '../actions/actions';
import { Store, StateConfigOptions } from './State';
import { AnyContainerComponent } from '../components/ContainerComponent';
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
    /* tslint:disable:no-any */
  protected mutationCheck: StateMutationCheck<any>;
    /* tslint:enable:no-any */
  private preProcessors: ActionProcessorFunctionType[] = [];
  private postProcessors: ActionProcessorFunctionType[] = [];

  private updatedComponents: AnyContainerComponent[];

    /* tslint:disable:no-any */
  constructor(state: Store<any>, options: StateConfigOptions) {
    this.mutationCheck = new StateMutationCheck<any>(state);
      /* tslint:enable:no-any */
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

  /**
   * This is where mutation checking is enabled, and is where the first snapshot is taken.
   *
   * BE CAREFUL to call this after any state initialization (done by means other than actions),
   * as it will cause mutation errors!
   */
  public enableMutationChecking(): void {
    this.mutationCheck.enableMutationChecks();
  }

  public disableMutationChecking(): void {
    this.mutationCheck.disableMutationChecks();
  }

  // protected renderer(actions: Action[]): Action[] {
  //   this.updatedComponents = [];
  //   actions.forEach((action: Action) =>
  //     action.containersToRender(this.updatedComponents) );
  //   if (this.updatedComponents.length > 0) {
  //     this.updatedComponents.forEach( (container: AnyContainerComponent) =>
  //       container.handleChange(actions));
  //   }
  //   return actions;
  // }

  protected renderer(actions: Action[]): Action[] {
    this.updatedComponents = [];
    actions.forEach((action: Action) => {
      let uc: AnyContainerComponent[] = [];
      action.containersToRender(uc);
      if (uc.length > 0) {
        uc.forEach(container => container.handleChange([action]));
      }
      this.updatedComponents.concat(uc);
    });

    // if (this.updatedComponents.length > 0) {
    //   this.updatedComponents.forEach( (container: AnyContainerComponent) =>
    //     container.handleChange(actions));
    // }
    return actions;
  }

  /**
   * Return an array of the last ContainerComponents that were updated and rendered, see {@link renderer}.
   * @returns {AnyContainerComponent[]}
   */
  public getUpdatedComponents(): AnyContainerComponent[] {
    return this.updatedComponents;
  }

  public preProcess(actions: Action[]): Action[] {
    actions = this.process(actions, this.preProcessors);
    if (this.mutationCheck.isEnabled()) {
      this.mutationCheck.preActionStateCheck(actions);
    }
    return actions;
  }

  public postProcess(actions: Action[]): Action[] {
    // if checking for changes, do it immediately after actions have executed
    if (this.mutationCheck.isEnabled()) {
      this.mutationCheck.postActionCopyState(actions);
    }
    actions.forEach((action) => {
      if (action.postHook) {
        action.postHook();
      }
    });
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