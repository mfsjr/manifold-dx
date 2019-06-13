# Manifold-dx for React

The goal here is to provide Flux mechanics similar to Redux, offering developers something
much simpler to use, where they never have to define action ID's, action objects or creators,
reducers, etc.

The main tools Redux uses are immutability and functional programming.  TypeScript allows us 
to implement Flux differently, using strongly typed data structures and generics, offering a hugely 
simplified developer experience.

### The Basic Idea
There are two key capabilities that TypeScript provides that we take advantage of.

1. **Generics** We can write type-safe, generic updates, that enforce valid property names and value types:
	```typescript jsx
	function update<T, K extends keyof T>(object: T, propertyName: string, newValue: K): void {
	  object[propertyName] = newValue;
	}
	```
	1. Functions like this allow us to write generic API's, using database semantics (update,
	insert and delete), that apply to every piece of application state, so the developer doesn't have to 
	write anything (no action ids, action objects, action creators, reducers or dispatch).

	2. The developer just calls a generic api, and gets all the IDE assistance you'd expect:
	   ![alt text](./docs/api_autocomplete.png)

1. **Strongly Typed Data Structures** 
	1. We can define a graph consisting of mutable graph nodes that contain (1) immutable raw data used by 
	React, and (2) other mutable graph nodes.  TypeScript forces this to be done in a type-safe, reliable way, 
	using plain objects: 

	```typescript jsx
	export interface Bowler extends StateObject {
	  // properties of the StateObject
	  // parent in the state application graph
	  _parent: StateObject | null;
	  // parent's name for this object, ie this === this._parent[this._myPropname]
	  _myPropname: string;
	  // raw data properties
	  first: string;
	  middle: string;
	  last: string;
	  address: Address;
	  scores: number[];
	}
	```
	1. So a developer can use TypeScript to define a state application object graph:
	   ![alt text](./docs/stateDiagram.png)   

	1. After a state object's property has been changed by an action, their property names can be identified  
	by traversing to the top of the application state, e.g., 'appState.bowler.first'.

	1. Since every piece of the application state has a unique name, we can use it as a key in a map where the
	values contain React components that need to update when that property is changed by an action.  

	1. Our container component has generic api's for populating the map as well.

	1. If you're not getting the updates you expect after dispatching an action, just look at the map.
1. State changes are performed by pure, invertible functions, so we can undo and redo actions easily.
  1. Updates can be inverted by updating with the previous value
  1. Inserts can be inverted by deletions
  1. Deletions can be inverted by insertions
1. The **set api** is the simplest way to create actions, so you don't have to concern yourself about 
   the particular kind of action (eg update vs insert) or whether the new value is the same as the old.
   So for example, if the values are the same, the resulting action is just a no-op, and never gets dispatched.  
	 
### Key Features
- Predictable, synchronous single-store state management using pure invertible functions,
  allowing for 'time-travel'.
- Strict mode, which will throw errors if state is mutated other than by actions (careful - development only!)   
- Simplified middleware - developer-provided functions can be invoked before or after actions are dispatched.
- ActionLoggingObject interface and actionLogging implementation to be used by middleware
  actions are performed.
- Type-safe generic api's mean developers never code any action types, actions, action creators, reducers, etc.
- Render props
- React Router (v4) integration via RedirectDx [https://github.com/mfsjr/manifold-dx-redirect-dx]

### Prior Art
Obviously Redux has been our frame of reference, but Vuex should be mentioned, as it influenced this design in
a couple of ways:
- State is synchronous, async aspects should be handled elsewhere (separation of concerns).
- Since state is global, we have no need for declarative/nested access, we just declare it globally, eg:
	`export const appStore = new AppStore(new AppStateCreator().appState, {});`

Also note, a coincidental similarity with Vuex is a somewhat nested/compositional approach to state, as opposed 
to Redux's preferred 'flat' shape.


**To Install:**
`npm install --save manifold-dx`   

### Defining Application State

This is really "job #1" for developers anyway, so manifold-dx just piggybacks on top of your usual efforts.

Note that application state is by definition dynamic, whether you're talking about asynchronously retrieving or 
modifying data, or all the way down to the coding level, where state may be assigned to an object on a line-by-line basis.

For these reasons, for anything more complicated than a demo (i.e., real-world apps), we typically define all state 
to be optional, e.g., the user below:

```typescript jsx
interface AppState {
  user?: {
    name: string;
  };
}
```

Note that manifold-dx requires that you define your state container objects as objects that implement the 
StateObject interface.  All this means is that they must have two properties...
1. _parent - the parent state object, or null if it is the top/root level application state container
2. _myPropname - the name of the container, such that `this._parent[this._myPropname] === this`

There are helpers provided by manifold-dx to enforce these relationships, namely the State interface.  This 
allows you to define these StateObjects in a way that enforces parent-child relationships, including the
top/root level application state.  For example:
```typescript jsx
export interface AppState extends AppData, State<null> { }
export interface NavState extends Nav, State<AppState> { }
export interface DrawerState extends DrawerProps, State<NavState> { }
export interface FetchState extends FetchData<any>, State<AppState> { }
```
For this example we don't care about (or provide) the details of the various interfaces (AppState, NavState, etc), 
the things to notice are:
1. Top level app state is indicated by the <null> generic (makes sense since its parent is null)
2. Nested state objects refer to the type of their parent, eg `interface NavState extends Nav, State<AppState>
   
#### Demo Apps
- See the todo app at [https://github.com/mfsjr/manifold-dx-todo](https://github.com/mfsjr/manifold-dx-todo). 
- See array api's in action at [https://github.com/mfsjr/manifold-dx-editor](https://github.com/mfsjr/manifold-dx-editor)

**Run Tests:** `npm test --runInBand REACT_APP_STATE_MUTATION_CHECKING=true` 
- `runInBand` since we need to have tests execute in order
- and we want REACT_APP_STATE_MUTATION_CHECKING on when testing or debugging.
  - this will also turn on state diff output, when mutations are detected
  
#### Building an App
- Look at our demo apps, these are built with create-react-app and react-script-ts.
 
#### Recent work has centered on:
- Real world apps using... 
  - Hot Module Replacement
  - Material-UI v1+, Formik, React Router v4
  - action logging
- Adding optional render props to our ContainerComponent (RenderPropComponent)
- Optimizing user-facing API's for ease-of-use
- Organizing state initialization, design, and enforcing structure using TypeScript conditional types 

#### What's Next
- Dev tools for action replay
- Larger, real-world example applications
- More rendering optimizations

