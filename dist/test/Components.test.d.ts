/// <reference types="react" />
import { TestState } from './testHarness';
import { Name } from './testHarness';
import * as React from 'react';
import { ContainerComponent, GenericContainerMappingTypes } from '../src/components/ContainerComponent';
import { Action, StateCrudAction } from '../src/actions/actions';
import { StateObject } from '../src/types/State';
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
}
export declare class BowlerContainer extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {
    average: number;
    nameState: Name & StateObject;
    constructor(bowlerProps: BowlerProps);
    createViewProps(): ScoreCardProps;
    createView(viewProps: ScoreCardProps): React.Component<ScoreCardProps, {}>;
    createMappingActions(): GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[];
    updateViewProps(executedActions: Action[]): void;
    calcAverage(action: StateCrudAction<any, any>): void;
}
