import { Manager } from '../src/types/Manager';
import { createTestState, TestState } from './testHarness';
import { Address, Name } from './types.test';
import { testState } from './testHarness';
import * as React from 'react';
import { ContainerComponent } from '../src/components/ContainerComponent';
import { Action, ActionId, StateCrudAction, MappingAction } from '../src/actions/actions';
import { State, StateObject } from '../src/types/State';

let name: Name;
let address: Address;
let address2: Address;
let nameState: Name & StateObject;
let addressState: Address & StateObject;
let bowlingScores: number[];
let initBowlerProps: BowlerProps;
let initScoreCardProps: ScoreCardProps;
let view: React.Component<ScoreCardProps>;
let container: BowlerContainer;

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

const ScoreCardGeneraotr = function(props: ScoreCardProps): React.Component<ScoreCardProps> {
  return new React.Component<ScoreCardProps>(props);
};

export class BowlerContainer extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {

  public average: number;

    // nameState = state.getState().name;
  nameState: Name & StateObject | undefined;

  constructor(bowlerProps: BowlerProps) {
    super(bowlerProps, testState.getState(), undefined, ScoreCardGeneraotr);
    this.nameState = this.appData.name;
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

  createMappingActions(): MappingAction<any, any, BowlerProps, ScoreCardProps, keyof ScoreCardProps>[] {
    // let result: StateMappingAction<any, any, BowlerProps, ScoreCardProps, keyof ScoreCardProps>[] = [];
    // result.push(this.createStateMappingAction(nameState, 'first', 'fullName'));
    let fullNameAction = new MappingAction(nameState, 'first', this, 'fullName');
    let scoreAction = new MappingAction(nameState, 'bowlingScores', this, 'scores', this.calcAverage.bind(this));
    return [fullNameAction, scoreAction];
  }

  public updateViewProps(executedActions: Action[]) {
    // this.updateViewPropsUsingMappings(executedActions);
  }

  public calcAverage(action: StateCrudAction<any, any>): void {
    // console.log(`calcAverage dispatched by ${ActionId[action.type]}`);
    this.average = this.viewProps.scores.reduce(function(previous: number, current: number) { return previous + current; }, 0.0);
    this.average = this.average / this.viewProps.scores.length;
  }
}

let resetTestObjects = () => {
  testState.reset(createTestState(), {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr'};
  nameState = State.createStateObject<Name>(testState.getState(), 'name', name);
  address = {street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514'};
  addressState = State.createStateObject<Address>(nameState, 'address', address);
  address2 = {street: '12 Bennett Common', city: 'Millbrook', state: 'NY', zip: '19106'};
  bowlingScores = [111, 121, 131];
  initBowlerProps = { fullName: nameState.first };
  initScoreCardProps = {
    fullName: '',
    scores: [],
    street: '',
    city: '',
    state: '',
    calcAverage: () => 0.0
  };
  testState.reset({name: nameState}, {});
  container = new BowlerContainer(initBowlerProps);
  view = container.getView();
  testState.getManager().getActionProcessorAPI().enableMutationChecking();

};

resetTestObjects();

describe('ContainerComponent instantiation, mount, update, unmount', () => {
  // placeholder
  test('after mounting, the component state should have something in it', () => {
    container.componentDidMount();
    expect(Manager.get().getMappingState().getSize()).toBeGreaterThan(0);
  });
  test('bowler\'s viewProps contains the correct "fullname"', () => {
    expect(container.viewProps.fullName).toEqual(nameState.first);
  });
  test('bowler\'s viewComponent.props contains the correct "fullname"', () => {
    expect(container.getView().props.fullName).toEqual(nameState.first);
  });

  test('container\'s props should contian the correct "fullname"', () => {
    expect(container.props.fullName).toEqual(nameState.first);
  });
  test('action mapping should have fullpath', () => {
    expect(container.getMappingActions()[0].fullPath).toEqual('name.first');
  });
  test('component state should contain bowler component', () => {
    let mappingActions = Manager.get().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath);
    if (!mappingActions || mappingActions.length === 0) {
      throw new Error('mappingActions should be defined but isn\'t');
    }
    expect(mappingActions[0].component).toBe(container);
  });
  test('an update action', () => {
    expect(container.average).toBeUndefined();
    expect(nameState.bowlingScores).toBeUndefined();
    let action = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    Manager.get().actionPerform(action);
    expect(container.average).toBeGreaterThan(100);
  });
  test('unmount should result in bowler being removed from the still-present component state mapping value (array of commentsUI)', () => {
    container.componentWillUnmount();
    expect(Manager.get().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath)).not.toContain(container);
  });
});