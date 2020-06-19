import { AnyMappingAction, ContainerComponent, StateObject } from '../src';
import { createTestStore } from '../test/testHarness';
import * as React from 'react';

// You will typically define and import your AppState from elsewhere in your application
interface AppState extends StateObject { }
// We're borrowing our test store, your app should have its own
const getAppStore = createTestStore;

export interface SimpleProps { }
export interface SimpleViewProps { }

/**
 * If you're ok with putting it all in one file (maybe your rendering function is simple),
 * this is a quick way to get started.
 */
export class TemplateSimple extends ContainerComponent<SimpleProps, SimpleViewProps, AppState> {

  constructor(_props: SimpleProps) {
    super(_props, getAppStore().getState());
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

  createViewProps(): SimpleViewProps {
    return { };
  }

  render() {
    // usually good to check these are initialized here
    if (!this.viewProps) {
      this.viewProps = this.createViewProps();
    }
    return (<span>hi</span>);
  }
}
