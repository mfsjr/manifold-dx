import { createTestStore, createNameContainer, TestState, NameState } from './testHarness';
import { Name } from './testHarness';
import * as React from 'react';
import { ContainerComponent, GenericContainerMappingTypes } from '../src/components/ContainerComponent';
import { Action, ActionId, StateCrudAction } from '../src/actions/actions';
import { Store, StateObject } from '../src/types/State';
import { Manager } from '../src/types/Manager';
import { getMappingCreator } from '../src/actions/actionCreators';

const testStore = createTestStore();

let name: Name;
let nameState: NameState;
let bowlingScores: number[];
let initBowlerProps: BowlerProps;
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

const ScoreCardGenerator = function(props: ScoreCardProps): React.Component<ScoreCardProps> {
  return new React.Component<ScoreCardProps>(props);
};

export class BowlerContainer extends ContainerComponent<BowlerProps, ScoreCardProps, TestState & StateObject> {

  public average: number;

    // nameState = state.getState().name;
  nameState: Name & StateObject; // | undefined;

  constructor(bowlerProps: BowlerProps) {
    super(bowlerProps, testStore.getState(), undefined, ScoreCardGenerator);
    if (!this.appData.name) {
      throw new Error('nameState must be defined!');
    }
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

  createMappingActions(): GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[] {
    let nameStateMapper = getMappingCreator(this.nameState, this);
    return [
      nameStateMapper.createMappingAction('first', 'fullName'),
      nameStateMapper.createMappingAction('bowlingScores', 'scores', this.calcAverage.bind(this))
    ];
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

let resetTestObjects = () => {
  // testStore.reset(createTestState(), {});
  testStore.reset({name: nameState}, {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: []};
  // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
  nameState = createNameContainer(name, testStore.getState(), 'name');
  bowlingScores = [111, 121, 131];
  initBowlerProps = { fullName: nameState.first };
  container = new BowlerContainer(initBowlerProps);
  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};

resetTestObjects();

describe('ContainerComponent instantiation, mount, update, unmount', () => {
  // placeholder
  test('after mounting, the component state should have something in it', () => {
    container.componentDidMount();
    if (!container.nameState) {
      throw new Error('container.nameState is undefined!');
    }
    let so = testStore.getState();
    let top = Store.getTopState(container.nameState);
    if ( so !== top ) {
      throw new Error('app state doesn\'t equal top of nameState');
    }
    expect(Manager.get(container.nameState).getMappingState().getSize()).toBeGreaterThan(0);
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
  test('mapping state should contain bowler component', () => {
    let mappingActions =
      testStore.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath);
    if (!mappingActions || mappingActions.length === 0) {
      throw new Error('mappingActions should be defined but isn\'t');
    }
    expect(mappingActions[0].component).toBe(container);
  });
  test('an update action', () => {
    expect(container.average).toBeUndefined();
    let action = new StateCrudAction(ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
    testStore.getManager().actionPerform(action);
    expect(container.average).toBeGreaterThan(100);
  });
  test(
      'unmount should result in bowler being removed from the still-present component state mapping value ' +
      '(array of commentsUI)',
      () => {
    container.componentWillUnmount();
    expect(testStore.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath))
        .not.toContain(container);
  });
});