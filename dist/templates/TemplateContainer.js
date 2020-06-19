"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateView = exports.TemplateContainer = void 0;
var src_1 = require("../src");
var testHarness_1 = require("../test/testHarness");
var React = require("react");
// We're borrowing our test store, your app should have its own
var getAppStore = testHarness_1.createTestStore;
/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
var TemplateContainer = /** @class */ (function (_super) {
    __extends(TemplateContainer, _super);
    function TemplateContainer(_props) {
        return _super.call(this, _props, getAppStore().getState(), exports.TemplateView) || this;
    }
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    TemplateContainer.prototype.appendToMappingActions = function (mappingActions) {
        // Create mapping actions from application state to viewProps here (see docs), eg
        // mappingActions.push(
        //   getMappingActionCreator(getModalState(), 'message').createPropertyMappingAction(this, 'alertMessage')
        // );
    };
    TemplateContainer.prototype.createViewProps = function () {
        return {};
    };
    return TemplateContainer;
}(src_1.ContainerComponent));
exports.TemplateContainer = TemplateContainer;
/**
 * This is the component we are delegating our rendering to.  This is an old pattern, described
 * using class components here: https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
 * @param props
 * @constructor
 */
exports.TemplateView = function (props) {
    return (React.createElement("span", null, "hi"));
};
//# sourceMappingURL=TemplateContainer.js.map