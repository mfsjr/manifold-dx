import { State } from '../src/types/State';
import { Address, Name } from './types.test';
import { StateObject } from '../src/types/State';

export interface TestState {
  name?: Name & StateObject;
  me?: Name & StateObject;
  address?: Address & StateObject;
  appName?: string;
}

export function createTestState(): TestState {
  return {};
}

// In a normal application, we would want to create a single state object like this:
// export const testState = new State(createTestState(), {});

/**
 * It appears that Jest's 'runInBand' option forces sequential test execution, but allows parallel execution
 * of test files, so we provide this function so that each test file can use its own state
 *
 * @returns {State<TestState>}
 */
export function createAppTestState() {
  return new State(createTestState(), {});
}

/**
 * Everything below here is just a demonstration of how we might choose to attach accessors, which
 * modify state by creating and executing actions, might work.
 *
 * Creating actions might be done more simply in ContainerComponents for simple cases, but
 * this approach is more organized.
 */

export interface NameAccessors {
  updateFirst: (newFirst: string) => string;
  appendScore: (score: number) => number;
}

/**
 * Note that we are overriding StateObject's accessors?: any with non-null NameAccessors
 * Might be better to define accessors in Name.
 */
export interface NameState extends Name, StateObject {
  __accessors__: NameAccessors;
}

const nameSample: Name = {
  first: 'Bo',
  middle: 'F',
  last: 'Jackson',
  bowlingScores: [300],
  addresses: []
};

/**
 * A factory method for StateObjects with accessor methods.
 *
 * This simple example intends only to demo how methods can be added and StateObjects generated,
 * note that these accessors violate the framework rule that state changes may only be performed
 * by actions.
 *
 * @param {Name} nameData
 * @param {StateObject} parent
 * @param {string} myPropertyName
 * @returns {NameState & StateObject}
 */
function createNameState(nameData: Name, parent: StateObject, myPropertyName: string): NameState & StateObject {
  let result: NameState = {
    __parent__: parent,
    __my_propname__: myPropertyName,
    ...nameData,
    // NOTE that these accessors violate state changes only by actions, they're here only for demonstration
    __accessors__: {
      updateFirst: (newFirst: string) => {
        let oldName = result.first;
        result.first = newFirst;
        return oldName;
      },
      appendScore: (score: number) => {
        result.bowlingScores.push(score);
        return result.bowlingScores.length;
      },
    }
  };
  result.__parent__[result.__my_propname__] = result;
  return result;
}

export const nameState = createNameState(nameSample, State.createState(), 'myname');
nameState.__accessors__.appendScore(240);
nameState.__accessors__.updateFirst('Matt');
// /* tslint:disable:no-console */
// console.log(`nameState = ${JSON.stringify(nameState, JSON_replaceCyclicParent, 4)}`);
// // nope: console.log(ns2.first);
// /* tslint:enable:no-console */

// interface Mine {
//   phone: string;
//   homeValue: number;
//   accessors?: NameAccessors;
// }