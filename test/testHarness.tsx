import { State } from '../index';
import { Address, Name } from './types.test';
import { StateObject } from '../index';

export interface TestState {
  name?: Name & StateObject;
  me?: Name & StateObject;
  address?: Address & StateObject;
  appName?: string;
}

export function createTestState(): TestState {
  return {};
}

export const testState = new State(createTestState(), {});