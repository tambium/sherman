import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { pack, initialize, unpack } from "../../../packages/sherman-clock";
import { difference, IMerkle, insert } from "../../../packages/sherman-merkle";
import { Node } from "./components/node";
import { GlobalStyle } from "./components/global-style";
import { IHostedDB, IMessage, ISyncOptions, IMerkleEntity } from "./types";
import {
  setter,
  hasItem,
  getHostedDB,
  getHostedDBMessages,
  getHostedDBMessagesMerkles,
} from "./utils/localStorage";
import {
  HOSTED_DB,
  HOSTED_MESSAGES,
  HOSTED_MESSAGES_MERKLES,
  LOCAL_TODOS,
} from "./constants";

const NODE_COUNT = 3;

const initialNodes = new Array(NODE_COUNT).fill(null).map(() => ({
  nodeId: uuidv4().replace(/-/g, ""),
}));

const initialState = {
  [HOSTED_MESSAGES]: [],
  [HOSTED_MESSAGES_MERKLES]: [],
};

/**
 * We use state as a layer of abstraction over
 * localStorage through extendedSetter for
 * rendering. localStorage remains the source
 * of truth for comparisons on sync.
 */

export const App = () => {
  const [state, setState] = React.useState<IHostedDB>(initialState);
  const [nodes] = React.useState(initialNodes);

  const extendedSetter = ({
    setterProps,
  }: {
    setterProps: {
      item: string;
      obj: {
        [HOSTED_MESSAGES]: IMessage[];
        [HOSTED_MESSAGES_MERKLES]: IMerkle[];
      };
    };
  }) => {
    setState(setterProps.obj);
    return setter(setterProps.item, setterProps.obj);
  };

  React.useEffect(() => {
    if (!hasItem(HOSTED_DB)) {
      extendedSetter({ setterProps: { item: HOSTED_DB, obj: initialState } });
    }
  }, []);

  const getMerkle = (groupId: string): IMerkle | {} => {
    const rows: IMerkleEntity[] = (getHostedDBMessagesMerkles() || []).filter(
      (merkle: IMerkleEntity) => {
        return merkle.groupId === groupId;
      }
    );
    return rows.length ? JSON.parse(rows[0].merkle) : {};
  };

  const addMessages = (groupId: string, messages: IMessage[]): IMerkle => {
    let trie: IMerkle = getMerkle(groupId);

    for (let message of messages) {
      const { timestamp } = message;
      const check = (getHostedDBMessages() || []).findIndex((msg: IMessage) => {
        return `${groupId}:${msg.timestamp}` === `${groupId}:${timestamp}`;
      });

      if (check === -1) {
        extendedSetter({
          setterProps: {
            item: HOSTED_DB,
            obj: {
              ...getHostedDB(),
              [HOSTED_MESSAGES]: [...(getHostedDBMessages() || []), message],
            },
          },
        });
        trie = insert({ clock: unpack(timestamp), trie });
      }

      const insertOrReplace = (arr: IMerkleEntity[], item: IMerkleEntity) => {
        const cp = [...arr];
        const id = cp.findIndex((el) => el.groupId === item.groupId);
        if (id > -1) cp[id] = item;
        else cp.push(item);
        return cp;
      };

      extendedSetter({
        setterProps: {
          item: HOSTED_DB,
          obj: {
            ...getHostedDB(),
            [HOSTED_MESSAGES_MERKLES]: [
              ...insertOrReplace(getHostedDBMessagesMerkles() || [], {
                groupId,
                merkle: JSON.stringify(trie),
              }),
            ],
          },
        },
      });
    }
    return trie;
  };

  const sync = (options: ISyncOptions) => {
    const messages = options.messages || [];
    const trie = addMessages(options.groupId, messages);

    let newMessages: IMessage[] = [];
    if (options.merkle) {
      let diffTime = difference(trie, options.merkle);
      if (diffTime) {
        let timestamp = initialize({ nodeId: options.clientId, now: diffTime });
        newMessages = getHostedDBMessages().filter((message: IMessage) => {
          return (
            message.timestamp > pack(timestamp) &&
            unpack(message.timestamp).nodeId !== options.clientId
          );
        });
      }
    }

    // mock API response
    return {
      status: "ok",
      data: {
        messages: newMessages,
        merkle: trie,
      },
    };
  };

  const clearStorage = () => {
    localStorage.clear();
    setState(initialState);
    location.reload();
  };

  return (
    <div css={{ alignItems: "flex-start", display: "flex" }}>
      <div css={{ display: "flex", marginRight: 8 }}>
        <button onClick={clearStorage}>Clear</button>
      </div>
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          marginLeft: 8,
          marginRight: 8,
        }}
      >
        {nodes.map((node) => (
          <Node key={node.nodeId} nodeId={node.nodeId} handleSync={sync} />
        ))}
      </div>
      <div css={{ marginLeft: 8 }}>
        {getHostedDB() &&
          getHostedDBMessages() &&
          !!getHostedDBMessages().length && (
            <div
              css={{
                border: "2px solid #0670de",
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                padding: 12,
              }}
            >
              {getHostedDBMessages()
                .filter((el: IMessage) => el.table === LOCAL_TODOS)
                .map((todo: IMessage) => {
                  return (
                    <div
                      key={todo.row}
                      css={{
                        border: "2px solid #C0C8D2",
                        borderRadius: 4,
                        padding: 12,
                        "&:not(:last-child)": {
                          marginBottom: 8,
                        },
                      }}
                    >
                      <div css={{ fontSize: 10 }}>{todo.row}</div>
                      <div css={{ fontSize: 10 }}>{todo.timestamp}</div>
                      <div>{todo.value}</div>
                    </div>
                  );
                })}
            </div>
          )}
      </div>
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
