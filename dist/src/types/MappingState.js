"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
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
    MappingState.prototype.getPathMappings = function (path, index) {
        var pathResults = this.pathMappings.get(path);
        if (!pathResults) {
            return undefined;
        }
        if (pathResults instanceof Array) {
            return pathResults;
        }
        else if (pathResults instanceof Map) {
            var _key = index !== undefined ? index : null;
            return pathResults.get(_key);
        }
        throw Error("pathResults from " + path + " expected to be instanceof Array, or a Map");
    };
    MappingState.prototype.getOrCreatePathMappings = function (propFullPath, index) {
        var result = this.getPathMappings(propFullPath, index);
        if (index === undefined) {
            if (!result) {
                result = [];
                var holder = this.pathMappings.get(propFullPath);
                if (!holder) {
                    this.pathMappings.set(propFullPath, result);
                }
                else if (holder instanceof Map) {
                    holder.set(null, result);
                }
                else {
                    throw new Error("Mapping failure, array is not mapped, holder is not a Map: " + JSON.stringify(holder));
                }
            }
            else if (result instanceof Map) {
                var ra = result.get(null);
                if (!ra) {
                    ra = [];
                    result.set(null, ra);
                }
                return ra;
            }
            return result;
        }
        else {
            var keyMap = this.pathMappings.get(propFullPath);
            // TODO: clean up the types, return the same keymap for different key values (don't recreate the map)
            if (!keyMap) {
                keyMap = new Map();
                result = [];
                this.pathMappings.set(propFullPath, keyMap);
                keyMap.set(index, result);
            }
            else {
                // result has been defined, and we have a key, the property will have to be an array, our storage must be a map
                if (keyMap instanceof Array) {
                    result = keyMap;
                    keyMap = new Map();
                    keyMap.set(null, result);
                    this.pathMappings.set(propFullPath, keyMap);
                    result = [];
                    keyMap.set(index, result);
                }
                else {
                    if (!(keyMap instanceof Map)) {
                        throw new Error("keyMap should be a Map");
                    }
                    // keyMap = result;
                    result = keyMap.get(index);
                    if (!result) {
                        result = [];
                        keyMap.set(index, result);
                    }
                }
            }
            return result;
        }
    };
    /**
     * If genericMappingAction is undefined, remove all mappings for the path.
     * If key is defined, its assumed the path is mapped to an array
     *
     * @param {string} _fullPath
     * @param {AnyMappingAction | undefined} genericMappingAction
     * @param {number} _index
     * @returns {number}
     */
    MappingState.prototype.removePathMapping = function (_fullPath, genericMappingAction, _index) {
        var containers = this.getPathMappings(_fullPath, _index);
        if (containers) {
            if (_index === undefined) {
                if (genericMappingAction) {
                    var index = containers.indexOf(genericMappingAction);
                    if (index > -1) {
                        containers.splice(index, 1);
                        return 1;
                    }
                    return 0;
                }
                else {
                    this.pathMappings.delete(_fullPath);
                    return containers.length;
                }
            }
            else {
                if (containers && containers.length > 0) {
                    if (genericMappingAction) {
                        var index = containers.indexOf(genericMappingAction);
                        if (index > -1) {
                            containers.splice(index, 1);
                            return 1;
                        }
                    }
                    else {
                        if (!this.pathMappings.delete(_fullPath)) {
                            throw new Error("Failed to delete all mapping actions in the map at " + _fullPath);
                        }
                        return containers.length;
                    }
                }
            }
        }
        return 0;
    };
    /**
     * If a state object is removed it will not be mapped directly, but it may have many child properties that are.
     *
     * So, this method iterates through all of the path keys, and deletes any that are children of the state path,
     * i.e., paths that begin with the state path.
     *
     * @param {string} statePath
     * @return {number} # of path entries removed
     */
    MappingState.prototype.removeStatePath = function (statePath) {
        var _this = this;
        var iterator = this.pathMappings.keys();
        var key = iterator.next();
        var keys = [];
        while (!key.done) {
            keys.push(key.value);
            key = iterator.next();
        }
        if (keys.length > 0) {
            var subPaths_1 = [];
            keys.forEach(function (value) {
                if (value.startsWith(statePath)) {
                    subPaths_1.push(value);
                }
            });
            subPaths_1.forEach(function (value) {
                _this.pathMappings.delete(value);
            });
            return subPaths_1.length;
        }
        return 0;
    };
    /**
     * Remove the entire path (and key if present) from the mapping state.
     *
     * @param {string} propPath
     * @param {number} index
     * @returns {boolean}
     */
    MappingState.prototype.removePath = function (propPath, index) {
        var result = this.pathMappings.get(propPath);
        if (!result) {
            return 0;
        }
        if (result instanceof Array) {
            if (!this.pathMappings.delete(propPath)) {
                throw new Error("Failed to delete " + propPath);
            }
            return 1;
        }
        // if (!key || !(result instanceof Map)) {
        //   throw Error(`Type error trying to remove a key from a map at path ${propPath}`);
        // }
        var keyMap = result;
        if (index !== undefined) {
            if (!keyMap.delete(index)) {
                throw new Error("Failed to delete key " + index + " at propPath " + propPath);
            }
        }
        else {
            if (!this.pathMappings.delete(propPath)) {
                throw new Error("failed to delete array at path " + propPath);
            }
            // return the number of entries in the deleted map
            return keyMap.size;
        }
        return 1;
        // return keyMap.delete(key) ? 1 : throw new Error('a');
    };
    return MappingState;
}());
exports.MappingState = MappingState;
//# sourceMappingURL=MappingState.js.map