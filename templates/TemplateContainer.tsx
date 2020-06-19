import { AnyMappingAction, ContainerComponent, StateObject } from '../src';
import { createTestStore } from '../test/testHarness';
import * as React from 'react';
import { FunctionComponent } from 'react';

// You will typically define and import your AppState from elsewhere in your application
interface AppState extends StateObject { }
// We're borrowing our test store, your app should have its own
const getAppStore = createTestStore;

export interface TemplateProps { }
export interface TemplateViewProps { }

/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
export class TemplateContainer extends ContainerComponent<TemplateProps, TemplateViewProps, AppState> {

  constructor(_props: TemplateProps) {
    super(_props, getAppStore().getState(), TemplateView);
  }

  /**
   * Create mapping actions from application state to viewProps
   * @see getMappingActionCreator
   * @see getArrayMappingActionCreator
   * @param mappingActions
   */
  protected appendToMappingActions(mappingActions: AnyMappingAction[]): void {
    // Create mapping actions from application state to viewProps here (see docs), eg
    // mappingActions.push(
    //   getMappingActionCreator(getModalState(), 'message').createPropertyMappingAction(this, 'alertMessage')
    // );
  }

  createViewProps(): TemplateViewProps {
    return { };
  }
}

/**
 * This is the component we are delegating our rendering to.  This is an old pattern, described
 * using class components here: https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
 * @param props
 * @constructor
 */
export const TemplateView: FunctionComponent<TemplateViewProps> = (props: TemplateViewProps) => {
  return (
    <span>hi</span>
  );
};
