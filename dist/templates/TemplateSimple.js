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
exports.TemplateSimple = void 0;
var src_1 = require("../src");
var testHarness_1 = require("../test/testHarness");
var React = require("react");
// We're borrowing our test store, your app should have its own
var getAppStore = testHarness_1.createTestStore;
/**
 * If you're ok with putting it all in one file (maybe your rendering function is simple),
 * this is a quick way to get started.
 */
var TemplateSimple = /** @class */ (function (_super) {
    __extends(TemplateSimple, _super);
    function TemplateSimple(_props) {
        return _super.call(this, _props, getAppStore().getState()) || this;
    }
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    TemplateSimple.prototype.appendToMappingActions = function (mappingActions) {
        // Create mapping actions from application state to viewProps here (see docs), eg
        // mappingActions.push(
        //   getMappingActionCreator(getModalState(), 'message').createPropertyMappingAction(this, 'alertMessage')
        // );
    };
    TemplateSimple.prototype.createViewProps = function () {
        return {};
    };
    TemplateSimple.prototype.render = function () {
        // usually good to check these are initialized here
        if (!this.viewProps) {
            this.viewProps = this.createViewProps();
        }
        return (React.createElement("span", null, "hi"));
    };
    return TemplateSimple;
}(src_1.ContainerComponent));
exports.TemplateSimple = TemplateSimple;
//# sourceMappingURL=TemplateSimple.js.map