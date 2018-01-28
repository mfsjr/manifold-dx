import { MappingAction } from '../actions/actions';
/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 * For now, we are not dealing with indexes into arrays, as React should be dealing
 * with that itself.  Can revisit this if necessary.
 */
export declare class MappingState {
    private pathMappings;
    /**
     * Primarily for testing purposes
     * @returns {number}
     */
    getSize(): number;
    getPathMappings(propFullPath: string): MappingAction<any, any, any, any, any>[] | undefined;
    getOrCreatePathMappings(propFullPath: string): MappingAction<any, any, any, any, any>[];
    /**
     *
     * @param {string} _fullPath the key where the component may be found
     * @param {React.Component} container to be removed
     * @returns {number} index at which the component was removed, -1 if not found
     */
    removePathMapping(_fullPath: string, container: MappingAction<any, any, any, any, any>): number;
}
