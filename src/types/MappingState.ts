import { AnyMappingAction } from '../actions/actions';
import { AnyContainerComponent } from '../components/ContainerComponent';

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
 * making components update (ie render).
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

  public getPathMappings(path: string, index?: number | null): AnyMappingAction[] | undefined {
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

  /**
   * Get (find) or create an array of mapping actions, each of which refer to components (typically to be updated).
   *
   * Note that index === null implies that an array is being directly mapped into a component, as opposed to the
   * more usual case, where index >= 0, meaning that one of its elements is being mapped.
   *
   * @param propFullPath
   * @param index
   */
  public getOrCreatePathMapping(propFullPath: string, index?: number | null): AnyMappingAction[] {
    if (index === null) {
      // TODO: assert value at fullpath is an array (null is used only in ArrayMap)
      let arrayMap = this.getPathMappingsArrayMap(propFullPath);
      if (!arrayMap) {
        arrayMap = new Map<number | null, AnyMappingAction[]>();
        this.pathMappings.set(propFullPath, arrayMap);
      }
      let mapResult = arrayMap.get(index);
      if (!mapResult) {
        mapResult = new Array<AnyMappingAction>();
        arrayMap.set(index, mapResult);
      }
      return mapResult;
    }
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

  public getPathMappingsArrayMap(fullpath: string): ArrayMap | undefined {
    let result = this.pathMappings.get(fullpath);
    return result instanceof Map ? result : undefined;
  }

  /**
   * If mapping action is undefined, remove all mappings for the path.
   * If key is defined, its assumed the path is mapped to an array
   *
   * @param {string} _fullPath
   * @param {AnyMappingAction | undefined} mappingAction
   * @param {number} _index
   * @returns {number}
   */
  public removePathMapping(
            _fullPath: string,
            mappingAction: AnyMappingAction,
            _index?: number | null): number {
    let pathMappingActions = this.getPathMappings(_fullPath, _index);
    if (pathMappingActions) {
      let pathMappingComponents: AnyContainerComponent[] = pathMappingActions.map(action => action.component);
      let index = pathMappingComponents.indexOf(mappingAction.component);
      //   let index = pathMappingActions.indexOf(mappingAction);
      if (index > -1) {
        pathMappingActions.splice(index, 1);
        // if there's nothing mapped to this, should we delete the key?
        return 1;
      }
    }
    return 0;
  }

  /**
   * If a state object is removed it will not be mapped directly, but it may have many child properties that are.
   * See {@link StateCrudAction#removeStateObject}
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
