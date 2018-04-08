/// <reference types="react" />
import { TestState } from './testHarness';
import { Name } from './testHarness';
import * as React from 'react';
import { ContainerComponent } from '../src/components/ContainerComponent';
import { Action, StateCrudAction, MappingAction } from '../src/actions/actions';
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
    nameState: Name & StateObject | undefined;
    constructor(bowlerProps: BowlerProps);
    createViewProps(): ScoreCardProps;
    createView(viewProps: ScoreCardProps): React.Component<ScoreCardProps, {}>;
    createMappingActions(): MappingAction<any, any, BowlerProps, ScoreCardProps, any>[];
    updateViewProps(executedActions: Action[]): void;
    calcAverage(action: StateCrudAction<any, any>): void;
}
