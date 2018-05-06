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
var src_1 = require("../src");
var MappingState_1 = require("../src/types/MappingState");
var testStore = testHarness_1.createTestStore();
var name;
var nameState;
var bowlingScores;
var initBowlerProps;
var container;
var addr1 = {
    id: 1,
    street: '3401 Walnut',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19104'
};
var addr2 = {
    id: 2,
    street: '11 Genung Court',
    city: 'Hopewell',
    state: 'New York',
    zip: '19532'
};
var ScoreCardGenerator = function (props) {
    return new React.Component(props);
};
function addressRowSfc(addressProps) {
    // React.Children.forEach(props.children, (child, index) => {
    //   if (child) {
    //     if (typeof child !== 'string' && typeof child !== 'number') {
    //       child.props.modifyBook = props.modifyBook;
    //     } else {
    //       throw new Error('Children of the row should not be ReactText!!!');
    //     }
    //   }
    // });
    return (React.createElement("div", null,
        React.createElement("div", null, addressProps.address.street),
        React.createElement("div", null,
            addressProps.address.city,
            " ",
            addressProps.address.state,
            " ",
            addressProps.address.zip)));
}
exports.addressRowSfc = addressRowSfc;
/**
 * This child container is deliberately over-engineered since we want to test the behavior of a more likely
 * "real-world" example.
 */
