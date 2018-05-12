/// <reference types="react" />
import { AnyMappingAction } from '../actions/actions';
export interface KeyProp {
    reactKey: React.Key;
    prop: string;
}
/**
 * Array maps hold all the mappings associated with an array, including the array itself.
 * Children of the array are reference with React.Key's, and the mapping for the array
 * is referred to by the null key, so the value for the null key should always exist.
 */
export declare type ArrayMap = Map<React.Key | null, AnyMappingAction[]>;
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
export declare type PathMappingValue = AnyMappingAction[] | ArrayMap;
/**
 * Relates application state properties with React components, for the purpose of
 * forcing components to update (ie render).
 *
 */
export declare class MappingState {
    private pathMappings;
    /**
     * Primarily for testing purposes
     * @returns {number}
     */
    getSize(): number;
    getPathMappings(path: string, key?: React.Key): AnyMappingAction[] | undefined;
    getOrCreatePathMappings(propFullPath: string, key?: React.Key): AnyMappingAction[];
    /**
     * If genericMappingAction is undefined, remove all mappings for the path.
     * If key is defined, its assumed the path is mapped to an array
     *
     * @param {string} _fullPath
     * @param {AnyMappingAction | undefined} genericMappingAction
     * @param {React.Key} key
     * @returns {number}
     */
    removePathMapping(_fullPath: string, genericMappingAction: AnyMappingAction | undefined, key?: React.Key): number;
    /**
     * If a state object is removed it will not be mapped directly, but it may have many child properties that are.
     *
     * So, this method iterates through all of the path keys, and deletes any that are children of the state path,
     * i.e., paths that begin with the state path.
     *
     * @param {string} statePath
     * @return {number} # of path entries removed
     */
    removeStatePath(statePath: string): number;
    /**
     * Remove the entire path (and key if present) from the mapping state.
     *
     * @param {string} propPath
     * @param {React.Key} key
     * @returns {boolean}
     */
    removePath(propPath: string, key?: React.Key): number;
}