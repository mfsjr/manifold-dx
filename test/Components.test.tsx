import { createTestStore, TestState, NameState, Address, NameStateCreator } from './testHarness';
import { Name } from './testHarness';
import * as React from 'react';
import { ContainerComponent } from '../src/components/ContainerComponent';
import { Action, ActionId, AnyMappingAction, StateCrudAction } from '../src/actions/actions';
import { Store, StateObject } from '../src/types/State';
import { Manager } from '../src/types/Manager';
import { getMappingCreator } from '../src/actions/actionCreators';
import { getArrayCrudCreator } from '../src';
import { MappingState } from '../src/types/MappingState';

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
  addresses?: Array<Address>;
}

let addr1: Address = {
  id: 1,
  street: '3401 Walnut',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19104'
};

let newAddr1 = {...addr1};

let addr2: Address = {
  id: 2,
  street: '11 Genung Court',
  city: 'Hopewell',
  state: 'New York',
  zip: '19532'
};

export interface AddressProps {
  address: Address;
}

const ScoreCardGenerator = function(props: ScoreCardProps): React.Component<ScoreCardProps> {
  return new React.Component<ScoreCardProps>(props);
};

export function addressRowSfc(addressProps: AddressProps): React.ReactElement<AddressProps> {
  // React.Children.forEach(props.children, (child, index) => {
  //   if (child) {
  //     if (typeof child !== 'string' && typeof child !== 'number') {
  //       child.props.modifyBook = props.modifyBook;
  //     } else {
  //       throw new Error('Children of the row should not be ReactText!!!');
  //     }
  //   }
  // });
  return (
    <div>
      <div>
        {addressProps.address.street}
      </div>
      <div>
        {addressProps.address.city} {addressProps.address.state} {addressProps.address.zip}
      </div>
    </div>
  );
}

/**
 * This child container is deliberately over-engineered since we want to test the behavior of a more likely
 * "real-world" example.
 */
export class AddressContainer extends ContainerComponent<AddressProps, AddressProps, TestState & StateObject> {
  address: Address;

  public displayName: string;

  constructor(addressProps: AddressProps, _displayName: string) {
    super(addressProps, testStore.getState(), addressRowSfc);
    this.displayName = _displayName;
  }

  /**
   * Note that in the case of array/list child containers,
   * @returns {GenericContainerMappingTypes<AddressProps, AddressProps, TestState & StateObject>[]}
   */
  appendToMappingActions(actions: AnyMappingAction[])
    : void {
    // return this.mappingActions;
  }

