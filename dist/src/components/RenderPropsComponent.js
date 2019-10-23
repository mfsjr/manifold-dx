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
var ContainerComponent_1 = require("./ContainerComponent");
/**
 * ContainerComponent that defines the render function as a property using {@link ContainerRenderProps}.
 * This is generally preferable to using {@link ContainerComponent}.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 * RS: React State
 */
var RenderPropsComponent = /** @class */ (function (_super) {
    __extends(RenderPropsComponent, _super);
    function RenderPropsComponent(_props, appData, reactState) {
        return _super.call(this, _props, appData, _props._functionComp, _props._viewGenerator, reactState) || this;
    }
    RenderPropsComponent.prototype.render = function () {
        // reassign functionComponent and viewGenerator every time we render...
        this.functionCompView = this.props._functionComp || this.functionCompView;
        this.viewGenerator = this.props._viewGenerator || this.viewGenerator;
        return _super.prototype.render.call(this);
    };
    return RenderPropsComponent;
}(ContainerComponent_1.ContainerComponent));
exports.RenderPropsComponent = RenderPropsComponent;
//# sourceMappingURL=RenderPropsComponent.js.map