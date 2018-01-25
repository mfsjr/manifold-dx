import {State} from "../src/types/State";
import {IAddress, IName} from "./types.test";
import {IStateObject} from "../src/types/State";

export interface ITestState {
  name?: IName & IStateObject,
  me?: IName & IStateObject,
  address?: IAddress & IStateObject,
  appName?: string
}

export function createTestState(): ITestState {
  return {};
}

export const testState = new State(createTestState(), {});