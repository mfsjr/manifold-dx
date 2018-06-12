"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrayMapDelete(arrayMap, index, num) {
    var result = arrayMap.get(index);
    var dx = num ? num : 1;
    if (!result) {
        throw new Error("undefined actions at index = " + index);
    }
    var size = arrayMap.get(null) ? arrayMap.size - 1 : arrayMap.size;
    var _loop_1 = function (i) {
        var mappingActions = arrayMap.get(i);
        if (!mappingActions) {
            throw new Error("undefined actions at index = " + i);
        }
        arrayMap.set(i - dx, mappingActions);
        mappingActions.forEach(function (ma) { return ma.index = i - dx; });
    };
    for (var i = index + dx; i < size; i++) {
        _loop_1(i);
    }
    for (var i = 0; i < dx; i++) {
        arrayMap.delete(size - 1 - i);
    }
    return result;
}
exports.arrayMapDelete = arrayMapDelete;
function arrayMapInsert(arrayMap, index) {
    var insertedMappingActions = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        insertedMappingActions[_i - 2] = arguments[_i];
    }
    var inserts = insertedMappingActions.length;
    var size = arrayMap.get(null) ? arrayMap.size - 1 : arrayMap.size;
    var _loop_2 = function (i) {
        var mappingActions = arrayMap.get(i);
        if (!mappingActions) {
            throw new Error("found undefined entry at i - " + inserts + " = " + (i - inserts));
        }
        arrayMap.set(i + inserts, mappingActions);
        mappingActions.forEach(function (ma) { return ma.index = i + inserts; });
    };
    for (var i = size - 1; i >= index; i--) {
        _loop_2(i);
    }
    for (var i = index; i < index + insertedMappingActions.length; ++i) {
        arrayMap.set(i, insertedMappingActions[i - index]);
    }
    return arrayMap.size;
}
exports.arrayMapInsert = arrayMapInsert;
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
    MappingState.prototype.getPathMappingArrayMap = function (fullpath) {
        var result = this.pathMappings.get(fullpath);
        return result instanceof Map ? result : undefined;
    };
    /**
     * If mapping action is undefined, remove all mappings for the path.
     * If key is defined, its assumed the path is mapped to an array
     *
     * @param {string} _fullPath
     * @param {AnyMappingAction | undefined} mappingAction
     * @param {number} _index
     * @returns {number}
     */
    MappingState.prototype.removePathMapping = function (_fullPath, mappingAction, _index) {
        var pathMappingActions = this.getPathMappings(_fullPath, _index);
        if (pathMappingActions) {
            var pathMappingComponents = pathMappingActions.map(function (action) { return action.component; });
            var index = pathMappingComponents.indexOf(mappingAction.component);
            //   let index = pathMappingActions.indexOf(mappingAction);
            if (index > -1) {
                pathMappingActions.splice(index, 1);
                // if there's nothing mapped to this, should we delete the key?
                return 1;
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