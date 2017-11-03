import { IObservableArray } from 'mobx';
import { types, flow, onSnapshot, ISnapshottable, IModelType, IComplexType } from 'mobx-state-tree';
import { mst, shim, action, ModelInterface } from '..';

const TodoData = shim(types.model({
	title: types.string,
	done: false
}));

class TodoCode extends TodoData {

	@action
	toggle() {
		this.done = !this.done;
	}

	@action
	print() {
		console.log(this.done);
	}

}

const Todo = mst(TodoCode, TodoData);

const SpecialTodoData = shim(
	Todo.props({
		count: types.optional(types.number, 0)
	}),
	Todo
);

class SpecialTodoCode extends SpecialTodoData {

	@action
	toggle(increment = 1) {
		this.count += increment;
		console.log('Toggled ' + this.title + ' ' + this.count + ' times!');
		super.toggle();
	}

}

const SpecialTodo = mst(SpecialTodoCode, SpecialTodoData);

const Store = types.model({
	todos: types.array(SpecialTodo)
});

const store = Store.create({
	todos: [
		{ title: 'Foo' },
		{ title: 'Bar' }
	]
});

onSnapshot(store, (snapshot) => {
	console.log(snapshot)
})

store.todos[0].toggle();
store.todos[1].toggle();
store.todos[1].toggle(99);

store.todos[0].print();
store.todos[1].print();

const AsyncData = shim(types.model({}));

class AsyncCode extends AsyncData {

	@action
	run() {
		function* generate() {
			yield Promise.resolve('This gets lost');
			return('Returned value');
		}

		return(flow(generate)());
	}

}

const Async = mst(AsyncCode, AsyncData);

Async.create().run().then(
	(result) => console.log(result)
);

export const NodeData = shim(types.model({

	// Non-recursive members go here, for example:
	id: ''

}));

export class NodeCode extends NodeData {

	// Example method. Note how all members are available and fully typed,
	// even if recursively defined.

	getChildIDs() {
		for(let child of this.children || []) {
			if(child.children) child.getChildIDs();
			if(child.id) console.log(child.id);
		}
	}

	// Recursive members go here first.
	children?: Node[];

}

export const NodeBase = mst(NodeCode, NodeData);
export type NodeBase = typeof NodeBase.Type;

// Interface trickery to avoid compiler errors when defining a recursive type.
export interface NodeObservableArray extends IObservableArray<NodeRecursive> {}

export interface NodeRecursive extends NodeBase {

	// Recursive members go here second.
	children: NodeObservableArray

}

export interface NodeArray extends IComplexType<
	(typeof NodeBase.SnapshotType & {

		// Recursive members go here third.
		children: any[]

	})[],
	NodeObservableArray
> {}

export const Node = NodeBase.props({

	// Recursive members go here fourth.
	children: types.maybe(types.array(types.late((): any => Node)) as NodeArray),

});

export type Node = typeof Node.Type;

const tree = Node.create({
	children: [
		{ children: [ { id: 'TEST' } ] }
	]
});

// Both print: TEST
console.log(tree.children![0].children![0].id);
tree.getChildIDs();
