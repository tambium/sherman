import React from "react";
import ReactDOM from "react-dom";
import { v5 as uuidv5 } from "uuid";
import { pack, initialize, unpack } from "../../../packages/sherman-clock";
import { difference, IMerkle, insert } from "../../../packages/sherman-merkle";
import { Node } from "./components/node";
import { GlobalStyle } from "./components/global-style";
import { IHostedDB, IMessage, ISyncOptions, IMerkleEntity } from "./types";
import {
  setter,
  getter,
  getHostedMessages,
  hasItem,
} from "./utils/localStorage";
import {
  HOSTED_DB,
  HOSTED_MESSAGES,
  HOSTED_MESSAGES_MERKLES,
  LOCAL_TODOS,
} from "./constants";

const NODE_COUNT = 3;
const TODO_NAMESPACE = "d697ecc7-6bd7-49f9-a954-c52faba4ff9b";

const initialNodes = new Array(NODE_COUNT).fill(null).map((_, idx) => ({
  nodeId: uuidv5(String(idx), TODO_NAMESPACE).replace(/-/g, ""),
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
  React.useEffect(() => {
    if (!hasItem(HOSTED_DB)) {
      const base = {
        [HOSTED_MESSAGES]: [],
        [HOSTED_MESSAGES_MERKLES]: [],
      };
      setter(HOSTED_DB, base);
    }
  }, []);

  const [nodes] = React.useState(initialNodes);

  const getMerkle = (groupId: string): IMerkle | {} => {
    const messagesMerkles: IMerkleEntity[] = getter(HOSTED_DB)[
      HOSTED_MESSAGES_MERKLES
    ];
    const rows: IMerkleEntity[] = messagesMerkles.filter(
      (merkle) => merkle.groupId === groupId
    );
    return rows.length ? JSON.parse(rows[0].merkle) : {};
  };

  const addMessages = (groupId: string, messages: IMessage[]): IMerkle => {
    let trie: IMerkle = getMerkle(groupId);

    const hostedDB = getter(HOSTED_DB);
    const hostedDBMessages: IMessage[] = hostedDB[HOSTED_MESSAGES];
    const hostedDBMessagesMerkles: IMerkle[] =
      hostedDB[HOSTED_MESSAGES_MERKLES];

    for (let message of messages) {
      const { column, table, row, timestamp, value } = message;
      const check = hostedDBMessages.findIndex(
        (msg) => `${groupId}:${msg.timestamp}` === `${groupId}:${timestamp}`
      );

      if (check === -1) {
        setter(HOSTED_DB, {
          ...hostedDB,
          [HOSTED_MESSAGES]: [...hostedDBMessages, message],
        });
        trie = insert({ clock: unpack(timestamp), trie });
      }

      setter(HOSTED_DB, {
        ...hostedDB,
        [HOSTED_MESSAGES_MERKLES]: [
          ...hostedDBMessagesMerkles,
          { groupId, merkle: JSON.stringify(trie) },
        ],
      });
    }
    return trie;
  };

  const sync = (options: ISyncOptions) => {
    const messages = options.messages || [];
    const trie = addMessages(options.groupId, messages);

    const hostedDB = getter(HOSTED_DB);
    const hostedDBMessages: IMessage[] = hostedDB[HOSTED_MESSAGES];

    setter(HOSTED_DB, {
      ...hostedDB,
      [HOSTED_MESSAGES]: [...hostedDBMessages, ...(messages || [])],
    });

    let newMessages: IMessage[] = [];
    if (options.merkle) {
      let diffTime = difference(trie, options.merkle);
      if (diffTime) {
        let timestamp = initialize({ nodeId: options.clientId, now: diffTime });

        const msgs: IMessage[] = getter(HOSTED_DB)[HOSTED_MESSAGES];
        newMessages = msgs.filter(
          (message) =>
            message.timestamp > pack(timestamp) &&
            timestamp.nodeId !== options.clientId
        );
      }
    }

    return {
      messages: newMessages,
      merkle: trie,
    };
  };

  const messages = getHostedMessages();

  return (
    <div
      css={{
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div css={{ display: "flex" }}>
        <button onClick={() => localStorage.clear()}>Clear LS</button>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
      {nodes.map((node) => (
        <Node key={node.nodeId} nodeId={node.nodeId} handleSync={sync} />
      ))}
      {messages && !!messages.length && (
        <div
          css={{
            border: "2px solid #0670de",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            padding: 12,
          }}
        >
          {messages
            .filter((el) => el.table === LOCAL_TODOS)
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
