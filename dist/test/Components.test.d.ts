/// <reference types="react" />
import { TestState, Address } from './testHarness';
import { Name } from './testHarness';
import * as React from 'react';
import { ContainerComponent } from '../src/components/ContainerComponent';
import { Action, AnyMappingAction, StateCrudAction } from '../src/actions/actions';
import { StateObject } from '../src/types/Store';
export interface BowlerProps {
    fullName: string;
}
export interface ScoreCardProps {
    fullName: string;
    street: string;
    city: string;
    state: string;
    scores: number[];
    calcAverage: () => number;
    addresses?: Array<Address>;
}
export interface AddressProps {
    address: Address;
}
export declare function addressRowSfc(addressProps: AddressProps): React.ReactElement<AddressProps>;
/**
 * This child container is deliberately over-engineered since we want to test the behavior of a more likely
 * "real-world" example.
 */
export declare class AddressContainer extends ContainerComponent<AddressProps, AddressProps, TestState & StateObject> {
    address: Address;
    displayName: string;
    constructor(addressProps: AddressProps, _displayName: string);
    /**
     * Note that in the case of array/list child containers,
     * @returns {GenericContainerMappingTypes<AddressProps, AddressProps, TestState & StateObject>[]}
     */
    appendToMappingActions(actions: AnyMappingAction[]): void;
    createViewProps(): AddressProps;
}
export declare class BowlerContainer extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {
    average: number;
    nameState: Name & StateObject;
    constructor(bowlerProps: BowlerProps);
    createViewProps(): ScoreCardProps;
    createView(viewProps: ScoreCardProps): React.Component<ScoreCardProps, {}>;
    appendToMappingActions(actions: AnyMappingAction[]): void;
    /**
     * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
     *
     * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
     */
    generateMappingActions(): AnyMappingAction[];
    updateViewProps(executedActions: Action[]): void;
    calcAverage(action: StateCrudAction<any, any>): void;
}
