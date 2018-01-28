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
var Manager_1 = require("../src/types/Manager");
var testHarness_1 = require("./testHarness");
var testHarness_2 = require("./testHarness");
var React = require("react");
var ContainerComponent_1 = require("../src/components/ContainerComponent");
var actions_1 = require("../src/actions/actions");
var State_1 = require("../src/types/State");
var name;
var address;
var address2;
var nameState;
var addressState;
var bowlingScores;
var initBowlerProps;
var initScoreCardProps;
var view;
var container;
var ScoreCardGeneraotr = function (props) {
    return new React.Component(props);
};
var BowlerContainer = /** @class */ (function (_super) {
    __extends(BowlerContainer, _super);
    function BowlerContainer(bowlerProps) {
        var _this = _super.call(this, bowlerProps, testHarness_2.testState.getState(), undefined, ScoreCardGeneraotr) || this;
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
    /* tslint:disable:no-any */
    BowlerContainer.prototype.createMappingActions = function () {
        /* tslint:enable:no-any */
        // let result: StateMappingAction<any, any, BowlerProps, ScoreCardProps, keyof ScoreCardProps>[] = [];
        // result.push(this.createStateMappingAction(nameState, 'first', 'fullName'));
        var fullNameAction = new actions_1.MappingAction(nameState, 'first', this, 'fullName');
        var scoreAction = new actions_1.MappingAction(nameState, 'bowlingScores', this, 'scores', this.calcAverage.bind(this));
        return [fullNameAction, scoreAction];
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
    testHarness_2.testState.reset(testHarness_1.createTestState(), {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr' };
    nameState = State_1.State.createStateObject(testHarness_2.testState.getState(), 'name', name);
    address = { street: '54 Upton Lake Rd', city: 'Clinton Corners', state: 'NY', zip: '12514' };
    addressState = State_1.State.createStateObject(nameState, 'address', address);
    address2 = { street: '12 Bennett Common', city: 'Millbrook', state: 'NY', zip: '19106' };
    bowlingScores = [111, 121, 131];
    initBowlerProps = { fullName: nameState.first };
    initScoreCardProps = {
        fullName: '',
        scores: [],
        street: '',
        city: '',
        state: '',
        calcAverage: function () { return 0.0; }
    };
    testHarness_2.testState.reset({ name: nameState }, {});
    container = new BowlerContainer(initBowlerProps);
    view = container.getView();
    testHarness_2.testState.getManager().getActionProcessorAPI().enableMutationChecking();
};
resetTestObjects();
describe('ContainerComponent instantiation, mount, update, unmount', function () {
    // placeholder
    test('after mounting, the component state should have something in it', function () {
        container.componentDidMount();
        expect(Manager_1.Manager.get().getMappingState().getSize()).toBeGreaterThan(0);
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
        var mappingActions = Manager_1.Manager.get().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath);
        if (!mappingActions || mappingActions.length === 0) {
            throw new Error('mappingActions should be defined but isn\'t');
        }
        expect(mappingActions[0].component).toBe(container);
    });
    test('an update action', function () {
        expect(container.average).toBeUndefined();
        expect(nameState.bowlingScores).toBeUndefined();
        var action = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
        Manager_1.Manager.get().actionPerform(action);
        expect(container.average).toBeGreaterThan(100);
    });
    test('unmount should result in bowler being removed from the still-present component state mapping value ' +
        '(array of commentsUI)', function () {
        container.componentWillUnmount();
        expect(Manager_1.Manager.get().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath))
            .not.toContain(container);
    });
});
//# sourceMappingURL=Components.test.js.map