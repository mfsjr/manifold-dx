import { GenericMappingAction } from '../actions/actions';

/**
 * Array maps hold all the mappings associated with an array, including the array itself.
 * Children of the array are reference with React.Key's, and the mapping for the array
 * is referred to by the null key, so the value for the null key should always exist.
 */
export type ArrayMap = Map<React.Key | null, GenericMappingAction[]>;
/**
 * This class is called after state is updated, by using the path to the state that was updated
 * and getting the components that have been mapped to that path.
 *
 * Path strings map to values defined by this type, which can refer to simple properties having
 * a list of React components that they update.
 *
 * Paths can also be used along with React.Keys, which are used to identify elements in lists,
 * so that unique elements in lists can be identified for rendering.
 */
export type PathMappingValue = GenericMappingAction[] | ArrayMap;

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

  public getPathMappings(path: string, key?: React.Key): GenericMappingAction[] | undefined {
    let pathResults = this.pathMappings.get(path);
    if (!pathResults) {
      return undefined;
    }
    if (pathResults instanceof Array) {
      return pathResults;
    } else if (pathResults instanceof Map) {
      let _key = key ? key : null;
      return pathResults.get(_key);
    }

    throw Error(`pathResults from ${path} expected to be instanceof Array, or a Map`);
  }

  public getOrCreatePathMappings(propFullPath: string, key?: React.Key): GenericMappingAction[] {
    let result = this.getPathMappings(propFullPath, key);
    if (!key) {
      if (!result) {
        result = [];
        this.pathMappings.set(propFullPath, result);
      }
      return result;
    } else { // key is defined, we will be returning the results from a nested map, converting from an array if needed
      let keyMap: ArrayMap;
      if (!result) {
        keyMap = new Map<React.Key | null, GenericMappingAction[]>();
        result = [];
        this.pathMappings.set(propFullPath, keyMap);
        keyMap.set(key, result);
      } else {
        // result has been defined, and we have a key, the property will have to be an array, our storage must be a map
        if (result instanceof Array) {
          keyMap = new Map<React.Key | null, GenericMappingAction[]>();
          keyMap.set(null, result);
          this.pathMappings.set(propFullPath, keyMap);
          result = [];
          keyMap.set(key, result);
        } else { // the only other object that we put here is a map
          keyMap = result;
          result = keyMap.get(key);
          if (!result) {
            result = [];
            keyMap.set(key, result);
          }
        }
      }
      return result;
    }
  }

  /**
   * If genericMappingAction is undefined, remove all mappings for the path.
   * If key is defined, its assumed the path is mapped to an array
   *
   * @param {string} _fullPath
   * @param {GenericMappingAction | undefined} genericMappingAction
   * @param {React.Key} key
   * @returns {number}
   */
  public removePathMapping(
            _fullPath: string,
            genericMappingAction: GenericMappingAction | undefined,
            key?: React.Key): number {
    let containers = this.getPathMappings(_fullPath, key);
    if (containers) {
      if (!key) {
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
   * @param {React.Key} key
   * @returns {boolean}
   */
  public removePath(propPath: string, key?: React.Key): number {
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
    if (key) {
      if (!keyMap.delete(key)) {
        throw new Error(`Failed to delete key ${key} at propPath ${propPath}`);
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