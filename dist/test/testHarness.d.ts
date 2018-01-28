import { State } from '../src/types/State';
import { Address, Name } from './types.test';
import { StateObject } from '../src/types/State';
export interface TestState {
    name?: Name & StateObject;
    me?: Name & StateObject;
    address?: Address & StateObject;
    appName?: string;
}
export declare function createTestState(): TestState;
export declare const testState: State<TestState>;