  createViewProps(): AddressProps {
    return {address: this.address};
  }
}

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
    let nameStateMapper = getMappingCreator(this.nameState, 'first');
    let bowlingMapper = getMappingCreator(this.nameState, 'bowlingScores');
    actions.push( nameStateMapper.createPropertyMappingAction(this, 'fullName') );
    actions.push( bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)) );
    let addressesMapper = getMappingCreator(this.nameState, 'addresses');
    actions.push(addressesMapper.createPropertyMappingAction(this, 'addresses'));
    // let addressesMapper = nameStateMapper.createMappingAction('addresses', 'addresses');
    // actions.push( addressesMapper );
  }

  /**
   * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
   *
   * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
   */
  generateMappingActions(): AnyMappingAction[] {
    let actions: AnyMappingAction[] = [];
    let nameStateMapper = getMappingCreator(this.nameState, 'first');
    let bowlingMapper = getMappingCreator(this.nameState, 'bowlingScores');
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

let resetTestObjects = () => {
  // testStore.reset(createTestState(), {});
  testStore.reset({name: nameState}, {});
  name = {first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: []};
  // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
  // nameState = createNameContainer(name, testStore.getState(), 'name');
  nameState = new NameStateCreator(name, testStore.getState(), 'name').nameState;
  bowlingScores = [111, 121, 131];
  initBowlerProps = { fullName: nameState.first };
  container = new BowlerContainer(initBowlerProps);
  // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
  // if you init state after calling this you will get mutation errors!
  testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};

resetTestObjects();

describe('ContainerComponent instantiation, mount, update, unmount', () => {
  let addrKeyGen = (_address: Address) => _address.id;
  let addressesActionCreator = getArrayCrudCreator(nameState, nameState.addresses, addrKeyGen);
  let address1Container: AddressContainer;
  let address2Container: AddressContainer;
  // let mappingActionCreator = getMappingCreator(nameState, container);
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
    testStore.getManager().actionProcess(action);
    expect(container.average).toBeGreaterThan(100);
  });
  test('add to the addresses', () => {
    addressesActionCreator.insert(0, addr1).forEach(action => action.process());
    expect(nameState.addresses[0].street).toBe(addr1.street);
  });
  test('append to the addresses', () => {
    addressesActionCreator.append(addr2).process();
    expect(nameState.addresses[1].state).toBe(addr2.state);
  });
  test(`Create a mapping action to an array index`, () => {
    let addr1Container = new AddressContainer({address: addr1}, 'addr1Container');
    address1Container = addr1Container;
    let keyGen = (address: Address) => address.id;
    // let addr1MappingAction = getMappingCreator(nameState, addr1Container)
    // .createMappingAction('addresses', 'address');
    let addressesOptions = {keyGen: keyGen, array: nameState.addresses};
    let addr1MappingAction = getMappingCreator(nameState, 'addresses', addressesOptions)
      .createArrayIndexMappingAction(0, addr1Container, 'address');

    addr1MappingAction.process();
    let manager = Manager.get(nameState);
    let fullpath = manager.getFullPath(nameState, 'addresses');
    let mapping1 = Manager.get(nameState).getMappingState().getPathMappings(fullpath, 0);

    // 'mapping' is possibly undefined, so cast it and then test it
    mapping1 = mapping1 as AnyMappingAction[];
    expect(mapping1).toBeDefined();
    expect(mapping1.length).toBeGreaterThan(0);
    expect(mapping1[mapping1.length - 1].fullPath).toBe(fullpath);
    expect(mapping1[mapping1.length - 1].component).toBe(addr1Container);

    let addr2Container = new AddressContainer({address: addr2}, 'addr2Container');
    address2Container = addr2Container;
    let addr2MappingAction = getMappingCreator(nameState, 'addresses', addressesOptions)
      .createArrayIndexMappingAction(1, addr2Container, 'address');
    addr2MappingAction.process();

    let mapping2 = Manager.get(nameState).getMappingState().getPathMappings(fullpath, 1);

    // 'mapping' is possibly undefined, so cast it and then test it
    mapping2 = mapping2 as AnyMappingAction[];
    expect(mapping2).toBeDefined();
    expect(mapping2.length).toBeGreaterThan(0);
    expect(mapping2[mapping2.length - 1].fullPath).toBe(fullpath);
    expect(mapping2[mapping2.length - 1].component).toBe(addr2Container);

    // mapping1 should be unchanged
    let mapping1a = Manager.get(nameState).getMappingState().getPathMappings(fullpath, 0);
    expect(mapping1 === mapping1a).toBeTruthy();
  });
  test('updating the state array index value should update address1Container and its properties', () => {
    newAddr1.street = '16 Genung Ct';
    expect(address1Container.viewProps[`addresses`]).toBeUndefined();
    addressesActionCreator.update(0, newAddr1).process();
    expect(address1Container.viewProps[`addresses`]).toBeUndefined();
    expect(nameState.addresses[0].street).toBe(newAddr1.street);
    // verify that the prop that was mapped from the state was also updated
    expect(address1Container.viewProps.address).toBe(newAddr1);
  });
  test('inserting a new element into index 0 should result in container remapping props to state', () => {
    expect(nameState.addresses[0].street).toBe(newAddr1.street);
    // all containers that have been mapped should have their props updated to reflect the new state array insert
    let addr0: Address = {
      id: 0,
      street: '13 Lily Pond Lane',
      city: 'Katonah',
      state: 'NY',
      zip: '21039'
    };
    let insertActions = addressesActionCreator.insert(0, addr0);
    Manager.get(nameState).actionProcess(...insertActions);

    // verify that state was updated
    expect(nameState.addresses[0].street).toBe(addr0.street);
    expect(nameState.addresses[1].street).toBe(newAddr1.street);
    // verify that the prop that was mapped from the state was also updated
    // expect(address1Container.viewProps[`addresses`]).toBeUndefined();
    expect(address1Container.viewProps.address).toBe(addr0);
    expect(address2Container.viewProps.address).toBe(newAddr1);

  });
  test('deleting an element from the addresses array re-maps the array and its containers', () => {
    expect(nameState.addresses[1].street).toBe(newAddr1.street);
    expect(nameState.addresses[2].street).toBe(addr2.street);
    //
    let deleteActions = addressesActionCreator.remove(0);
    Manager.get(nameState).actionProcess(...deleteActions);

    expect(nameState.addresses[0].street).toBe(newAddr1.street);
    expect(address1Container.viewProps.address).toBe(newAddr1);
    expect(address2Container.viewProps.address).toBe(addr2);
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

describe('Standalone tests for instance of MappingState', () => {
  let mappingState = new MappingState();
  // other tests have already captured api's for simple properties, so concentrate on array/React.Key api's
  let addressesMappings = mappingState.getOrCreatePathMappings('addresses');
  let mappingActions = container.generateMappingActions();

  test('addresses returns addressesMappings', () => {
    expect(mappingState.getPathMappings('addresses')).toBe(addressesMappings);
    expect(mappingActions.length > 0).toBeTruthy();

  });
  test('addressesMappings to be an Array', () => {
    expect(addressesMappings instanceof Array).toBeTruthy();
  });

  let addr1Mappings = mappingState.getOrCreatePathMappings('addresses', 1);
  test('addr1Mappings to be an array', () => {
    expect(addr1Mappings instanceof Array).toBeTruthy();
  });

  test('translating from property to array should leave addressesMappings unchanged', () => {
    let newAddressesMappings = mappingState.getPathMappings('addresses');
    expect(newAddressesMappings instanceof Array).toBeTruthy();
    expect(addressesMappings).toBe(newAddressesMappings);
  });

  test('remove path mapping from an array index', () => {
    // let mappingActions = container.getMappingActions();
    mappingActions.forEach(action => addr1Mappings.push(action));

    let mappings = mappingState.getPathMappings('addresses', 1);
    expect(mappings).toBeDefined();
    let n = mappingState.removePathMapping('addresses', mappingActions[0], 1);
    expect(n).toBe(1);
  });

  test('removing actions (above) should leave the same arrays in mappings', () => {
    let mappings = mappingState.getPathMappings('addresses', 1);
    expect(addr1Mappings).toBe(mappings);
  });

  test('remove entire paths', () => {
    let n = mappingState.removePath('addresses');
    // we expect there to be one entry for every element in the array, plus one for the array itself
    expect(n).toBe(addr1Mappings.length + 1);
    // now add them back and restore the variables we're using for testing
    mappingState.getOrCreatePathMappings('addresses');
    mappingState.getOrCreatePathMappings('addresses', 1);
    // let mappingActions = container.getMappingActions();
    mappingActions.forEach(action => addr1Mappings.push(action));
    addr1Mappings = mappingActions;
  });

  test('removing state paths, ie path prefixes' , () => {
    mappingState.getOrCreatePathMappings('address');
    let n = mappingState.removeStatePath('address');
    // both 'address' and 'addresses' should be removed by the 'address' path prefix / state path
    expect(n === 2).toBeTruthy();
  });

  test('Map to an index array without mapping to the array itself', () => {
    // mappingState = new MappingState();
    let addressesMapping = mappingState.getPathMappings('addresses');
    expect(addressesMapping).toBeUndefined();

    let addr1Mapping = mappingState.getOrCreatePathMappings('addresses', 1);
    expect(addr1Mapping).toBeDefined();

    // this should still be undefined
    addressesMapping = mappingState.getPathMappings('addresses');
    expect(addressesMapping).toBeUndefined();

  });

  test('Mapping the array after mapping an index of it', () => {
    // a somewhat atypical sequence of doing things, but something that should be doable
    let addressesMapping = mappingState.getOrCreatePathMappings('addresses');
    expect(addressesMapping).toBeDefined();

    // the previously mapped index should still be there
    let addr1Mapping = mappingState.getPathMappings('addresses', 1);
    expect(addr1Mapping).toBeDefined();
  });
});