var AddressContainer = /** @class */ (function (_super) {
    __extends(AddressContainer, _super);
    function AddressContainer(addressProps) {
        return _super.call(this, addressProps, testStore.getState(), addressRowSfc) || this;
    }
    /**
     * Note that in the case of array/list child containers,
     * @returns {GenericContainerMappingTypes<AddressProps, AddressProps, TestState & StateObject>[]}
     */
    AddressContainer.prototype.appendToMappingActions = function (actions) {
        // return this.mappingActions;
    };
    AddressContainer.prototype.createViewProps = function () {
        return { address: this.address };
    };
    return AddressContainer;
}(ContainerComponent_1.ContainerComponent));
exports.AddressContainer = AddressContainer;
var BowlerContainer = /** @class */ (function (_super) {
    __extends(BowlerContainer, _super);
    function BowlerContainer(bowlerProps) {
        var _this = _super.call(this, bowlerProps, testStore.getState(), undefined, ScoreCardGenerator) || this;
        if (!_this.appData.name) {
            throw new Error('nameState must be defined!');
        }
        _this.nameState = _this.appData.name;
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
        var nameStateMapper = actionCreators_1.getMappingCreator(this.nameState, 'first');
        var bowlingMapper = actionCreators_1.getMappingCreator(this.nameState, 'bowlingScores');
        actions.push(nameStateMapper.createPropertyMappingAction(this, 'fullName'));
        actions.push(bowlingMapper.createPropertyMappingAction(this, 'scores', this.calcAverage.bind(this)));
        var addressesMapper = actionCreators_1.getMappingCreator(this.nameState, 'addresses');
        actions.push(addressesMapper.createPropertyMappingAction(this, 'addresses'));
        // let addressesMapper = nameStateMapper.createMappingAction('addresses', 'addresses');
        // actions.push( addressesMapper );
    };
    /**
     * This is unrelated to any of the container's mapping internals, is simply being used for standalone testing.
     *
     * @returns {GenericContainerMappingTypes<BowlerProps, ScoreCardProps, TestState & StateObject>[]}
     */
    BowlerContainer.prototype.generateMappingActions = function () {
        var actions = [];
        // let nameStateMapper = getMappingCreator(this.nameState, this);
        // actions.push( nameStateMapper.createMappingAction('first', 'fullName') );
        // actions.push( nameStateMapper.createMappingAction(
        //   'bowlingScores',
        //   'scores',
        //   this.calcAverage.bind(this)) );
        var nameStateMapper = actionCreators_1.getMappingCreator(this.nameState, 'first');
        var bowlingMapper = actionCreators_1.getMappingCreator(this.nameState, 'bowlingScores');
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
}(ContainerComponent_1.ContainerComponent));
exports.BowlerContainer = BowlerContainer;
var resetTestObjects = function () {
    // testStore.reset(createTestState(), {});
    testStore.reset({ name: nameState }, {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
    nameState = testHarness_1.createNameContainer(name, testStore.getState(), 'name');
    bowlingScores = [111, 121, 131];
    initBowlerProps = { fullName: nameState.first };
    container = new BowlerContainer(initBowlerProps);
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};
resetTestObjects();
describe('ContainerComponent instantiation, mount, update, unmount', function () {
    var addrKeyGen = function (_address) { return _address.street; };
    var addressesActionCreator = src_1.getArrayCrudCreator(nameState, nameState.addresses, addrKeyGen);
    // let mappingActionCreator = getMappingCreator(nameState, container);
    // placeholder
    test('after mounting, the component state should have something in it', function () {
        container.componentDidMount();
        if (!container.nameState) {
            throw new Error('container.nameState is undefined!');
        }
        var so = testStore.getState();
        var top = State_1.Store.getTopState(container.nameState);
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
    test('mapping state should contain bowler component', function () {
        var mappingActions = testStore.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath);
        if (!mappingActions || mappingActions.length === 0) {
            throw new Error('mappingActions should be defined but isn\'t');
        }
        expect(mappingActions[0].component).toBe(container);
    });
    test('an update action', function () {
        expect(container.average).toBeUndefined();
        var action = new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, nameState, 'bowlingScores', bowlingScores);
        testStore.getManager().actionProcess(action);
        expect(container.average).toBeGreaterThan(100);
    });
    test('add to the addresses', function () {
        addressesActionCreator.insert(0, addr1).process();
        expect(nameState.addresses[0].street).toBe(addr1.street);
    });
    test('append to the addresses', function () {
        addressesActionCreator.append(addr2).process();
        expect(nameState.addresses[1].state).toBe(addr2.state);
    });
    test("Create a mapping action to an array index", function () {
        var addr1Container = new AddressContainer({ address: addr1 });
        var keyGen = function (address) { return address.id; };
        // let addr1MappingAction = getMappingCreator(nameState, addr1Container)
        // .createMappingAction('addresses', 'address');
        var addressesOptions = { keyGen: keyGen, array: nameState.addresses };
        var addr1MappingAction = actionCreators_1.getMappingCreator(nameState, 'addresses', addressesOptions)
            .createArrayIndexMappingAction(0, addr1Container, 'address');
        // verify that we have an entry in ArrayKeyIndexMap
        var map = actions_1.ArrayKeyIndexMap.get().get(nameState.addresses);
        expect(map).toBeTruthy();
        expect(map.size).toBe(nameState.addresses.length);
        // execute the action
        addr1MappingAction.process();
        var manager = Manager_1.Manager.get(nameState);
        var fullpath = manager.getFullPath(nameState, 'addresses');
        var key1 = keyGen(addr1);
        var mapping1 = Manager_1.Manager.get(nameState).getMappingState().getPathMappings(fullpath, key1);
        // 'mapping' is possibly undefined, so cast it and then test it
        mapping1 = mapping1;
        expect(mapping1).toBeDefined();
        expect(mapping1.length).toBeGreaterThan(0);
        // if (!mapping || mapping.length === 0) {
        //   throw new Error(`expecting mappings to be defined at ${fullpath} with key ${key}`);
        // }
        expect(mapping1[mapping1.length - 1].fullPath).toBe(fullpath);
        expect(mapping1[mapping1.length - 1].component).toBe(addr1Container);
        var addr2Container = new AddressContainer({ address: addr2 });
        var addr2MappingAction = actionCreators_1.getMappingCreator(nameState, 'addresses', addressesOptions)
            .createArrayIndexMappingAction(1, addr2Container, 'address');
        addr2MappingAction.process();
        var key2 = keyGen(addr2);
        var mapping2 = Manager_1.Manager.get(nameState).getMappingState().getPathMappings(fullpath, key2);
        // 'mapping' is possibly undefined, so cast it and then test it
        mapping2 = mapping2;
        expect(mapping2).toBeDefined();
        expect(mapping2.length).toBeGreaterThan(0);
        expect(mapping2[mapping2.length - 1].fullPath).toBe(fullpath);
        expect(mapping2[mapping2.length - 1].component).toBe(addr2Container);
    });
    test('unmount should result in bowler being removed from the still-present component state mapping value ' +
        '(array of commentsUI)', function () {
        container.componentWillUnmount();
        expect(testStore.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath))
            .not.toContain(container);
    });
});
describe('Standalone tests for instance of MappingState', function () {
    var mappingState = new MappingState_1.MappingState();
    // other tests have already captured api's for simple properties, so concentrate on array/React.Key api's
    var addressesMappings = mappingState.getOrCreatePathMappings('addresses');
    var mappingActions = container.generateMappingActions();
    test('addresses returns addressesMappings', function () {
        expect(mappingState.getPathMappings('addresses')).toBe(addressesMappings);
        expect(mappingActions.length > 0).toBeTruthy();
    });
    test('addressesMappings to be an Array', function () {
        expect(addressesMappings instanceof Array).toBeTruthy();
    });
    var addr1Mappings = mappingState.getOrCreatePathMappings('addresses', 1);
    test('addr1Mappings to be an array', function () {
        expect(addr1Mappings instanceof Array).toBeTruthy();
    });
    test('translating from property to array should leave addressesMappings unchanged', function () {
        var newAddressesMappings = mappingState.getPathMappings('addresses');
        expect(newAddressesMappings instanceof Array).toBeTruthy();
        expect(addressesMappings).toBe(newAddressesMappings);
    });
    test('remove path mapping from an array index', function () {
        // let mappingActions = container.getMappingActions();
        mappingActions.forEach(function (action) { return addr1Mappings.push(action); });
        var mappings = mappingState.getPathMappings('addresses', 1);
        expect(mappings).toBeDefined();
        var n = mappingState.removePathMapping('addresses', mappingActions[0], 1);
        expect(n).toBe(1);
    });
    test('removing actions (above) should leave the same arrays in mappings', function () {
        var mappings = mappingState.getPathMappings('addresses', 1);
        expect(addr1Mappings).toBe(mappings);
    });
    test('remove entire paths', function () {
        var n = mappingState.removePath('addresses');
        // we expect there to be one entry for every element in the array, plus one for the array itself
        expect(n).toBe(addr1Mappings.length + 1);
        // now add them back and restore the variables we're using for testing
        mappingState.getOrCreatePathMappings('addresses');
        mappingState.getOrCreatePathMappings('addresses', 1);
        // let mappingActions = container.getMappingActions();
        mappingActions.forEach(function (action) { return addr1Mappings.push(action); });
        addr1Mappings = mappingActions;
    });
    test('removing state paths, ie path prefixes', function () {
        mappingState.getOrCreatePathMappings('address');
        var n = mappingState.removeStatePath('address');
        // both 'address' and 'addresses' should be removed by the 'address' path prefix / state path
        expect(n === 2).toBeTruthy();
    });
});
// describe('Verify that array element containers are rendered via createArrayItemMapping', () => {
//   test('initial conditions meet our expections', () => {
//     let n = container.getMappingActions();
//   });
// });
//# sourceMappingURL=Components.test.js.map