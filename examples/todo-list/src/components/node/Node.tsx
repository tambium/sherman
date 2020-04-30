import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Clock, initialize, send } from "../../../../../packages/clock";

interface NodeProps {
  nodeId: string;
}

interface IData {
  [key: string]: Array<any>;
}

interface IDB {
  messages: IMessage[];
  data: IData;
}

type Inputs = {
  title: "";
};

const initialInputValues: Inputs = {
  title: "",
};

interface IMessage {
  [key: string]: any;
}

interface IRow {
  [key: string]: any;
}

const generateMessages = (clock: Clock, table: string, row: IRow) => {
  const id = uuidv4();
  const fields = Object.keys(row);

  return fields.map((k) => ({
    column: k,
    dataset: table,
    row: row.id || id,
    timestamp: send({ localClock: clock, now: Date.now() }),
    value: row[k],
  }));
};

export const Node: React.FC<NodeProps> = ({ nodeId }) => {
  const [isOnline, setOnline] = React.useState(true);
  const [localDB, setLocalDB] = React.useState<IDB>({
    messages: [],
    data: {
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

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const compareMessages = (messages: IMessage[]) => {
    let existingMessages = new Map();
    let sortedMessages = [...localDB.messages].sort((first, second) => {
      if (first.timestamp < second.timestamp) return 1;
      else if (first.timestamp > second.timestamp) return -1;
      return 0;
    });
    messages.forEach((message) => {
      let existingMessage = sortedMessages.find(
        (instance) =>
          message.dataset === instance.dataset &&
          message.row === instance.row &&
          message.column === instance.column
      );
      existingMessages.set(message, existingMessage);
    });

    return existingMessages;
  };

  const apply = (message: IMessage) => {
    const table = localDB.data[message.dataset];
    if (!table) throw new Error(`Table \`${message.dataset}\` does not exist.`);

    const row = table.find((row) => row.id === message.row);

    if (!row) {
      const updated = [...table];
      updated.push({
        id: message.row,
        [message.column]: message.value,
      });
      setLocalDB({
        ...localDB,
        data: {
          ...localDB.data,
          [message.dataset]: updated,
        },
      });
    } else {
      const updated = [...table];
      updated[message.column] = message.value;
      setLocalDB({
        ...localDB,
        data: {
          ...localDB.data,
          [message.dataset]: updated,
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
      }
    });
  };

  const addTodo = () => {
    if (inputs.title === "") return;
    const messages = generateMessages(clock, "todos", { title: inputs.title });
    applyMessages(messages);
    // sync(messages);
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
        <input checked name="online" readOnly type="checkbox" />
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
      {!!localDB.data.todos.length && (
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
          {localDB.data.todos.map((todo) => {
            return <div key={todo.id}>{todo.title}</div>;
          })}
        </div>
      )}
    </div>
  );
};
