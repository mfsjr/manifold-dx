/// <reference types="react" />
import { MappingAction } from '../actions/actions';
/**
 * Mapping actions require specific generic types, but common data structures need to hold 'any'
 */
export declare type GenericMappingAction = MappingAction<any, any, any, any>;
/**
 * Path strings map to values defined by this type, which can refer to simple properties having
 * multiple React components that they update. Also includes deprecated support for lists whose keys refer to
 * one or more React components that get updated when that row/key change.
 */
export declare type PathMappingValue = GenericMappingAction[] | Map<React.Key, GenericMappingAction[]>;
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
    getMappingActions(path: string): GenericMappingAction[] | undefined;
    getPathMappings(propFullPath: string): GenericMappingAction[] | undefined;
    getOrCreatePathMappings(propFullPath: string): GenericMappingAction[];
    /**
     *
     * @param {string} _fullPath the key where the component may be found
     * @param {React.Component} container to be removed
     * @returns {number} index at which the component was removed, -1 if not found
     */
    removePathMapping(_fullPath: string, container: GenericMappingAction): number;
}
