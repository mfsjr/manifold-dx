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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var testHarness_1 = require("./testHarness");
var React = require("react");
var ContainerComponent_1 = require("../src/components/ContainerComponent");
var actions_1 = require("../src/actions/actions");
var Store_1 = require("../src/types/Store");
var Manager_1 = require("../src/types/Manager");
var actionCreators_1 = require("../src/actions/actionCreators");
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
var newAddr1 = __assign({}, addr1);
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
    return (React.createElement("div", null,
        React.createElement("div", null, addressProps.address.street),
        React.createElement("div", null,
            addressProps.address.city,
            " ",
            addressProps.address.state,
            " ",
            addressProps.address.zip)));
}
/**
 * This child container is deliberately over-engineered since we want to test the behavior of a more likely
 * "real-world" example.
 */
var AddressContainer = /** @class */ (function (_super) {
    __extends(AddressContainer, _super);
    function AddressContainer(addressProps, _displayName) {
        var _this = _super.call(this, addressProps, testStore.getState(), addressRowSfc) || this;
        _this.displayName = _displayName;
        return _this;
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
var BowlerContainer = /** @class */ (function (_super) {
    __extends(BowlerContainer, _super);
    function BowlerContainer(bowlerProps) {
        var _this = _super.call(this, bowlerProps, testStore.getState(), undefined, ScoreCardGenerator) || this;
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
}(ContainerComponent_1.ContainerComponent));
var resetTestObjects = function () {
    testStore.reset({ name: nameState }, {});
    name = { first: 'Matthew', middle: 'F', last: 'Hooper', prefix: 'Mr', bowlingScores: [], addresses: [] };
    // nameState = State.createStateObject<Name>(testStore.getState(), 'name', name);
    // nameState = createNameContainer(name, testStore.getState(), 'name');
    nameState = new testHarness_1.NameStateCreator(name, testStore.getState(), 'name').nameState;
    bowlingScores = [111, 121, 131];
    initBowlerProps = { fullName: nameState.first };
    container = new BowlerContainer(initBowlerProps);
    // NOTE: do this after setting up the store's initial state, this is where the snapshot is taken
    // if you init state after calling this you will get mutation errors!
    testStore.getManager().getActionProcessorAPI().enableMutationChecking();
};
resetTestObjects();
describe('ContainerComponent instantiation, mount, update, unmount', function () {
    // let addrKeyGen = (_address: Address) => _address.id;
    // let addressesActionCreator = getArrayCrudCreator(nameState, nameState.addresses, addrKeyGen);
    var addressesActionCreator = nameState.getAddressesActionCreator(nameState);
    var address1Container;
    var address2Container;
    // let mappingActionCreator = getMappingCreator(nameState, container);
    // placeholder
    test('after mounting, the component state should have something in it', function () {
        container.componentDidMount();
        if (!container.nameState) {
            throw new Error('container.nameState is undefined!');
        }
        var so = testStore.getState();
        var top = Store_1.Store.getTopState(container.nameState);
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
        addressesActionCreator.insertElement(0, addr1).forEach(function (action) { return action.dispatch(); });
        expect(nameState.addresses[0].street).toBe(addr1.street);
    });
    test('append to the addresses', function () {
        var actions = addressesActionCreator.appendElement(addr2);
        testStore.dispatch.apply(testStore, actions);
        expect(nameState.addresses[1].state).toBe(addr2.state);
    });
    test("Create a mapping action to an array index", function () {
        var addr1Container = new AddressContainer({ address: addr1 }, 'addr1Container');
        address1Container = addr1Container;
        // let keyGen = (address: Address) => address.id;
        // let addr1MappingAction = getMappingCreator(nameState, addr1Container)
        // .createMappingAction('addresses', 'address');
        // let addressesOptions = {keyGen: keyGen, array: nameState.addresses};
        var addr1MappingAction = actionCreators_1.getMappingActionCreator(nameState, 'addresses')
            .createArrayIndexMappingAction(nameState.addresses, 0, addr1Container, 'address');
        addr1MappingAction.dispatch();
        var manager = Manager_1.Manager.get(nameState);
        var fullpath = manager.getFullPath(nameState, 'addresses');
        var mapping1 = Manager_1.Manager.get(nameState).getMappingState().getPathMappings(fullpath, 0);
        // 'mapping' is possibly undefined, so cast it and then test it
        mapping1 = mapping1;
        expect(mapping1).toBeDefined();
        expect(mapping1.length).toBeGreaterThan(0);
        expect(mapping1[mapping1.length - 1].fullPath).toBe(fullpath);
        expect(mapping1[mapping1.length - 1].component).toBe(addr1Container);
        var addr2Container = new AddressContainer({ address: addr2 }, 'addr2Container');
        address2Container = addr2Container;
        var addr2MappingAction = actionCreators_1.getMappingActionCreator(nameState, 'addresses')
            .createArrayIndexMappingAction(nameState.addresses, 1, addr2Container, 'address');
        addr2MappingAction.dispatch();
        var mapping2 = Manager_1.Manager.get(nameState).getMappingState().getPathMappings(fullpath, 1);
        // 'mapping' is possibly undefined, so cast it and then test it
        mapping2 = mapping2;
        expect(mapping2).toBeDefined();
        expect(mapping2.length).toBeGreaterThan(0);
        expect(mapping2[mapping2.length - 1].fullPath).toBe(fullpath);
        expect(mapping2[mapping2.length - 1].component).toBe(addr2Container);
        // mapping1 should be unchanged
        var mapping1a = Manager_1.Manager.get(nameState).getMappingState().getPathMappings(fullpath, 0);
        expect(mapping1 === mapping1a).toBeTruthy();
    });
    test('updating the state array index value should update address1Container and its properties', function () {
        newAddr1.street = '16 Genung Ct';
        expect(address1Container.viewProps["addresses"]).toBeUndefined();
        addressesActionCreator.updateElement(0, newAddr1).dispatch();
        expect(address1Container.viewProps["addresses"]).toBeUndefined();
        expect(nameState.addresses[0].street).toBe(newAddr1.street);
        // verify that the prop that was mapped from the state was also updated
        expect(address1Container.viewProps.address).toBe(newAddr1);
    });
    test('inserting a new element into index 0 should result in container remapping props to state', function () {
        var _a;
        expect(nameState.addresses[0].street).toBe(newAddr1.street);
        // all containers that have been mapped should have their props updated to reflect the new state array insert
        var addr0 = {
            id: 0,
            street: '13 Lily Pond Lane',
            city: 'Katonah',
            state: 'NY',
            zip: '21039'
        };
        var insertActions = addressesActionCreator.insertElement(0, addr0);
        (_a = Manager_1.Manager.get(nameState)).actionProcess.apply(_a, insertActions);
        // verify that state was updated
        expect(nameState.addresses[0].street).toBe(addr0.street);
        expect(nameState.addresses[1].street).toBe(newAddr1.street);
        // verify that the prop that was mapped from the state was also updated
        // state array index insert results in React inserting a new component,
        // the old component at index 0 now is mapped to index 1
        // Note we are looking at the container props, which is responsible for mapping to the view
        // expect(address1Container.props.address).toBe(newAddr1);
        // expect(address2Container.props.address).toBe(addr0);
        // old scheme: state changes with insertion, mappings are fixed
        // // expect(address1Container.viewProps[`addresses`]).toBeUndefined();
        // ;
        // expect(address2Container.viewProps.address).toBe(newAddr1);
    });
    test('deleting an element from the addresses array re-maps the array and its containers', function () {
        expect(nameState.addresses[1].street).toBe(newAddr1.street);
        expect(nameState.addresses[2].street).toBe(addr2.street);
        //
        var deleteActions = addressesActionCreator.removeElement(0);
        // Manager.get(nameState).actionProcess(...deleteActions);
        testStore.dispatch.apply(testStore, deleteActions);
        expect(nameState.addresses[0].street).toBe(newAddr1.street);
        expect(address1Container.viewProps.address).toBe(newAddr1);
        expect(address2Container.viewProps.address).toBe(undefined);
    });
    test('unmount should result in bowler being removed from the still-present component state mapping value ' +
        '(array of commentsUI)', function () {
        container.componentWillUnmount();
        expect(container.getMappingActions().length).toBeGreaterThan(0);
        expect(testStore.getManager().getMappingState().getPathMappings(container.getMappingActions()[0].fullPath))
            .not.toContain(container);
    });
    test('updating all array elements using addresses3 should update all the addresses in state', function () {
        var addresses3 = [
            {
                id: 10,
                city: 'Pawling',
                street: '4th',
                state: 'WY',
                zip: '93837',
                country: 'US'
            },
            {
                id: 11,
                city: 'Kingston',
                street: '5th',
                state: 'HI',
                zip: '13227',
                country: 'US'
            },
            {
                id: 12,
                city: 'Rome',
                street: '6th',
                state: 'CA',
                zip: '83227',
                country: 'US'
            }
        ];
        expect(nameState.addresses.length).toBe(2);
        var updateAllActions = actionCreators_1.getArrayActionCreator(nameState, nameState.addresses).replaceAll(addresses3);
        testStore.dispatch.apply(testStore, updateAllActions);
        // updateAllActions.forEach(action => action.dispatch());
        expect(addresses3.length).toBe(3);
        expect(nameState.addresses.length).toBe(3);
        addresses3.forEach(function (addr, index) { return expect(nameState.addresses[index]).toBe(addresses3[index]); });
    });
});
describe('Standalone tests for instance of MappingState', function () {
    var mappingState = new MappingState_1.MappingState();
    // other tests have already captured api's for simple properties, so concentrate on array/React.Key api's
    var addressesMappings = mappingState.getOrCreatePathMapping('addresses');
    var mappingActions = container.generateMappingActions();
    test('addresses returns addressesMappings', function () {
        expect(mappingState.getPathMappings('addresses')).toBe(addressesMappings);
        expect(mappingActions.length > 0).toBeTruthy();
    });
    test('addressesMappings to be an Array', function () {
        expect(addressesMappings instanceof Array).toBeTruthy();
    });
    var addr1Mappings = mappingState.getOrCreatePathMapping('addresses', 1);
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
        var unmappingAction = mappingActions[0].getUndoAction();
        var n = mappingState.removePathMapping('addresses', unmappingAction, 1);
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
        mappingState.getOrCreatePathMapping('addresses');
        mappingState.getOrCreatePathMapping('addresses', 1);
        // let mappingActions = container.getMappingActions();
        mappingActions.forEach(function (action) { return addr1Mappings.push(action); });
        addr1Mappings = mappingActions;
    });
    test('removing state paths, ie path prefixes', function () {
        mappingState.getOrCreatePathMapping('address');
        var n = mappingState.removeStatePath('address');
        // both 'address' and 'addresses' should be removed by the 'address' path prefix / state path
        expect(n === 2).toBeTruthy();
    });
    test('Map to an index array without mapping to the array itself', function () {
        // mappingState = new MappingState();
        var addressesMapping = mappingState.getPathMappings('addresses');
        expect(addressesMapping).toBeUndefined();
        var addr1Mapping = mappingState.getOrCreatePathMapping('addresses', 1);
        expect(addr1Mapping).toBeDefined();
        // this should still be undefined
        addressesMapping = mappingState.getPathMappings('addresses');
        expect(addressesMapping).toBeUndefined();
    });
    test('Mapping the array after mapping an index of it', function () {
        // a somewhat atypical sequence of doing things, but something that should be doable
        var addressesMapping = mappingState.getOrCreatePathMapping('addresses');
        expect(addressesMapping).toBeDefined();
        // the previously mapped index should still be there
        var addr1Mapping = mappingState.getPathMappings('addresses', 1);
        expect(addr1Mapping).toBeDefined();
    });
    test('Assign mapping to array using null (direct array mapping)', function () {
        // let previousAddresses = new Array<Address>();
        var propKey = 'previous';
        expect(mappingState.getPathMappings(propKey)).toBeFalsy();
        var array = mappingState.getOrCreatePathMapping(propKey, null);
        expect(array instanceof Array).toBeTruthy();
        var test = mappingState.getPathMappingsArrayMap(propKey);
        expect(test instanceof Map).toBeTruthy();
        expect(test && test.get(null)).toBe(array);
    });
});
describe('ArrayMap insertion and deletion functions', function () {
    var arrayMap = new Map();
    arrayMap.set(null, []);
    var mappingActions = container.generateMappingActions();
    arrayMap.set(0, [mappingActions[0]]);
    arrayMap.set(1, [mappingActions[1]]);
    arrayMap.set(2, []);
    var newMappingActions = new Array();
    var length = MappingState_1.arrayMapInsert(arrayMap, 1, newMappingActions);
    expect(length === 5);
    var actions = arrayMap.get(0);
    if (!actions) {
        throw new Error('undefined value');
    }
    expect(actions.length === 1);
    actions = arrayMap.get(1);
    if (!actions) {
        throw new Error('undefined value');
    }
    expect(actions.length === 0);
    actions = arrayMap.get(2);
    if (!actions) {
        throw new Error('undefined value');
    }
    expect(actions.length === 1);
    var deletedActions = MappingState_1.arrayMapDelete(arrayMap, 1);
    expect(deletedActions.length === 0);
});
// describe('enzyme-based tests of rendering', () => {
//   resetTestObjects();
//   test('initial conditions', () => {
//     expect(Manager.get(container.nameState).getMappingState().getSize()).toBeGreaterThan(0);
//   });
// });
//# sourceMappingURL=Components.test.js.map