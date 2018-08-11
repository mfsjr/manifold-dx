"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var jsdom_1 = require("jsdom");
// import { JSDOM } from 'jsdom';
// const jsdom = require('jsdom');
// const { JSDOM } = jsdom;
var window = new jsdom_1.JSDOM('<!doctype html><html><body></body></html>').window;
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };
var React = require("react");
var enzyme = require("enzyme");
var Adapter = require("enzyme-adapter-react-16");
// https://github.com/Microsoft/TypeScript/issues/15031
// declare module "./setup";
// import * as setup from './setup';
// setup.config();
var src_1 = require("../src");
var testHarness_1 = require("./testHarness");
enzyme.configure({ adapter: new Adapter() });
var testStore = testHarness_1.createTestStore();
var AddressContainer = /** @class */ (function (_super) {
    __extends(AddressContainer, _super);
    function AddressContainer(props) {
        return _super.call(this, props, testStore.getState(), AddressSfc) || this;
    }
    AddressContainer.prototype.appendToMappingActions = function (mappingActions) {
        // pass
    };
    AddressContainer.prototype.createViewProps = function () {
        var result = {
            id: 1,
            street: 'Walnut St',
            city: 'Philadelphia',
            state: 'PA',
            zip: '19106'
        };
        return result;
    };
    return AddressContainer;
}(src_1.ContainerComponent));
var AddressSfc = function (props) {
    // function AddressSfc(props: Address): ReactElement<Address> {
    return (React.createElement("div", null,
        React.createElement("div", { className: 'address1' },
            props.street,
            " ",
            props.city),
        React.createElement("div", { className: 'address2' },
            props.state,
            " ",
            props.zip)));
};
describe('enzyme tests for lifecycle methods', function () {
    it('renders the correct text when no enthusiasm level is given', function () {
        var hello = enzyme.mount(React.createElement(AddressContainer, { id: 2, street: 'Genung Ct', city: 'Hopewell', state: 'NY', zip: '12545' }));
        expect(hello.find('.address1').text()).toContain('Walnut');
    });
});
//# sourceMappingURL=Basic.test.js.map