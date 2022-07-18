/*
 * Need to set up jsdom before setting up React
 * TODO: can we do this in setup.js only?  If so, will using it in different tests cause tests to have side-effects?
 * Note that we are fabricating NodeJS.Global, we should consider extending it if we can
 *   see https://stackoverflow.com/questions/45311337/how-to-use-jsdom-to-test-functions-with-document
 *       https://stackoverflow.com/questions/41194264/mocha-react-navigator-is-not-defined
 */

import { JSDOM } from 'jsdom';
const { window } = new JSDOM('<!doctype html><html><body></body></html>');
export interface Global {
  document: Document;
  window: Window;
  navigator: {
    userAgent: string;
  };
}

declare var global: Global;
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };

import * as enzyme from 'enzyme';
import * as Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import {
  ActionProcessorFunctionType,
  ContainerComponent,
  getActionCreator,
  getArrayActionCreator, Manager,
  StateObject
} from '../src';
import { Address, createTestStore, Name, TestState } from './testHarness';
import { Action, AnyMappingAction, StateCrudAction } from '../src/actions/actions';
import { ReactElement, FunctionComponent, useState } from 'react';
import { ExtractMatching, getMappingActionCreator } from '../src/actions/actionCreators';
import { BowlerProps, ScoreCardProps } from './Components.test';
import * as React from 'react';
import { ContainerRenderProps, RenderPropsComponent } from '../src/components/RenderPropsComponent';

enzyme.configure({ adapter: new Adapter() });

const testStore = createTestStore();

// DEFINE COMPONENTS
/**
 * AddressContainer displays a little about the address
 */
class AddressContainer extends ContainerComponent<Address, Address, TestState & StateObject> {
  constructor(props: Address) {
    super(props, testStore.getState(), AddressFunctionComp);
  }

  protected appendToMappingActions(mappingActions: AnyMappingAction[]): void {
    // pass
  }

  createViewProps(): Address {
    let result: Address = {
      id: 1,
      street: 'Walnut St',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19106'
    };
    return result;
  }
}

interface ShortName {
  first: string;
  last: string;
}

class AddressBroken extends ContainerComponent<Address, ShortName, TestState & StateObject> {
  constructor(props: AddressRenderProps) {
    super(props, testStore.getState());
    this.viewProps = this.createViewProps();
  }
  protected appendToMappingActions(mappingActions: AnyMappingAction[]): void {
    // pass
  }

  createViewProps(): ShortName {
    let result: ShortName = {
      first: 'Joseph',
      last: 'Sixpack',

    };
    return result;
  }
}

class AddressSelfContained extends AddressBroken {
  render() {
    return (
      <div>
        <div>${`${this.viewProps.first} ${this.viewProps.last}`}</div>
        <div>${this.props.street}</div>
      </div>
    );
  }
}

export interface AddressRenderProps extends Address, ContainerRenderProps<Address> { }

class AddressRenderPropsContainer extends RenderPropsComponent<AddressRenderProps, Address, TestState & StateObject> {
  constructor(props: Address) {
    super(props, testStore.getState());
  }

  protected appendToMappingActions(mappingActions: AnyMappingAction[]): void {
    // pass
  }

  createViewProps(): Address {
    let result: Address = {
      id: 1,
      street: 'Walnut St',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19106'
    };
    return result;
  }
}

const AddressFunctionComp: FunctionComponent<Address> = (props: Address): ReactElement<Address> => {
  return React.createElement(AddressFunctionCompSub, props);
};

const AddressFunctionCompSub: FunctionComponent<Address> = (props: Address): ReactElement<Address> => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div className={'address1'}>{props.street} {props.city}</div>
      <div className={'address2'}>{props.state} {props.zip}</div>
      <div>
        <input value={'' + count} onChange={(e) => setCount(parseInt(e.target.value, 10))} />
      </div>
    </div>
  );
};

/**
 * BowlingContainer is intended to contain children components for displaying aspects
 * about the bowler, their scores and their address(es).
 */
class BowlerContainer extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {

  public average: number;

