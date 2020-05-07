import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Clock,
  initialize,
  pack,
  send,
  unpack,
} from "../../../../../packages/sherman-clock";
import { insert } from "../../../../../packages/sherman-merkle";
import { ILocalDB, IMessage, IRow, ISyncOptions, ITodo } from "../../types";
import {
  hasItem,
  getLocalDB,
  setter,
  constructLocalDB,
} from "../../utils/localStorage";
import { isEmpty } from "../../utils/objects";
import { LOCAL_MESSAGES, LOCAL_TABLES, LOCAL_TODOS } from "../../constants";

interface NodeProps {
  handleSync: (options?: ISyncOptions) => void;
  nodeId: string;
}

type Inputs = {
  title: string;
};

const initialInputValues: Inputs = {
  title: "init",
};

const generateMessages = (
  clock: Clock,
  table: string,
  row: IRow
): IMessage[] => {
  const id = uuidv4();
  const fields = Object.keys(row);

  return fields.map((key) => ({
    column: key,
    table,
    row: row.id || id,
    timestamp: pack(send({ localClock: clock, now: Date.now() })),
    value: row[key],
  }));
};

export const Node: React.FC<NodeProps> = ({ handleSync, nodeId }) => {
  React.useEffect(() => {
    if (isEmpty(getLocalDB(nodeId))) {
      const base = {
        [LOCAL_MESSAGES]: [],
        [LOCAL_TABLES]: {
          [LOCAL_TODOS]: [],
        },
      };
      setter(constructLocalDB(nodeId), base);
    }
  }, []);

  const isMounted = React.useRef(false);
  const node = React.useRef({
    clock: initialize({
      nodeId,
      now: Date.now(),
    }),
    merkle: {},
  });

  const [isOnline, setOnline] = React.useState(true);
  const [inputs, setInputs] = React.useState(initialInputValues);

  React.useEffect(() => {
    if (isMounted.current && isOnline) {
      handleSync();
    } else {
      isMounted.current = true;
    }
  }, [isOnline]);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const compareMessages = (messages: IMessage[]) => {
    let existingMessages = new Map();
    /**
     * positive: second sorted before first
     * negative: first sorted before second
     * zero: no changes are made to sort order
     */
    const localDB = getLocalDB(nodeId);
    const localMessages = localDB[LOCAL_MESSAGES];

    let sortedMessages = [...localMessages].sort((first, second) => {
      if (first.timestamp < second.timestamp) return 1;
      else if (first.timestamp > second.timestamp) return -1;
      return 0;
    });
    messages.forEach((message) => {
      let existingMessage = sortedMessages.find(
        (instance) =>
          message.table === instance.table &&
          message.row === instance.row &&
          message.column === instance.column
      );
      existingMessages.set(message, existingMessage);
    });

    return existingMessages;
  };

  const apply = (message: IMessage) => {
    const localDB = getLocalDB(nodeId);
    const table = localDB[LOCAL_TABLES][message.table];

    if (!table) throw new Error(`Table \`${message.table}\` does not exist.`);

    const row = table.find((row: IRow) => row.id === message.row);

    if (!row) {
      const localDB = getLocalDB(nodeId);
      const localTables = localDB[LOCAL_TABLES];

      const updated = [...table];
      updated.push({
        id: message.row,
        [message.column]: message.value,
      });

      setter(constructLocalDB(nodeId), {
        ...localDB,
        [LOCAL_TABLES]: {
          ...localTables,
          [message.table]: updated,
        },
      });
    } else {
      const localDB = getLocalDB(nodeId);
      const localTables = localDB[LOCAL_TABLES];

      const updated = [...table];
      updated[message.column] = message.value;

      setter(constructLocalDB(nodeId), {
        ...localDB,
        [LOCAL_TABLES]: {
          ...localTables,
          [message.table]: updated,
        },
      });
    }
  };

  const applyMessages = (messages: IMessage[]) => {
    const existingMessages = compareMessages(messages);
    messages.forEach((message) => {
      let existingMessage = existingMessages.get(message);
      if (!existingMessage || existingMessage.timestamp < message.timestamp) {
        apply(message);
      }

      if (!existingMessage || existingMessage.timestamp !== message.timestamp) {
        node.current = {
          ...node.current,
          merkle: insert({
            clock: unpack(message.timestamp),
            trie: node.current.merkle,
          }),
        };

        const localDB = getLocalDB(nodeId);
        const localMessages = localDB[LOCAL_MESSAGES];
        setter(constructLocalDB(nodeId), {
          ...localDB,
          [LOCAL_MESSAGES]: [...localMessages, message],
        });
      }
    });
  };

  const sync = (initialMessages: IMessage[] = []) => {
    if (!isOnline) return;
    let messages = initialMessages;
    const result = handleSync({
      clientId: node.current.clock.nodeId,
      groupId: "default",
      messages,
      merkle: node.current.merkle,
    });
  };

  const sendMessages = (messages: IMessage[]) => {
    applyMessages(messages);
    sync(messages);
  };

  const addTodo = () => {
    if (inputs.title === "") return;
    const messages = generateMessages(node.current.clock, LOCAL_TODOS, {
      title: inputs.title,
    });
    sendMessages(messages);
  };

  /**
   *
   * submit todo
   * generate array of `messages` from each `row`
   *    {column: "title", row: "0695755e-c240-45b2-9b40-8b86f18baad4", table: "todos", timestamp: ...}]
   *
   * apply the new messages
   *    sort existing messages
   *    for each new message, check if any existing message shares `table`, `row` and `column` fields
   *
   *    if no existing message OR existing message timestamp before new message timestamp
   *        `apply` the message
   *            either add the message to `localDB` table state or update existing message in `localDb` table state
   *
   *    if no existing message OR existing message timestamp DOES NOT EQUAL new message timestamp (near enough all cases...)
   *        update the `merkle` associated with the `node` in state [?]
   *        set the `messages` in `localDB` state [?]
   *
   *
   *
   */

  const localDB = getLocalDB(nodeId);

  return (
    <div
      css={{
        border: "2px solid #8691A1",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        padding: 12,
        "&:not(:last-child)": {
          marginBottom: 8,
        },
      }}
    >
      <span css={{ marginBottom: 8 }}>
        <span css={{ fontWeight: 600 }}>nodeId:</span>
        {nodeId}
      </span>
      <div css={{ marginBottom: 8 }}>
        <label css={{ fontWeight: 600 }} htmlFor="online">
          isOnline:
        </label>
        <input
          checked={isOnline}
          name="online"
          onChange={() => setOnline((prevState) => !prevState)}
          type="checkbox"
        />
      </div>
      <div css={{ alignItems: "center", display: "flex", marginBottom: 8 }}>
        <label css={{ fontWeight: 600 }} htmlFor="logical">
          logical:
        </label>
        <input name="logical" readOnly value={node.current.clock.logical} />
      </div>
      <div>
        <label css={{ fontWeight: 600 }} htmlFor="addTodo">
          addTodo:
        </label>
        <input
          name="title"
          onChange={handleInputChange}
          placeholder="Add todo&hellip;"
          value={inputs.title}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      {localDB &&
        localDB[LOCAL_TABLES] &&
        localDB[LOCAL_TABLES][LOCAL_TODOS] &&
        !!localDB[LOCAL_TABLES][LOCAL_TODOS].length && (
          <div
            style={{
              border: "2px solid #C0C8D2",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              marginTop: 8,
              padding: 12,
            }}
          >
            {localDB[LOCAL_TABLES][LOCAL_TODOS].map((todo: ITodo) => {
              return <div key={todo.id}>{todo.title}</div>;
            })}
          </div>
        )}
    </div>
  );
};
