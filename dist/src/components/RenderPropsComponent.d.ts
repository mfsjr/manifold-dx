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
export declare function isContainerRenderProps<CP, VP, RP extends CP & ContainerRenderProps<VP>>(props: CP | RP): props is RP;
export declare abstract class RenderPropsComponent<CP extends ContainerRenderProps<VP>, VP, A extends StateObject, RS = {}> extends ContainerComponent<CP, VP, A> {
    constructor(_props: CP, appData: StateObject & A, reactState?: RS);
    render(): ReactNode;
}
