import { ComponentGenerator, ContainerComponent } from './ContainerComponent';
import { StateObject } from '..';
import { ReactNode, FunctionComponent } from 'react';

export interface ContainerRenderProps<VP> {
  _viewGenerator?: ComponentGenerator<VP>;
  _functionComp?: FunctionComponent<VP>;
}

/**
 * We assume that if props contains either a '_functionComp' or '_viewGenerator' prop, that they
 * are of the correct type and props implement the ContainerRenderProps<VP> interface.
 *
 * This is necessary because of weak type detection, which may make sense to me someday.
 * @param props
 */
export function isContainerRenderProps<CP, VP, RP extends CP & ContainerRenderProps<VP>>
(props: CP | RP): props is RP {
  return props[`functionComp`] || props[`viewGenerator`];
}

/**
 * ContainerComponent that defines the render function as a property.
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
