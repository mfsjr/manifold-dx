import * as enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
// TODO: why doesn't this work for all tests?  our tests only work if this code at the top of each test file
enzyme.configure({ adapter: new Adapter() });