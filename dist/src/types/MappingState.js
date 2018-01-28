"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 * For now, we are not dealing with indexes into arrays, as React should be dealing
 * with that itself.  Can revisit this if necessary.
 */
var MappingState = /** @class */ (function () {
    function MappingState() {
        /* tslint:disable:no-any */
        this.pathMappings = new Map();
    }
    /* tslint:enable:no-any */
    /**
     * Primarily for testing purposes
     * @returns {number}
     */
    MappingState.prototype.getSize = function () {
        return this.pathMappings.size;
    };
    /* tslint:disable:no-any */
    MappingState.prototype.getPathMappings = function (propFullPath) {
        /* tslint:enable:no-any */
        return this.pathMappings.get(propFullPath);
    };
    /* tslint:disable:no-any */
    MappingState.prototype.getOrCreatePathMappings = function (propFullPath) {
        /* tslint:enable:no-any */
        var result = this.pathMappings.get(propFullPath);
        if (!result) {
            result = [];
            this.pathMappings.set(propFullPath, result);
        }
        return result;
    };
    /**
     *
     * @param {string} _fullPath the key where the component may be found
     * @param {React.Component} container to be removed
     * @returns {number} index at which the component was removed, -1 if not found
     */
    /* tslint:disable:no-any */
    MappingState.prototype.removePathMapping = function (_fullPath, container) {
        var containers = this.pathMappings.get(_fullPath);
        /* tslint:enable:no-any */
        if (containers) {
            var index = containers.indexOf(container);
            if (index > -1) {
                containers.splice(index, 1);
            }
            return containers.length;
        }
        return -1;
    };
    return MappingState;
}());
exports.MappingState = MappingState;
//# sourceMappingURL=MappingState.js.map