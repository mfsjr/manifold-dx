import { Action, StateCrudAction, MappingAction, MappingHook } from './actions/actions';
import { ContainerComponent } from './components/ContainerComponent';
import { Store, StateObject } from './types/State';
import { ArrayChangeAction } from './actions/actions';
import { getActionCreator, getArrayActionCreator, getMappingActionCreator } from './actions/actionCreators';

/**
 * This is intended to be a list of objects you will need to use the library as-is.
 * For more advanced usage, others are available via direct reference, and examples
 * of usage should be in the unit tests.
 */
export {
  Store,
  StateObject,
  Action,
  getActionCreator,
  getArrayActionCreator,
  getMappingActionCreator,
  StateCrudAction,
  ArrayChangeAction,
  MappingAction,
  MappingHook,
  ContainerComponent
};