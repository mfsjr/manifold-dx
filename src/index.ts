import { Action, StateCrudAction, MappingAction, DispatchType } from './actions/actions';
import { ContainerComponent } from './components/ContainerComponent';
import { State, StateObject } from './types/State';
import { ArrayMutateAction } from './actions/actions';
import { getCrudCreator, getArrayCrudCreator, getMappingCreator } from './actions/actionCreators';

/**
 * This is intended to be a list of objects you will need to use the library as-is.
 * For more advanced usage, others are available via direct reference, and examples
 * of usage should be in the unit tests.
 */
export {
  State,
  StateObject,
  Action,
  getCrudCreator,
  getArrayCrudCreator,
  getMappingCreator,
  StateCrudAction,
  ArrayMutateAction,
  MappingAction,
  DispatchType,
  ContainerComponent
};