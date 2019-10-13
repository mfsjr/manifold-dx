import { Action, StateCrudAction, MappingAction, MappingHook, AnyMappingAction } from './actions/actions';
import { ContainerComponent } from './components/ContainerComponent';
import { RenderPropsComponent, ContainerRenderProps } from './components/RenderPropsComponent';
import { Store, StateObject, State, StateParent, StateProp } from './types/Store';
import { ArrayChangeAction } from './actions/actions';
import { getActionCreator, getArrayActionCreator, getMappingActionCreator } from './actions/actionCreators';
import { Manager } from 'types/Manager';

/**
 * This is intended to be a list of objects you will need to use the library as-is.
 * For more advanced usage, others are available via direct reference, and examples
 * of usage should be in the unit tests.
 */
export {
  Store,
  State,
  StateParent,
  StateProp,
  StateObject,
  Action,
  getActionCreator,
  getArrayActionCreator,
  getMappingActionCreator,
  StateCrudAction,
  ArrayChangeAction,
  Manager,
  MappingAction,
  AnyMappingAction,
  MappingHook,
  ContainerComponent,
  RenderPropsComponent,
  ContainerRenderProps
};
