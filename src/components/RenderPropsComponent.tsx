import { ContainerComponent } from './ContainerComponent';
import { StateObject } from '..';
import { ReactNode, FunctionComponent, ComponentClass } from 'react';

/**
 * Render props are a function that the developer must supply, and exactly one of them
 * must be defined.  If both are undefined (or defined), the component will throw an error
 * in its constructor (fail fast).
 */
export interface ContainerRenderProps<VP> {
  _viewGenerator?: ComponentClass<VP>;
  _functionComp?: FunctionComponent<VP>;
}

/**
 * ContainerComponent that defines the render function as a property using {@link ContainerRenderProps}.
 * This is generally preferable to using {@link ContainerComponent}.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 * RS: React State
 */
export abstract class RenderPropsComponent<CP extends ContainerRenderProps<VP>, VP, A extends StateObject, RS = {} >
  extends ContainerComponent<CP, VP, A, RS> {

  constructor(_props: CP, appData: StateObject & A, reactState?: RS) {
    super(_props, appData, _props._functionComp, _props._viewGenerator, reactState);
  }

  public render(): ReactNode {
    // reassign functionComponent and viewGenerator every time we render...
    this.functionCompView = this.props._functionComp || this.functionCompView;
    this.viewGenerator = this.props._viewGenerator || this.viewGenerator;
    return super.render();
  }
}
