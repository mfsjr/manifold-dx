import { Store, Action, getStateObject, getActionCreator,
  getArrayActionCreator,
  getMappingActionCreator,
  getArrayMappingActionCreator,
  StateCrudAction,
  ArrayChangeAction,
  Manager,
  MappingAction,
  ContainerComponent,
  RenderPropsComponent,
} from '../src';

describe('import index.ts', () => {
  test('exports exist because coverage is reporting uncovered', () => {
    expect(Store).toBeDefined();
    // expect(State).toBeDefined();
    expect(Action).toBeDefined();
    expect(getStateObject).toBeDefined();

    expect(getArrayActionCreator).toBeDefined();
    expect(getMappingActionCreator).toBeDefined();
    expect(getArrayMappingActionCreator).toBeDefined();
    expect(StateCrudAction).toBeDefined();
    expect(ArrayChangeAction).toBeDefined();
    expect(Manager).toBeDefined();
    expect(MappingAction).toBeDefined();

    expect(getActionCreator).toBeDefined();
    expect(ContainerComponent).toBeDefined();
    expect(RenderPropsComponent).toBeDefined();
  });
});
