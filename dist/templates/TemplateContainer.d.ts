import { AnyMappingAction, ContainerComponent, StateObject } from '../src';
import { FunctionComponent } from 'react';
interface AppState extends StateObject {
}
export interface TemplateProps {
}
export interface TemplateViewProps {
}
/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
export declare class TemplateContainer extends ContainerComponent<TemplateProps, TemplateViewProps, AppState> {
    constructor(_props: TemplateProps);
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    protected appendToMappingActions(mappingActions: AnyMappingAction[]): void;
    createViewProps(): TemplateViewProps;
}
/**
 * This is the component we are delegating our rendering to.  This is an old pattern, described
 * using class components here: https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
 * @param props
 * @constructor
 */
export declare const TemplateView: FunctionComponent<TemplateViewProps>;
export {};
