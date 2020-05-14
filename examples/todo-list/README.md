# Todo list

This example models a set of local nodes that can independently add todo list items. If a note `isOnline: bool` we expect it to share updates of its `localDB` with a central authority `hostedDB` for syncing across nodes.

### Running the example

We use [Parcel](https://parceljs.org/) to spin up a development server quickly.

```bash
cd examples/todo-list
yarn && yarn start
```

Open [localhost:1234](http://localhost:1234/).

### Notes

When building out this example, use of `useState` caused some trouble. For example, when a node calls `sendMessages` we need a guarantee that all updates to mutable data made in `applyMessages` are complete before handling a sync. Since state is only concerned about data being updated before the next render, we are not afforded that guarantee. Instead, use of synchronous `localStorage` and refs ensures both the nodes clock and messages that are used as a point of comparison on sync are in order.

It’s likely that there’s a cleaner solution to this problem that may make use of `localStorage` unnecessary, perhaps switching entirely to use of refs or through a different approach to the order of function calls. Ultimately, the key is that when we compute a value, we can consume it before the need for a save.

--

We generate a new client ID on refresh, which is fine since earlier messages from a different node will have been synced with the host and the new node will pick those up on mount.
