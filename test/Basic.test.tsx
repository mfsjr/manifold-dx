
// Need to set up jsdom before setting up React
// TODO: can we do this in setup.js only?  If so, will using it in different tests cause tests to have side-effects?
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

import * as React from 'react';
import * as enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { ContainerComponent, getActionCreator, getArrayActionCreator, StateObject } from '../src';
import { Address, createTestStore, Name, TestState } from './testHarness';
import { Action, AnyMappingAction, StateCrudAction } from '../src/actions/actions';
import { ReactElement, SFC } from 'react';
import { getMappingActionCreator } from '../src/actions/actionCreators';
import { BowlerProps, ScoreCardProps } from './Components.test';

enzyme.configure({ adapter: new Adapter() });

const testStore = createTestStore();

// DEFINE COMPONENTS
/**
 * AddressContainer displays a little about the address
 */
class AddressContainer extends ContainerComponent<Address, Address, TestState & StateObject> {
  constructor(props: Address) {
    super(props, testStore.getState(), AddressSfc);
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

/**
 * SFC for AddressContainer
 * @param props
 * @constructor
 */
const AddressSfc: SFC<Address> = (props: Address): ReactElement<Address> => {
// function AddressSfc(props: Address): ReactElement<Address> {
  return (
    <div>
      <div className={'address1'}>{props.street} {props.city}</div>
      <div className={'address2'}>{props.state} {props.zip}</div>
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
    if (!this.appData.name) {
      throw new Error('nameState must be defined!');
    }
    this.nameState = this.appData.name;
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
        calcAverage: () => 0.0
      };
    } else {
      return {
        fullName: this.props.fullName,
        scores: this.nameState.bowlingScores || [],
        street: this.nameState.address ? this.nameState.address.street : '',
        city: this.nameState.address ? this.nameState.address.city : '',
        state: this.nameState.address ? this.nameState.address.state : '',
        calcAverage: () => 0.0
      };
    }
  }

  public createView(viewProps: ScoreCardProps) {
    return new React.Component(viewProps);
  }

  appendToMappingActions(actions: AnyMappingAction[])
    : void {
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
 * SFC view for BowlerContainer
 * @param _props
 * @constructor
 */
const BowlerContainerView: SFC<ScoreCardProps> = (_props: ScoreCardProps): ReactElement<ScoreCardProps> => {
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
      <AddressContainer
        id={2}
        street={'Genung Ct'}
        city={'Hopewell'}
        state={'NY'}
        zip={'12545'}
      />);
    expect(hello.find('.address1').text()).toContain('Walnut');
    // TODO: verify lifecycle methods
  });
  it('calls forceUpdate only on the mapped component, not the children', () => {
    getActionCreator(testStore.getState()).insertStateObject(addr1, 'address').dispatch();
    getActionCreator(testStore.getState()).insertStateObject(nameState, 'name').dispatch();
    getActionCreator(nameState).insert('bowlingScores', bowlingScores).dispatch();
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
