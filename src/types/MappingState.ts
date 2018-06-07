import { AnyMappingAction } from '../actions/actions';

/**
 * Array maps hold all the mappings associated with an array, including the array itself.
 * Children of the array are reference with number's, and the mapping for the array
 * is referred to by the null key, so the value for the null key should always exist.
 */
export type ArrayMap = Map<number | null, AnyMappingAction[]>;
/**
 * This class is called after state is updated, by using the path to the state that was updated
 * and getting the components that have been mapped to that path.
 *
 * Path strings map to values defined by this type, which can refer to simple properties having
 * a list of React components that they update.
 *
 * Paths can also be used along with numbers, which are used to identify elements in lists,
 * so that unique elements in lists can be identified for rendering.
 */
export type PathMappingValue = AnyMappingAction[] | ArrayMap;

export function arrayMapDelete(arrayMap: ArrayMap, index: number, num?: number): AnyMappingAction[] {
  let result = arrayMap.get(index);
  let dx: number = num ? num : 1;
  if (!result) {
    throw new Error(`undefined actions at index = ${index}` );
  }
  let size = arrayMap.get(null) ? arrayMap.size - 1 : arrayMap.size;
  for (let i = index + dx; i < size; i++) {
    let mappingActions = arrayMap.get(i);
    if (!mappingActions) {
      throw new Error(`undefined actions at index = ${i}`);
    }
    arrayMap.set(i - dx, mappingActions);
    arrayMap.delete(i);
    mappingActions.forEach(ma => ma.index = i - dx);
  }
  for (let i = 0; i < dx; i++ ) {
    arrayMap.delete(size - 1 - i);
  }
  return result;
}

export function arrayMapInsert(arrayMap: ArrayMap, index: number, ...insertedMappingActions: Array<AnyMappingAction[]>)
    : number {
  let inserts = insertedMappingActions.length;
  let size = arrayMap.get(null) ? arrayMap.size - 1 : arrayMap.size;
  for (let i = size - 1; i >= index; i-- ) {
    let mappingActions = arrayMap.get(i);
    if (!mappingActions) {
      throw new Error(`found undefined entry at i - ${inserts} = ${i - inserts}` );
    }
    arrayMap.set(i + inserts, mappingActions);
    mappingActions.forEach(ma => ma.index = i + inserts);
  }
  for (let i = index; i < index + insertedMappingActions.length; ++i) {
    arrayMap.set(i, insertedMappingActions[i - index]);
  }

  return arrayMap.size;
}

/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 */
export class MappingState {
  private pathMappings = new Map<string, PathMappingValue>();

  /**
   * Primarily for testing purposes
   * @returns {number}
   */
  public getSize(): number {
    return this.pathMappings.size;
  }

  public getPathMappings(path: string, index?: number): AnyMappingAction[] | undefined {
    let pathResults = this.pathMappings.get(path);
    if (!pathResults) {
      return undefined;
    }
    if (pathResults instanceof Array) {
      return pathResults;
    } else if (pathResults instanceof Map) {
      let _key = index !== undefined ? index : null;
      return pathResults.get(_key);
    }

    throw Error(`pathResults from ${path} expected to be instanceof Array, or a Map`);
  }

