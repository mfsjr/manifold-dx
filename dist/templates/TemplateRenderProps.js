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
exports.TemplateRenderView = exports.TemplateRender = void 0;
var src_1 = require("../src");
var testHarness_1 = require("../test/testHarness");
// We're borrowing our test store, your app should have its own
var getAppStore = testHarness_1.createTestStore;
/**
 * Note that the render FunctionComponent below is often placed in a separate file, to discourage
 * accidentally supplying anything to the function besides its props (TemplateViewProps).
 */
var TemplateRender = /** @class */ (function (_super) {
    __extends(TemplateRender, _super);
    function TemplateRender(_props) {
        return _super.call(this, _props, getAppStore().getState()) || this;
    }
    /**
     * Create mapping actions from application state to viewProps
     * @see getMappingActionCreator
     * @see getArrayMappingActionCreator
     * @param mappingActions
     */
    TemplateRender.prototype.appendToMappingActions = function (mappingActions) {
        // Create mapping actions from application state to viewProps here (see docs), eg
        // mappingActions.push(
        //   getMappingActionCreator(getModalState(), 'message').createPropertyMappingAction(this, 'alertMessage')
        // );
    };
    TemplateRender.prototype.createViewProps = function () {
        return {};
    };
    return TemplateRender;
}(src_1.RenderPropsComponent));
exports.TemplateRender = TemplateRender;
exports.TemplateRenderView = function (props) {
    return null;
};
//# sourceMappingURL=TemplateRenderProps.js.map