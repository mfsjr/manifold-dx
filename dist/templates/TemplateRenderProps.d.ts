import { AnyMappingAction, ContainerRenderProps, RenderPropsComponent, StateObject } from '../src';
import { FunctionComponent } from 'react';
interface AppState extends StateObject {
}
export interface TemplateRenderProps extends ContainerRenderProps<TemplateRenderViewProps> {
}
/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
export declare class TemplateRender extends RenderPropsComponent<TemplateRenderProps, TemplateRenderViewProps, AppState> {
    constructor(_props: TemplateRenderProps);
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    protected appendToMappingActions(mappingActions: AnyMappingAction[]): void;
    createViewProps(): TemplateRenderViewProps;
}
export interface TemplateRenderViewProps {
}
export declare const TemplateRenderView: FunctionComponent<TemplateRenderViewProps>;
export {};
