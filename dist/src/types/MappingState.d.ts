import { AnyMappingAction } from '../actions/actions';
/**
 * Array maps hold all the mappings associated with an array, including the array itself.
 * Children of the array are reference with number's, and the mapping for the array
 * is referred to by the null key, so the value for the null key should always exist.
 */
export declare type ArrayMap = Map<number | null, AnyMappingAction[]>;
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
export declare type PathMappingValue = AnyMappingAction[] | ArrayMap;
export declare function arrayMapDelete(arrayMap: ArrayMap, index: number, num?: number): AnyMappingAction[];
export declare function arrayMapInsert(arrayMap: ArrayMap, index: number, ...insertedMappingActions: Array<AnyMappingAction[]>): number;
/**
 * Relates application state properties with React components, for the purpose of
 * making components update (ie render).
 *
 */
export declare class MappingState {
    private pathMappings;
    /**
     * Primarily for testing purposes
     * @returns {number}
     */
    getSize(): number;
    getPathMappings(path: string, index?: number | null): AnyMappingAction[] | undefined;
    /**
     * Get (find) or create an array of mapping actions, each of which refer to components (typically to be updated).
     *
     * Note that index === null implies that an array is being directly mapped into a component, as opposed to the
     * more usual case, where index >= 0, meaning that one of its elements is being mapped.
     *
     * @param propFullPath
     * @param index
     */
    getOrCreatePathMapping(propFullPath: string, index?: number | null): AnyMappingAction[];
    getPathMappingsArrayMap(fullpath: string): ArrayMap | undefined;
    /**
     * If mapping action is undefined, remove all mappings for the path.
     * If key is defined, its assumed the path is mapped to an array
     *
     * @param {string} _fullPath
     * @param {AnyMappingAction | undefined} mappingAction
     * @param {number} _index
     * @returns {number}
     */
    removePathMapping(_fullPath: string, mappingAction: AnyMappingAction, _index?: number | null): number;
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
    removeStatePath(statePath: string): number;
    /**
     * Remove the entire path (and key if present) from the mapping state.
     *
     * @param {string} propPath
     * @param {number} index
     * @returns {boolean}
     */
    removePath(propPath: string, index?: number): number;
}
