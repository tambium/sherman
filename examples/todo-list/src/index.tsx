import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { Node } from "./components/node";
import { GlobalStyle } from "./components/global-style";

export interface ITodo {
  id: string;
  text: string;
  tombstone: number;
}

const NODE_COUNT = 3;

const initialNodes = new Array(NODE_COUNT).fill(null).map(() => ({
  nodeId: uuidv4(),
}));

export const App = () => {
  const [todos, setTodos] = React.useState<ITodo[]>([]);
  const [nodes, setNodes] = React.useState(initialNodes);

  return (
    <React.Fragment>
      <div
        css={{
          alignItems: "flex-start",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {nodes.map((node) => (
          <Node key={node.nodeId} nodeId={node.nodeId} />
        ))}
      </div>
      <div>
        {todos.map((todo) => (
          <div key={todo.id}>{todo.id}</div>
        ))}
      </div>
    </React.Fragment>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.Fragment>
    <GlobalStyle />
    <App />
  </React.Fragment>,
  rootElement
);
