# Manifold-dx for React

The goal here is to provide Flux mechanics similar to those of Redux, 
while providing the ease of use of MobX.

We get the job done by applying new, TypeScript-first data-driven design approaches.

### The Basic Idea
There are two key capabilities that TypeScript provides that we take advantage of.

1. We can write type-safe, generic updates, that enforce valid property names and value types:
	```typescript jsx
	function update<T, K extends keyof T>(object: T, propertyName: string, newValue: K): void {
	  object[propertyName] = newValue;
	}
	```
	1. Functions like this allow us to write generic API's, using database semantics (update,
	insert and delete), that apply to every piece of application state, so the developer doesn't have to 
	write anything (no action ids, action objects, action creators, reducers or dispatches).

	2. The developer just calls a generic api, and gets all the IDE assistance you'd expect:
	   ![alt text](./docs/api_autocomplete.png)

2. We can define a graph consisting of mutable graph nodes that contain (1) immutable raw data used by 
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

	2. After a state object's property has been changed by an action, their property names can be identified  
	by traversing to the top of the application state, e.g., 'appState.bowler.first'.

	3. Since every piece of the application state has a unique name, we can use it as a key in a map where the
	values contain React components that need to update when that property is changed by an action.  

	4. Our HOC has generic api's for populating the map as well.

	5. If you're not getting the updates you expect after dispatching an action, just look at the map.
3. State changes are performed by pure, invertible functions, so we can undo and redo actions easily.
  1. Updates can be inverted by updating with the previous value
  2. Inserts can be inverted by deletions
  3. Deletions can be inverted by insertions
	 
### Key Features
- Predictable, synchronous single-store state management using pure invertible functions,
  including time-travel.
- Configurable mutation checking for development and testing (prevent accidental mutations outside of actions)   
- Simplified middleware - functions that receive actions, can be ordered before or after 
  actions are performed.
- State can always be represented by a flat mapping using property keys, regardless of how deeply nested.
- Type-safe generic API's eliminate the need to code action types, actions, action creators, reducers.
  Just call the generic API's.
- Immutable React data
- Mutable state application nodes (state objects) 
   
**To Install:**
`npm install --save manifold-dx`   
   
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
- Verifying Hot Module Replacement using manifold-dx in applications
- Adding optional render props to our ContainerComponent (RenderPropComponent)
- Optimizing user-facing API's for ease-of-use
- Real-world apps with Material-UI v1+, Formik, React Router v4
- Organizing state initialization, design, and enforcing structure using TypeScript conditional types 

#### What's Next
- Dev tools, starting with action logging and replay
- Larger, real-world example applications
- More rendering optimizations

