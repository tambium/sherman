import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { pack } from "../../../packages/sherman-clock";
import { Node } from "./components/node";
import { GlobalStyle } from "./components/global-style";
import { IHostedDB, IMessage, ISyncOptions, IMerkle } from "./types";

const NODE_COUNT = 3;

const initialNodes = new Array(NODE_COUNT).fill(null).map(() => ({
  nodeId: uuidv4(),
}));

/**
 * sync
 *    called in backgroundSync
 *        uses setInterval to call sync every 4000ms
 *        called on initialization
 *        called when toggled back online
 *    called when sync button pressed
 *    called in sendMessages
 *        called in insert, update and delete
 *    called within itself if diffTime
 */

export const App = () => {
  const [hostedDB, setHostedDB] = React.useState<IHostedDB>({
    messages: [],
    messagesMerkles: [],
  });
  const [nodes, setNodes] = React.useState(initialNodes);

  const getMerkle = (groupId: string): string => {
    const rows = hostedDB.messagesMerkles.filter(
      (merkle) => merkle.groupId === groupId
    );
    return rows.length ? rows[0].merkle : "";
  };

  const addMessages = (groupId: string, messages: IMessage[]) => {
    const trie = getMerkle(groupId);
    for (let message of messages) {
      const { column, groupId, table, row, timestamp, value } = message;
      let res;
      const check = hostedDB.messages.findIndex(
        (msg) =>
          `${msg.groupId}:${pack(msg.timestamp)}` ===
          `${groupId}:${pack(timestamp)}`
      );

      if (check === -1) {
        setHostedDB((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, message],
        }));
        // TODO...
      }
      // PRIMARY KEY(timestamp, groupId));
    }
  };

  const sync = (options: ISyncOptions) => {
    const messages = options.messages || [];
    const trie = addMessages(options.groupId, messages);

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
