import { MappingAction } from '../actions/actions';

/**
 * Mapping actions require specific generic types, but common data structures need to hold 'any'
 */
/* tslint:disable:no-any */
export type GenericMappingAction = MappingAction<any, any, any, any>;
/* tslint:enable:no-any */

/**
 * Path strings map to values defined by this type, which can refer to simple properties having
 * multiple React components that they update, or to lists whose keys refer to one or more
 * React components that get updated when that row/key change.
 */
export type PathMappingValue = GenericMappingAction[] | Map<React.Key, GenericMappingAction[]>;

/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 * For now, we are not dealing with indexes into arrays, as React should be dealing
 * with that itself.  Can revisit this if necessary.
 */
export class MappingState {
    /* tslint:disable:no-any */
  private pathMappings = new Map<string, PathMappingValue>();
    /* tslint:enable:no-any */

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

  getArrayMappingActions(path: string, key: React.Key ): GenericMappingAction[] | undefined {
    let pathResults = this.pathMappings.get(path);
    if (!pathResults) {
      return undefined;
    }
    if (pathResults instanceof Map) {
      return pathResults.get(key);
    } else {
      throw new Error(`pathResults from ${path} expected to be instanceof Map`);
    }
  }

    /* tslint:disable:no-any */
  public getPathMappings(propFullPath: string): GenericMappingAction[] | undefined {
      /* tslint:enable:no-any */
    return this.getMappingActions(propFullPath);
  }

    /* tslint:disable:no-any */
  public getOrCreatePathMappings(propFullPath: string): GenericMappingAction[] {
      /* tslint:enable:no-any */
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
    /* tslint:disable:no-any */
  public removePathMapping(_fullPath: string, container: GenericMappingAction): number {
    let containers: GenericMappingAction[] | undefined = this.getMappingActions(_fullPath);
      /* tslint:enable:no-any */
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