  // nameState = state.getState().name;
  nameState: Name & StateObject; // | undefined;

  constructor(bowlerProps: BowlerProps) {
    super(bowlerProps, testStore.getState(), BowlerContainerView);
    if (!this.appState.name) {
      throw new Error('nameState must be defined!');
    }
    this.nameState = this.appState.name;
    // this.addressesMapper = getMappingCreator(this.nameState, this).createMappingAction('addresses', 'addresses');
  }

  public createViewProps(): ScoreCardProps {
    if ( !this.nameState ) {
      return {
        fullName: this.props.fullName,
        scores: [],
        street: '',
        city: '',
        state: '',
        calcAverage: () => 0.0,
        addresses: []
      };
    } else {
      return {
        fullName: this.props.fullName,
        scores: this.nameState.bowlingScores || [],
        street: this.nameState.address ? this.nameState.address.street : '',
        city: this.nameState.address ? this.nameState.address.city : '',
        state: this.nameState.address ? this.nameState.address.state : '',
        calcAverage: () => 0.0,
        addresses: []
      };
    }
  }

  public createView(viewProps: ScoreCardProps) {
    return new React.Component(viewProps);
  }

  appendToMappingActions(actions: AnyMappingAction[])
    : void {
    //
    let test: ExtractMatching<Name, 'first', ScoreCardProps> = 'fullName';
    if (!test) {
      throw new Error('This should never throw, and ExtractMatching above should always compile');
    }
    let nameStateMapper = getMappingActionCreator(this.nameState, 'first');
    let bowlingMapper = getMappingActionCreator(this.nameState, 'bowlingScores');
    actions.push( nameStateMapper.createPropertyMappingAction(this, 'fullName') );
    actions.push( bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)) );
    let addressesMapper = getMappingActionCreator(this.nameState, 'addresses');
    actions.push(addressesMapper.createPropertyMappingAction(this, 'addresses'));
  }

  /**
   * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
   *
   * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
   */
  generateMappingActions(): AnyMappingAction[] {
    let actions: AnyMappingAction[] = [];
    let nameStateMapper = getMappingActionCreator(this.nameState, 'first');
    let bowlingMapper = getMappingActionCreator(this.nameState, 'bowlingScores');
    actions.push( nameStateMapper.createPropertyMappingAction(this, 'fullName') );
    actions.push( bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)) );
    return actions;
  }

  public updateViewProps(executedActions: Action[]) {
    // this.updateViewPropsUsingMappings(executedActions);
  }

  /* tslint:disable:no-any */
  public calcAverage(action: StateCrudAction<any, any>): void {
    /* tslint:enable:no-any */
    // console.log(`calcAverage dispatched by ${ActionId[action.type]}`);
    this.average = this.viewProps.scores.reduce(
      function(previous: number, current: number) { return previous + current; }, 0.0);
    this.average = this.average / this.viewProps.scores.length;
  }
}

/**
 * FunctionComponent view for BowlerContainer
 * @param _props
 * @constructor
 */
const BowlerContainerView: FunctionComponent<ScoreCardProps> =
    (_props: ScoreCardProps): ReactElement<ScoreCardProps> => {
  const scoreView = _props.scores.map((score, index) => {
    let key = `${index} ${score}`;
    return ( <div key={key}>{1 + index}. {score}</div> );
  });
  let address = testStore.getState().address;
  if (!address) {
    throw new Error('address must be defined');
  }
  return (
    <div>
      <div id={'bowlerDiv'}>Bowler: {_props.fullName} </div>
      <div>
        Scores: <br />
        {scoreView}
      </div>
    </div>
  );
};

let addr1: Address & StateObject = {
  id: 1,
  street: '3401 Walnut',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19104',
  _parent: null,
  _myPropname: 'address'
};

let nameState: Name & StateObject = {
  first: 'Joe',
  last: 'Sixpack',
  middle: '',
  addresses: [],
  bowlingScores: [],
  _myPropname: 'name',
  _parent: null,
  prefix: 'Mr.',
};

let bowlingScores = [111, 121, 131];

