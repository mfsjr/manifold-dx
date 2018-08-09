import * as React from 'react';
import * as enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

// https://github.com/Microsoft/TypeScript/issues/15031
// declare module "./setup";
// import * as setup from './setup';
// setup.config();

import { ContainerComponent, StateObject } from '../src';
import { Address, createTestStore, TestState } from './testHarness';
import { AnyMappingAction } from '../src/actions/actions';
import { ReactElement, SFC } from 'react';

enzyme.configure({ adapter: new Adapter() });

const testStore = createTestStore();

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

const AddressSfc: SFC<Address> = (props: Address): ReactElement<Address> => {
// function AddressSfc(props: Address): ReactElement<Address> {
  return (
    <div>
      <div className={'address1'}>{props.street} {props.city}</div>
      <div className={'address2'}>{props.state} {props.zip}</div>
    </div>
  );
};

describe('enzyme tests for lifecycle methods', () => {
  it('renders the correct text when no enthusiasm level is given', () => {
    const hello = enzyme.shallow(
      <AddressContainer
        id={2}
        street={'Genung Ct'}
        city={'Hopewell'}
        state={'NY'}
        zip={'12545'}
      />);
    expect(hello.find('.address1').text()).toContain('Walnut');
  });
});
