import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Clock, initialize, send } from "../../../../../packages/sherman-clock";
import { ILocalDB, IMessage, IRow, ISyncOptions } from "../../types";

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

const generateMessages = (clock: Clock, table: string, row: IRow) => {
  const id = uuidv4();
  const fields = Object.keys(row);

  return fields.map((key) => ({
    column: key,
    table,
    row: row.id || id,
    timestamp: send({ localClock: clock, now: Date.now() }),
    value: row[key],
  }));
};

export const Node: React.FC<NodeProps> = ({ handleSync, nodeId }) => {
  const isMounted = React.useRef(false);
  const [isOnline, setOnline] = React.useState(true);
  const [localDB, setLocalDB] = React.useState<ILocalDB>({
    messages: [],
    tables: {
      todos: [],
    },
  });
  const [inputs, setInputs] = React.useState(initialInputValues);
  const [clock, setClock] = React.useState(
    initialize({
      nodeId,
      now: Date.now(),
    })
  );

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
    let sortedMessages = [...localDB.messages].sort((first, second) => {
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
    const table = localDB.tables[message.table];
    if (!table) throw new Error(`Table \`${message.table}\` does not exist.`);

    const row = table.find((row) => row.id === message.row);

    if (!row) {
      const updated = [...table];
      updated.push({
        id: message.row,
        [message.column]: message.value,
      });
      setLocalDB((prevState) => ({
        ...prevState,
        tables: {
          ...prevState.tables,
          [message.table]: updated,
        },
      }));
    } else {
      const updated = [...table];
      updated[message.column] = message.value;
      setLocalDB((prevState) => ({
        ...prevState,
        tables: {
          ...prevState.tables,
          [message.table]: updated,
        },
      }));
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
        // TODO: add to merkle
        setLocalDB((prevState) => ({
          ...prevState,
          messages: [...prevState.messages, message],
        }));
      }
    });

    // TODO: handle sync (onSync) -- may just be re-render?
  };

  const sync = (initialMessages: IMessage[] = []) => {
    if (!isOnline) return;
    let messages = initialMessages;
    let result;
    // mocking server call...
    result = handleSync({
      clientId: clock.nodeId,
      groupId: "default",
      messages,
    });
  };

  const sendMessages = (messages: IMessage[]) => {
    applyMessages(messages);
    sync(messages);
  };

  const addTodo = () => {
    if (inputs.title === "") return;
    const messages = generateMessages(clock, "todos", { title: inputs.title });
    sendMessages(messages);
  };

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
        <input name="logical" readOnly value={clock.logical} />
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
      {!!localDB.tables.todos.length && (
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
          {localDB.tables.todos.map((todo) => {
            return <div key={todo.id}>{todo.title}</div>;
          })}
        </div>
      )}
    </div>
  );
};
