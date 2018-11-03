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
var ContainerComponent_1 = require("./ContainerComponent");
/**
 * We assume that if props contains either a '_sfc' or '_viewGenerator' prop, that they
 * are of the correct type and props implement the ContainerRenderProps<VP> interface.
 *
 * This is necessary because of weak type detection, which may make sense to me someday.
 * @param props
 */
function isContainerRenderProps(props) {
    return props["sfc"] || props["viewGenerator"];
}
exports.isContainerRenderProps = isContainerRenderProps;
var RenderComponent = /** @class */ (function (_super) {
    __extends(RenderComponent, _super);
    function RenderComponent(_props, appData, sfc, viewGenerator, reactState) {
        return _super.call(this, _props, appData, _props._sfc, _props._viewGenerator, reactState) || this;
    }
    return RenderComponent;
}(ContainerComponent_1.ContainerComponent));
exports.RenderComponent = RenderComponent;
//# sourceMappingURL=RenderComponent.js.map