  public getOrCreatePathMappings(propFullPath: string, index?: number): AnyMappingAction[] {
    let result = this.getPathMappings(propFullPath, index);
    if (index === undefined) {
      if (!result) {
        result = [];
        let holder = this.pathMappings.get(propFullPath);
        if (!holder) {
          this.pathMappings.set(propFullPath, result);
        } else if (holder instanceof Map) {
          holder.set(null, result);
        } else {
          throw new Error(`Mapping failure, array is not mapped, holder is not a Map: ${JSON.stringify(holder)}`);
        }
      } else if (result instanceof Map) {
        let ra = result.get(null);
        if (!ra) {
          ra = [];
          result.set(null, ra);
        }
        return ra;
      }
      return result;
    } else { // key is defined, we will be returning the results from a nested map, converting from an array if needed
      let keyMap = this.pathMappings.get(propFullPath);
      // TODO: clean up the types, return the same keymap for different key values (don't recreate the map)
      if (!keyMap) {
        keyMap = new Map<number | null, AnyMappingAction[]>();
        result = [];
        this.pathMappings.set(propFullPath, keyMap);
        keyMap.set(index, result);
      } else {
        // result has been defined, and we have a key, the property will have to be an array, our storage must be a map
        if (keyMap instanceof Array) {
          result = keyMap;
          keyMap = new Map<number | null, AnyMappingAction[]>();

          keyMap.set(null, result);
          this.pathMappings.set(propFullPath, keyMap);
          result = [];
          keyMap.set(index, result);
        } else { // the only other object that we put here is a map
          if ( !(keyMap instanceof Map) ) {
            throw new Error(`keyMap should be a Map`);
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
  }

  public getPathMappingArrayMap(fullpath: string): ArrayMap | undefined {
    let result = this.pathMappings.get(fullpath);
    return result instanceof Map ? result : undefined;
  }

  /**
   * If genericMappingAction is undefined, remove all mappings for the path.
   * If key is defined, its assumed the path is mapped to an array
   *
   * @param {string} _fullPath
   * @param {AnyMappingAction | undefined} genericMappingAction
   * @param {number} _index
   * @returns {number}
   */
  public removePathMapping(
            _fullPath: string,
            genericMappingAction: AnyMappingAction | undefined,
            _index?: number): number {
    let containers = this.getPathMappings(_fullPath, _index);
    if (containers) {
      if (_index === undefined) {
        if (genericMappingAction) {
          let index = containers.indexOf(genericMappingAction);
          if (index > -1) {
            containers.splice(index, 1);
            return 1;
          }
          return 0;
        } else {
          this.pathMappings.delete(_fullPath);
          return containers.length;
        }
      } else {
        if (containers && containers.length > 0) {
          if (genericMappingAction) {
            let index = containers.indexOf(genericMappingAction);
            if (index > -1) {
              containers.splice(index, 1);
              return 1;
            }
          } else {
            if (!this.pathMappings.delete(_fullPath)) {
              throw new Error(`Failed to delete all mapping actions in the map at ${_fullPath}`);
            }
            return containers.length;
          }
        }
      }
    }
    return 0;
  }

  /**
   * If a state object is removed it will not be mapped directly, but it may have many child properties that are.
   *
   * So, this method iterates through all of the path keys, and deletes any that are children of the state path,
   * i.e., paths that begin with the state path.
   *
   * @param {string} statePath
   * @return {number} # of path entries removed
   */
  public removeStatePath(statePath: string): number {
    let iterator = this.pathMappings.keys();
    let key = iterator.next();
    let keys: Array<string> = [];
    while ( !key.done ) {
      keys.push(key.value);
      key = iterator.next();
    }
    if (keys.length > 0) {
      let subPaths: Array<string> = [];
      keys.forEach((value) => {
        if (value.startsWith(statePath)) {
          subPaths.push(value);
        }
      });
      subPaths.forEach(value => {
        this.pathMappings.delete(value);
      });
      return subPaths.length;
    }
    return 0;
  }

  /**
   * Remove the entire path (and key if present) from the mapping state.
   *
   * @param {string} propPath
   * @param {number} index
   * @returns {boolean}
   */
  public removePath(propPath: string, index?: number): number {
    let result = this.pathMappings.get(propPath);
    if (!result) {
      return 0;
    }
    if (result instanceof Array) {
      if (!this.pathMappings.delete(propPath)) {
        throw new Error(`Failed to delete ${propPath}`);
      }
      return 1;
    }
    // if (!key || !(result instanceof Map)) {
    //   throw Error(`Type error trying to remove a key from a map at path ${propPath}`);
    // }
    let keyMap: ArrayMap = result;
    if (index !== undefined) {
      if (!keyMap.delete(index)) {
        throw new Error(`Failed to delete key ${index} at propPath ${propPath}`);
      }
    } else {
      if (!this.pathMappings.delete(propPath)) {
        throw new Error(`failed to delete array at path ${propPath}`);
      }
      // return the number of entries in the deleted map
      return keyMap.size;
    }
    return 1;
    // return keyMap.delete(key) ? 1 : throw new Error('a');
  }
}