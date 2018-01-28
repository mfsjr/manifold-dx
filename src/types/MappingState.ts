import { MappingAction } from '../../actions';

/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 * For now, we are not dealing with indexes into arrays, as React should be dealing
 * with that itself.  Can revisit this if necessary.
 */
export class MappingState {
    /* tslint:disable:no-any */
  private pathMappings = new Map<string, MappingAction<any, any, any, any, any>[]>();
    /* tslint:enable:no-any */

  /**
   * Primarily for testing purposes
   * @returns {number}
   */
  public getSize(): number {
    return this.pathMappings.size;
  }
    /* tslint:disable:no-any */
  public getPathMappings(propFullPath: string): MappingAction<any, any, any, any, any>[] | undefined {
      /* tslint:enable:no-any */
    return this.pathMappings.get(propFullPath);
  }

    /* tslint:disable:no-any */
  public getOrCreatePathMappings(propFullPath: string): MappingAction<any, any, any, any, any>[] {
      /* tslint:enable:no-any */
    let result = this.pathMappings.get(propFullPath);
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
  public removePathMapping(_fullPath: string, container: MappingAction<any, any, any, any, any>): number {
    let containers: MappingAction<any, any, any, any, any>[] | undefined = this.pathMappings.get(_fullPath);
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