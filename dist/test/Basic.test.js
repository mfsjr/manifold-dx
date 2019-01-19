"use strict";
/*
 * Need to set up jsdom before setting up React
 * TODO: can we do this in setup.js only?  If so, will using it in different tests cause tests to have side-effects?
 * Note that we are fabricating NodeJS.Global, we should consider extending it if we can
 *   see https://stackoverflow.com/questions/45311337/how-to-use-jsdom-to-test-functions-with-document
 *       https://stackoverflow.com/questions/41194264/mocha-react-navigator-is-not-defined
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var jsdom_1 = require("jsdom");
var window = new jsdom_1.JSDOM('<!doctype html><html><body></body></html>').window;
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };
var enzyme = require("enzyme");
var Adapter = require("enzyme-adapter-react-16");
var src_1 = require("../src");
var testHarness_1 = require("./testHarness");
var actionCreators_1 = require("../src/actions/actionCreators");
var React = require("react");
var RenderPropsComponent_1 = require("../src/components/RenderPropsComponent");
enzyme.configure({ adapter: new Adapter() });
var testStore = testHarness_1.createTestStore();
// DEFINE COMPONENTS
/**
 * AddressContainer displays a little about the address
 */
var AddressContainer = /** @class */ (function (_super) {
    __extends(AddressContainer, _super);
    function AddressContainer(props) {
        return _super.call(this, props, testStore.getState(), AddressFunctionComp) || this;
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
var AddressRenderPropsContainer = /** @class */ (function (_super) {
    __extends(AddressRenderPropsContainer, _super);
    function AddressRenderPropsContainer(props) {
        return _super.call(this, props, testStore.getState()) || this;
    }
    AddressRenderPropsContainer.prototype.appendToMappingActions = function (mappingActions) {
        // pass
    };
    AddressRenderPropsContainer.prototype.createViewProps = function () {
        var result = {
            id: 1,
            street: 'Walnut St',
            city: 'Philadelphia',
            state: 'PA',
            zip: '19106'
        };
        return result;
    };
    return AddressRenderPropsContainer;
}(RenderPropsComponent_1.RenderPropsComponent));
/**
 * FunctionComponent for AddressContainer
 * @param props
 * @constructor
 */
var AddressFunctionComp = function (props) {
    // function AddressFunctionComp(props: Address): ReactElement<Address> {
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
/**
 * BowlingContainer is intended to contain children components for displaying aspects
 * about the bowler, their scores and their address(es).
 */
var BowlerContainer = /** @class */ (function (_super) {
    __extends(BowlerContainer, _super);
    function BowlerContainer(bowlerProps) {
        var _this = _super.call(this, bowlerProps, testStore.getState(), BowlerContainerView) || this;
        if (!_this.appState.name) {
            throw new Error('nameState must be defined!');
        }
        _this.nameState = _this.appState.name;
        return _this;
        // this.addressesMapper = getMappingCreator(this.nameState, this).createMappingAction('addresses', 'addresses');
    }
    BowlerContainer.prototype.createViewProps = function () {
        if (!this.nameState) {
            return {
                fullName: this.props.fullName,
                scores: [],
                street: '',
                city: '',
                state: '',
                calcAverage: function () { return 0.0; }
            };
        }
        else {
            return {
                fullName: this.props.fullName,
                scores: this.nameState.bowlingScores || [],
                street: this.nameState.address ? this.nameState.address.street : '',
                city: this.nameState.address ? this.nameState.address.city : '',
                state: this.nameState.address ? this.nameState.address.state : '',
                calcAverage: function () { return 0.0; }
            };
        }
    };
    BowlerContainer.prototype.createView = function (viewProps) {
        return new React.Component(viewProps);
    };
    BowlerContainer.prototype.appendToMappingActions = function (actions) {
        var nameStateMapper = actionCreators_1.getMappingActionCreator(this.nameState, 'first');
        var bowlingMapper = actionCreators_1.getMappingActionCreator(this.nameState, 'bowlingScores');
        actions.push(nameStateMapper.createPropertyMappingAction(this, 'fullName'));
        actions.push(bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)));
        var addressesMapper = actionCreators_1.getMappingActionCreator(this.nameState, 'addresses');
        actions.push(addressesMapper.createPropertyMappingAction(this, 'addresses'));
    };
    /**
     * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
     *
     * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
     */
    BowlerContainer.prototype.generateMappingActions = function () {
        var actions = [];
        var nameStateMapper = actionCreators_1.getMappingActionCreator(this.nameState, 'first');
        var bowlingMapper = actionCreators_1.getMappingActionCreator(this.nameState, 'bowlingScores');
        actions.push(nameStateMapper.createPropertyMappingAction(this, 'fullName'));
        actions.push(bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)));
        return actions;
    };
    BowlerContainer.prototype.updateViewProps = function (executedActions) {
        // this.updateViewPropsUsingMappings(executedActions);
    };
    /* tslint:disable:no-any */
    BowlerContainer.prototype.calcAverage = function (action) {
        /* tslint:enable:no-any */
        // console.log(`calcAverage dispatched by ${ActionId[action.type]}`);
        this.average = this.viewProps.scores.reduce(function (previous, current) { return previous + current; }, 0.0);
        this.average = this.average / this.viewProps.scores.length;
    };
    return BowlerContainer;
}(src_1.ContainerComponent));
/**
 * FunctionComponent view for BowlerContainer
 * @param _props
 * @constructor
 */
