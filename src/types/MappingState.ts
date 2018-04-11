import { GenericMappingAction } from '../actions/actions';

/**
 * Mapping actions require specific generic types, but common data structures need to hold 'any'
 */
/* tslint:disable:no-any */
/* tslint:enable:no-any */

/**
 * Path strings map to values defined by this type, which can refer to simple properties having
 * multiple React components that they update. Also includes deprecated support for lists whose keys refer to
 * one or more React components that get updated when that row/key change.
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

  getMappingActions(path: string): GenericMappingAction[] | undefined {
    let pathResults = this.pathMappings.get(path);
    if (!pathResults) {
      return undefined;
    }
    if (pathResults instanceof Array) {
      return pathResults as GenericMappingAction[] | undefined;
    } else {
      throw Error(`pathResults from ${path} expected to be instanceof Array`);
    }
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

  public getPathMappings(propFullPath: string): GenericMappingAction[] | undefined {
    return this.getMappingActions(propFullPath);
  }

  public getOrCreatePathMappings(propFullPath: string): GenericMappingAction[] {
    let result = this.getMappingActions(propFullPath);
    if (!result) {
      result = [];
      this.pathMappings.set(propFullPath, result);
    }
    return result;
  }

  /**
   *
   * @param {string} _fullPath the key where the component may be found
   * @param {React.Component} container to be removed
   * @returns {number} index at which the component was removed, -1 if not found
   */
  public removePathMapping(_fullPath: string, container: GenericMappingAction): number {
    let containers: GenericMappingAction[] | undefined = this.getMappingActions(_fullPath);
    if (containers) {
      let index = containers.indexOf(container);
      if (index > -1) {
        containers.splice(index, 1);
      }
      return containers.length;
    }
    return -1;
  }
}