describe('enzyme tests for lifecycle methods', () => {
  it('renders the correct text when no enthusiasm level is given', () => {
    const hello = enzyme.mount(
      <AddressRenderPropsContainer
        id={2}
        street={'Genung Ct'}
        city={'Hopewell'}
        state={'NY'}
        zip={'12545'}
        _functionComp={AddressFunctionComp}
      />);
    expect(hello.find('.address1').text()).toContain('Walnut');
    // TODO: verify lifecycle methods
  });
  it('calls forceUpdate only on the mapped component, not the children', () => {
    getActionCreator(testStore.getState()).insertStateObject(addr1, 'address').dispatch();
    getActionCreator(testStore.getState()).insertStateObject(nameState, 'name').dispatch();
    getActionCreator(nameState).set('bowlingScores', []).dispatch();
    getActionCreator(nameState).update('bowlingScores', bowlingScores).dispatch();
    getArrayActionCreator(nameState, bowlingScores).appendElement(151).forEach(action => action.dispatch());
    expect(nameState.bowlingScores[nameState.bowlingScores.length - 1]).toBe(151);
    let addr = testStore.getState().address;
    if (!addr) {
      throw Error('address must be defined!');
    }
    let {state, street, city, zip} = addr;
    let _fullName = 'Jerry Jones';
    const bowler = enzyme.mount(
      <BowlerContainer fullName={_fullName}>
        <AddressContainer
          id={3}
          state={state}
          street={street}
          city={city}
          zip={zip}
        />
      </BowlerContainer>
    );
    expect(bowler.find('#bowlerDiv').text()).toContain(_fullName);

  });
});
describe('Override render method', () => {
  it('should allow ContainerComponent to override render and throw if broken', () => {
    expect( () => {
      enzyme.mount(
        <AddressBroken id={101} street={'123'} city={'Mockingbird Lane'} state={'Illinoi'} zip={'66666'} />
      );
    }).toThrow();

    const addressNode = enzyme.mount(
      <AddressSelfContained id={99} street={'303 S American St'} city={'Philadelphia'} state={'PA'}  zip={'19106'} />
    );
    expect(addressNode.text()).toContain('303');
    expect(addressNode.text()).toContain('Sixpack');
  });
});

describe('hook functionality', () => {
  // const rootElement = document.getElementById('root');
  let addr4: Address = {
    id: 1,
    street: '3401 Walnut',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19104'
  };

  test('Expect createElement to be renderable using a FunctionComponent with hooks', () => {
    let rendering = enzyme.mount(React.createElement(AddressFunctionCompSub, addr4));
    expect(rendering).toBeTruthy();
  });

  test('Expect an invalid hook call when invoking a FunctionComponent with hooks', () => {
    expect(() => {
      AddressFunctionCompSub(addr4);
    }).toThrow();
  });

  test('Expect no exceptions when createElement uses a FunctionComponent with hooks', () => {
    // AddressFunctionComp is using AddressFunctionCompSub in React.createElement, hooks should not throw
    expect(() => {
      AddressFunctionComp(addr4);
    }).not.toThrow();
  });

});
describe('show action validation', () => {
  test('replacing an action after dispatch using a validating preProcessor', () => {
    const testState: TestState = testStore.getState();
    const manager: Manager = testStore.getManager();
    getActionCreator(testState).set('modalMessage', undefined).dispatch();
    const appName = testStore.getState().appName;

    const replacer: ActionProcessorFunctionType =
      actions => {
        for (let i = 0; i < actions.length; i++) {
          const a = actions[i];
          if (a.isStatePropChange() && a.propertyName === 'appName') {
            return [getActionCreator(testState).set('modalMessage', 'replaced')];
          }
        }
        return actions;
      };
    manager.getActionProcessorAPI().appendPreProcessor(replacer);
    const wontbe = 'won\'t be';
    expect(appName).not.toBe(wontbe);

    getActionCreator(testState).set('appName', wontbe).dispatch();
    expect(testState.modalMessage).toBe('replaced');
    expect(testState.appName).not.toBe(wontbe);

    manager.getActionProcessorAPI().removePreProcessor(replacer);
  });

});
