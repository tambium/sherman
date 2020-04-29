# Hello world

This example utilizes core `Clock` functions like `initialize`, `send` and `receive` to build a system similar to that outlined in the [HLC paper](https://cse.buffalo.edu/tech-reports/2014-04.pdf).

### Running the example

We use [Parcel](https://parceljs.org/) to spin up a development server quickly.

```bash
cd examples/hello-world
yarn && yarn start
```

Open [localhost:1234](http://localhost:1234/).

### Notes

> A distributed system consists of a set of nodes whose number may change over time. Each node can perform three types of actions, a send action, a receive action, and a local action. The goal of a timestamping algorithm is to assign a timestamp to each event.

In practice, our `logical` would most likely be a `Date.now()` instance but by simplifying to arbitrary numeric values we can more easily test cases where our physical time has caught up or gone ahead of `logical` on another node.

Remember, `logical` captures the maximum physical time learned so far and our `counter` is used for capturing causality updates only when `logical` values are equal. We can reset `counter` when information heard about maximum physical time catches up or goes ahead of `logical`.
