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
var testHarness_1 = require("./testHarness");
var React = require("react");
var ContainerComponent_1 = require("../src/components/ContainerComponent");
var actions_1 = require("../src/actions/actions");
var State_1 = require("../src/types/State");
var Manager_1 = require("../src/types/Manager");
var actionCreators_1 = require("../src/actions/actionCreators");
var testState = testHarness_1.createAppTestState();
var name;
var nameState;
var bowlingScores;
var initBowlerProps;
var container;
var ScoreCardGenerator = function (props) {
    return new React.Component(props);
};
var BowlerContainer = /** @class */ (function (_super) {
    __extends(BowlerContainer, _super);
    function BowlerContainer(bowlerProps) {
        var _this = _super.call(this, bowlerProps, testState.getState(), undefined, ScoreCardGenerator) || this;
        if (!_this.appData.name) {
            throw new Error('nameState must be defined!');
        }
        _this.nameState = _this.appData.name;
        return _this;
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
    BowlerContainer.prototype.createMappingActions = function () {
        var nameStateMapper = actionCreators_1.getMappingCreator(this.nameState, this);
        return [
            nameStateMapper.createMappingAction('first', 'fullName'),
            nameStateMapper.createMappingAction('bowlingScores', 'scores', this.calcAverage.bind(this))
        ];
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
}(ContainerComponent_1.ContainerComponent));
exports.BowlerContainer = BowlerContainer;
var resetTestObjects = function () {
    // testState.reset(createTestState(), {});
    testState.reset({ name: nameState }, {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    // nameState = State.createStateObject<Name>(testState.getState(), 'name', name);
    nameState = testHarness_1.createNameContainer(name, testState.getState(), 'name');
    bowlingScores = [111, 121, 131];
    initBowlerProps = { fullName: nameState.first };
    container = new BowlerContainer(initBowlerProps);
    testState.getManager().getActionProcessorAPI().enableMutationChecking();
};
resetTestObjects();
describe('ContainerComponent instantiation, mount, update, unmount', function () {
    // placeholder
    test('after mounting, the component state should have something in it', function () {
        container.componentDidMount();
        if (!container.nameState) {
            throw new Error('container.nameState is undefined!');
        }
        var so = testState.getState();
        var top = State_1.State.getTopState(container.nameState);
        if (so !== top) {
            throw new Error('app state doesn\'t equal top of nameState');
        }
        expect(Manager_1.Manager.get(container.nameState).getMappingState().getSize()).toBeGreaterThan(0);
    });
    test('bowler\'s viewProps contains the correct "fullname"', function () {
        expect(container.viewProps.fullName).toEqual(nameState.first);
    });
    test('bowler\'s viewComponent.props contains the correct "fullname"', function () {
        expect(container.getView().props.fullName).toEqual(nameState.first);
    });
    test('container\'s props should contian the correct "fullname"', function () {
        expect(container.props.fullName).toEqual(nameState.first);
    });
    test('action mapping should have fullpath', function () {
        expect(container.getMappingActions()[0].fullPath).toEqual('name.first');
    });
    test('component state should contain bowler component', function () {
        var mappingActions = testState.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath);
        if (!mappingActions || mappingActions.length === 0) {
            throw new Error('mappingActions should be defined but isn\'t');
        }
        expect(mappingActions[0].component).toBe(container);
    });
    test('an update action', function () {
        expect(container.average).toBeUndefined();
        var action = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
        testState.getManager().actionPerform(action);
        expect(container.average).toBeGreaterThan(100);
    });
    test('unmount should result in bowler being removed from the still-present component state mapping value ' +
        '(array of commentsUI)', function () {
        container.componentWillUnmount();
        expect(testState.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath))
            .not.toContain(container);
    });
});
//# sourceMappingURL=Components.test.js.map