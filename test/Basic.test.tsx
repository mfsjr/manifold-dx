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
    const hello = enzyme.mount(
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
