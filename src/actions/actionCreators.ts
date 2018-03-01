import { StateObject } from '../';
import { Action, ActionId, ArrayMutateAction, StateCrudAction } from './actions';

export class CrudActionCreator<S extends StateObject> {
  private parent: S;
  private propertyKey: keyof S;
  constructor(parent: S, propertyKey: keyof S) {
    this.parent = parent;
    this.propertyKey = propertyKey;
  }

  public crudInsert(value: S[keyof S]): Action {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
  }
  public crudUpdate(value: S[keyof S]): Action {
    return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
  }
  public crudDelete(): Action {
    return new StateCrudAction(
      ActionId.DELETE_PROPERTY,
      this.parent, this.propertyKey, this.parent[this.propertyKey]);
  }
  public crudNest(value: S[keyof S]): Action {
    return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.parent, this.propertyKey, value);
  }
  public crudUnnest(value: S[keyof S]): Action {
    return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.parent, this.propertyKey, value);
  }
}

export class ArrayCrudActionCreator<S extends StateObject, V> {
  private parent: S;
  private propertyKey: keyof S;

  private valuesArray: Array<V> & keyof S[keyof S];

  /**
   * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
   * parameter in order to provide TypeScript with a strongly typed object that
   * we can use in conjunction with a typeguard so that we the property value is an
   * appropriately typed array.
   *
   * There may be some TS experts out there who know how to do this, but this appears
   * to be outside of the capabilities of 2.7 judging by the docs.
   *
   * Recent PR's targeted for 2.8 may change this, see https://github.com/Microsoft/TypeScript/pull/21496
   *
   * @param {S} parent
   * @param {keyof S} propertyKey
   * @param {Array<V>} valuesArray
   */
  constructor(parent: S, propertyKey: keyof S, valuesArray: Array<V>) {
    this.parent = parent;
    this.propertyKey = propertyKey;
    // this.valuesArray = valuesArray;
    /* tslint:disable:no-any */
    let p: any = this.parent[this.propertyKey];
    let ra: any = valuesArray;
    /* tslint:enable:no-any */
    if (p === ra) { // typeguard appears to work
      this.valuesArray = ra;
    } else {
      throw new Error(`Array must be ${this.propertyKey} of the parent`);
    }
  }

  public insert(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }
  public update(index: number, value: V): Action {
    return new ArrayMutateAction(
      ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
  }
  public delete(index: number): Action {
    return new ArrayMutateAction(
      ActionId.DELETE_PROPERTY,
      this.parent, this.propertyKey, index, this.valuesArray, undefined);
  }
}

// export class MappingActionCreator {
//   constructor
// }

// import { StateObject } from '../';
// import { ActionId, ArrayMutateAction, StateAction, StateCrudAction } from './actions';

// export interface CrudArrayAction<S extends StateObject, V> {
//   index: number;
//   insert: (value: V) => StateAction<S>;
//   update: (value: V) => StateAction<S>;
//   delete: () => StateAction<S>;
// }
//
// export interface CrudAction<S extends StateObject> {
//   insert: (value: S[keyof S]) => StateAction<S>;
//   delete: () => StateAction<S>;
//   nest: (value: S[keyof S] & StateObject) => StateAction<S>;
//   unnest: (value: S[keyof S] & StateObject) => StateAction<S>;
//
//   update: (value: S[keyof S]) => StateAction<S>;
//   array: <V>(index: number) => CrudArrayAction<S, V>;
// }

// export class ActionCreator<S extends StateObject> {
//   private stateObject: S;
//   private propertyName: keyof S;
//
//   /**
//    *
//    * @param {S} stateObject the state object containing the property, could be app state or be nested in app state
//    * @param {keyof S} propertyName
//    */
//   constructor(stateObject: S, propertyName: keyof S) {
//     this.stateObject = stateObject;
//     this.propertyName = propertyName;
//   }
//
//   public crudInsert(value: S[keyof S]) {
//     return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, value);
//   }
//   public crudUpdate(value: S[keyof S]) {
//     return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, value);
//   }
//   public crudDelete() {
//     return new StateCrudAction(
//       ActionId.DELETE_PROPERTY,
//       this.stateObject, this.propertyName, this.stateObject[this.propertyName]);
//   }
//   public crudNest(value: S[keyof S]) {
//     return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.stateObject, this.propertyName, value);
//   }
//   public crudUnnest(value: S[keyof S]) {
//     return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.stateObject, this.propertyName, value);
//   }
//   public crudArrayInsert<V>(index: number, value: V) {
//     let propertyValue = this.stateObject[this.propertyName];
//     if (propertyValue instanceof Array) {
//       let ra: Array<V> = propertyValue;
//       return new ArrayMutateAction(ActionId.INSERT_PROPERTY, this.stateObject, this.propertyName, index, ra, value);
//     } else {
//       throw new Error(`property value is not an array!`);
//     }
//
//   }
//   public crudArrayUpdate<V>(index: number, value: V) {
//     let propertyValue = this.stateObject[this.propertyName];
//     if (propertyValue instanceof Array) {
//       let ra: Array<V> = propertyValue;
//       return new ArrayMutateAction(
//         ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, index, ra, value);
//     } else {
//       throw new Error(`property value is not an array!`);
//     }
//
//   }
//   public crudArrayDelete(index: number) {
//     let propertyValue = this.stateObject[this.propertyName];
//     if (propertyValue instanceof Array) {
//
//       let ra: Array<any> = propertyValue;
//       return new ArrayMutateAction(
//         ActionId.DELETE_PROPERTY, this.stateObject, this.propertyName, index, ra, undefined);
//     } else {
//       throw new Error(`property value is not an array!`);
//     }
//   }

  // public crud(): CrudAction<S> {
  //   let result: CrudAction<S> = {
  //     insert: (value: S[keyof S]) =>  {
  //       return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, value);
  //     },
  //     update: (value: S[keyof S]) => {
  //       return new StateCrudAction(ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, value);
  //     },
  //     delete: () => {
  //       return new StateCrudAction(
  //         ActionId.DELETE_PROPERTY,
  //         this.stateObject, this.propertyName, this.stateObject[this.propertyName]);
  //     },
  //     nest: (value: S[keyof S]) =>  {
  //       return new StateCrudAction(ActionId.INSERT_STATE_OBJECT, this.stateObject, this.propertyName, value);
  //     },
  //     unnest: (value: S[keyof S]) => {
  //       return new StateCrudAction(ActionId.DELETE_STATE_OBJECT, this.stateObject, this.propertyName, value);
  //     },
  //     array: <V>(index: number) => {
  //      
  //       let result2: CrudArrayAction<S, V> = {
  //         index: index,
  //         insert: (value: V) => {
  //           return new ArrayMutateAction(
  //              ActionId.INSERT_PROPERTY, this.stateObject, this.propertyName, index, value);
  //         },
  //         update: (value: V) => {
  //           return new ArrayMutateAction(
  //             ActionId.UPDATE_PROPERTY, this.stateObject, this.propertyName, index, value);
  //         },
  //         delete: () => {
  //           return new ArrayMutateAction(
  //             ActionId.DELETE_PROPERTY, this.stateObject, this.propertyName, index, undefined);
  //         },
  //       };
  //       return result2;
  //     }
  //   };
  //   return result;
  // }
// }