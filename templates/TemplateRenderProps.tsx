import { AnyMappingAction, ContainerRenderProps, RenderPropsComponent, StateObject } from '../src';
import { createTestStore } from '../test/testHarness';
import { FunctionComponent } from 'react';

// You will typically define and import your AppState from elsewhere in your application
interface AppState extends StateObject { }
// We're borrowing our test store, your app should have its own
const getAppStore = createTestStore;

export interface TemplateRenderProps extends ContainerRenderProps<TemplateRenderViewProps> { }

/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
export class TemplateRender extends RenderPropsComponent<TemplateRenderProps, TemplateRenderViewProps, AppState> {

  constructor(_props: TemplateRenderProps) {
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

  createViewProps(): TemplateRenderViewProps {
    return { };
  }
}

// The view interface and function should be placed in a separate file in order to
// encourage making the view only a function of the props (ie, a pure function).
export interface TemplateRenderViewProps { }

export const TemplateRenderView: FunctionComponent<TemplateRenderViewProps> = (props: TemplateRenderViewProps) => {
  return null;
};