var BowlerContainerView = function (_props) {
    var scoreView = _props.scores.map(function (score, index) {
        var key = index + " " + score;
        return (React.createElement("div", { key: key },
            1 + index,
            ". ",
            score));
    });
    var address = testStore.getState().address;
    if (!address) {
        throw new Error('address must be defined');
    }
    return (React.createElement("div", null,
        React.createElement("div", { id: 'bowlerDiv' },
            "Bowler: ",
            _props.fullName,
            " "),
        React.createElement("div", null,
            "Scores: ",
            React.createElement("br", null),
            scoreView)));
};
var addr1 = {
    id: 1,
    street: '3401 Walnut',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19104',
    _parent: null,
    _myPropname: 'address'
};
var nameState = {
    first: 'Joe',
    last: 'Sixpack',
    middle: '',
    addresses: [],
    bowlingScores: [],
    _myPropname: 'name',
    _parent: null,
    prefix: 'Mr.',
};
var bowlingScores = [111, 121, 131];
describe('enzyme tests for lifecycle methods', function () {
    it('renders the correct text when no enthusiasm level is given', function () {
        var hello = enzyme.mount(React.createElement(AddressRenderPropsContainer, { id: 2, street: 'Genung Ct', city: 'Hopewell', state: 'NY', zip: '12545', _functionComp: AddressFunctionComp }));
        expect(hello.find('.address1').text()).toContain('Walnut');
        // TODO: verify lifecycle methods
    });
    it('calls forceUpdate only on the mapped component, not the children', function () {
        src_1.getActionCreator(testStore.getState()).insertStateObject(addr1, 'address').dispatch();
        src_1.getActionCreator(testStore.getState()).insertStateObject(nameState, 'name').dispatch();
        src_1.getActionCreator(nameState).insert('bowlingScores', bowlingScores).dispatch();
        src_1.getArrayActionCreator(nameState, bowlingScores).appendElement(151).forEach(function (action) { return action.dispatch(); });
        expect(nameState.bowlingScores[nameState.bowlingScores.length - 1]).toBe(151);
        var addr = testStore.getState().address;
        if (!addr) {
            throw Error('address must be defined!');
        }
        var state = addr.state, street = addr.street, city = addr.city, zip = addr.zip;
        var _fullName = 'Jerry Jones';
        var bowler = enzyme.mount(React.createElement(BowlerContainer, { fullName: _fullName },
            React.createElement(AddressContainer, { id: 3, state: state, street: street, city: city, zip: zip })));
        expect(bowler.find('#bowlerDiv').text()).toContain(_fullName);
    });
});
//# sourceMappingURL=Basic.test.js.map