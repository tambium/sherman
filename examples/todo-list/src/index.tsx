import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { Node } from "./components/node";
import { GlobalStyle } from "./components/global-style";
import { IMessage, IHostedDB } from "./types";

// export interface ITodo {
//   id: string;
//   text: string;
//   tombstone: number;
// }

const NODE_COUNT = 3;

const initialNodes = new Array(NODE_COUNT).fill(null).map(() => ({
  nodeId: uuidv4(),
}));

export const App = () => {
  const [hostedDB, setHostedDB] = React.useState<IHostedDB>({ messages: [] });
  const [nodes, setNodes] = React.useState(initialNodes);

  const sync = (options?: { messages?: IMessage[] }) => {
    const messages = options?.messages || [];
    const updated = [...hostedDB.messages, ...(messages || [])];
    setHostedDB((prevState) => ({
      ...prevState,
      messages: updated,
    }));
  };

  return (
    <div
      css={{
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {nodes.map((node) => (
        <Node key={node.nodeId} nodeId={node.nodeId} handleSync={sync} />
      ))}
      {!!hostedDB.messages.length && (
        <div
          css={{
            border: "2px solid #0670de",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            padding: 12,
          }}
        >
          {hostedDB.messages
            .filter((el) => el.table === "todos")
            .map((todo) => {
              return <div key={todo.row}>{todo.value}</div>;
            })}
        </div>
      )}
    </div>
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
