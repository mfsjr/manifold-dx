import { GenericMappingAction } from '../actions/actions';

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
export type PathMappingValue = GenericMappingAction[] | Map<React.Key, GenericMappingAction[]>;

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
    } else if (pathResults instanceof Map && key) {
      return pathResults.get(key);
      // throw Error(`pathResults from ${path} expected to be instanceof Array`);
    }
    throw Error(`pathResults from ${path} expected to be instanceof Array, or a Map with a key`);
  }

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

  // public getPathMappings(propFullPath: string): GenericMappingAction[] | undefined {
  //   return this.getMappingActions(propFullPath);
  // }

  public getOrCreatePathMappings(propFullPath: string, key?: React.Key): GenericMappingAction[] {
    let result = this.getPathMappings(propFullPath);
    if (!key) {
      if (!result) {
        result = [];
        this.pathMappings.set(propFullPath, result);
      }
      return result;
    } else {
      let keyMap: Map<React.Key, GenericMappingAction[]>;
      if (!result) {
        keyMap = new Map<React.Key, GenericMappingAction[]>();
        result = undefined;
      } else {
        if (result instanceof Map) {
          keyMap = result;
          result = keyMap.get(key);
        } else {
          throw new Error(`Found an object other than a Map at path ${propFullPath}`);
        }
      }
      if (!result) {
        result = [];
        keyMap.set(key, result);
      }
      return result;
    }
  }

  /**
   *
   * @param {string} _fullPath the key where the component may be found
   * @param {React.Component} _container to be removed
   * @returns {number} index at which the component was removed, -1 if not found
   */
  public removePathMapping(_fullPath: string, _container: GenericMappingAction, key?: React.Key): number {
    let containers = this.getPathMappings(_fullPath);
    if (containers) {
      if (!key) {
        let index = containers.indexOf(_container);
        if (index > -1) {
          containers.splice(index, 1);
        }
        return containers.length;
      } else {
        if (!(containers instanceof Map)) {
          throw Error(`Trying to remove key from object that is not a Map, at path ${_fullPath}`);
        }
        let keyMap: Map<React.Key, GenericMappingAction[]> = containers;
        let list: GenericMappingAction[] | undefined = keyMap.get(key);
        if (list) {
          let index = list.indexOf(_container);
          if (index > -1) {
            list.splice(index, 1);
            return list.length;
          }
        }
      }
    }
    return -1;
  }

  /**
   * If a state object is removed it will not be mapped directly, but it may have many child properties that are.
   *
   * So, this method iterates through all of the path keys, and deletes any that are children of the state path,
   * i.e., paths that begin with the state path.
   *
   * @param {string} statePath
   */
  public removeStatePath(statePath: string) {
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
    }
  }

  /**
   * Remove the entire path (and key if present) from the mapping state.
   *
   * @param {string} propPath
   * @param {React.Key} key
   * @returns {boolean}
   */
  public removePath(propPath: string, key?: React.Key): boolean {
    let result = this.pathMappings.get(propPath);
    if (!result) {
      return false;
    }
    if (result instanceof Array) {
      return this.pathMappings.delete(propPath);
    }
    if (!key || !(result instanceof Map)) {
      throw Error(`Type error trying to remove a key from a map at path ${propPath}`);
    }
    let keyMap: Map<React.Key, GenericMappingAction[]> = result;
    return keyMap.delete(key);
  }
}