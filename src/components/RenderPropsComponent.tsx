import { ComponentGenerator, ContainerComponent } from './ContainerComponent';
import { StateObject } from '..';
import { ReactNode, SFC } from 'react';

export interface ContainerRenderProps<VP> {
  _viewGenerator?: ComponentGenerator<VP>;
  _sfc?: SFC<VP>;
}

/**
 * We assume that if props contains either a '_sfc' or '_viewGenerator' prop, that they
 * are of the correct type and props implement the ContainerRenderProps<VP> interface.
 *
 * This is necessary because of weak type detection, which may make sense to me someday.
 * @param props
 */
export function isContainerRenderProps<CP, VP, RP extends CP & ContainerRenderProps<VP>>
(props: CP | RP): props is RP {
  return props[`sfc`] || props[`viewGenerator`];
}

export abstract class RenderPropsComponent<CP extends ContainerRenderProps<VP>, VP, A extends StateObject, RS = {} >
  extends ContainerComponent<CP, VP, A> {

  constructor(_props: CP, appData: StateObject & A, reactState?: RS) {
    super(_props, appData, _props._sfc, _props._viewGenerator, reactState);
  }

  public render(): ReactNode {
    // reassign sfc and viewGenerator every time we render...
    this.sfcView = this.props._sfc || this.sfcView;
    this.viewGenerator = this.props._viewGenerator || this.viewGenerator;
    return super.render();
  }
}
