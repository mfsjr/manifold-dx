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
        this.pathMappings = new Map();
    }
    /**
     * Primarily for testing purposes
     * @returns {number}
     */
    MappingState.prototype.getSize = function () {
        return this.pathMappings.size;
    };
    MappingState.prototype.getMappingActions = function (path) {
        var pathResults = this.pathMappings.get(path);
        if (!pathResults) {
            return undefined;
        }
        if (pathResults instanceof Array) {
            return pathResults;
        }
        else {
            throw Error("pathResults from " + path + " expected to be instanceof Array");
        }
    };
    // /**
    //  * This doesn't seem supportable, since it requires arrays to be remapped any time their
    //  * values change.  Better to rely on immutability and pure components
    //  * @param {string} path
    //  * @param {React.Key} key
    //  * @returns {GenericMappingAction[] | undefined}
    //  */
    // getArrayMappingActions(path: string, key: React.Key ): GenericMappingAction[] | undefined {
    //   let pathResults = this.pathMappings.get(path);
    //   if (!pathResults) {
    //     return undefined;
    //   }
    //   if (pathResults instanceof Map) {
    //     return pathResults.get(key);
    //   } else {
    //     throw new Error(`pathResults from ${path} expected to be instanceof Map`);
    //   }
    // }
    MappingState.prototype.getPathMappings = function (propFullPath) {
        return this.getMappingActions(propFullPath);
    };
    MappingState.prototype.getOrCreatePathMappings = function (propFullPath) {
        var result = this.getMappingActions(propFullPath);
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
    MappingState.prototype.removePathMapping = function (_fullPath, container) {
        var containers = this.getMappingActions(_fullPath);
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