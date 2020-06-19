/// <reference types="react" />
import { AnyMappingAction, ContainerComponent, StateObject } from '../src';
interface AppState extends StateObject {
}
export interface SimpleProps {
}
export interface SimpleViewProps {
}
/**
 * If you're ok with putting it all in one file (maybe your rendering function is simple),
 * this is a quick way to get started.
 */
export declare class TemplateSimple extends ContainerComponent<SimpleProps, SimpleViewProps, AppState> {
    constructor(_props: SimpleProps);
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    protected appendToMappingActions(mappingActions: AnyMappingAction[]): void;
    createViewProps(): SimpleViewProps;
    render(): JSX.Element;
}
export {};
