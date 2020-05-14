import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Clock,
  initialize,
  pack,
  receive,
  send,
  unpack,
} from "../../../../../packages/sherman-clock";
import { difference, insert } from "../../../../../packages/sherman-merkle";
import {
  ILocalDB,
  IMessage,
  IRow,
  ISyncOptions,
  ISyncResponse,
  ITodo,
} from "../../types";
import {
  getLocalDB,
  setter,
  constructLocalDB,
  getLocalDBTables,
  getLocalDBTodos,
  getLocalDBMessages,
} from "../../utils/localStorage";
import { isEmpty } from "../../utils/objects";
import { LOCAL_MESSAGES, LOCAL_TABLES, LOCAL_TODOS } from "../../constants";

interface NodeProps {
  handleSync: (options?: ISyncOptions) => ISyncResponse;
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

const initialState = {
  [LOCAL_MESSAGES]: [],
  [LOCAL_TABLES]: {
    [LOCAL_TODOS]: [],
  },
};

const useIsMounted = () => {
  const isMounted = React.useRef(false);
  React.useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);
  return isMounted;
};

export const Node: React.FC<NodeProps> = ({ handleSync, nodeId }) => {
  const isMounted = useIsMounted();
  const [state, setState] = React.useState<ILocalDB>(initialState);
  const [isOnline, setOnline] = React.useState(true);
  const [inputs, setInputs] = React.useState(initialInputValues);

  const node = React.useRef({
    clock: initialize({
      nodeId,
      now: Date.now(),
    }),
    merkle: {},
  });

  const extendedSetter = ({
    setterProps,
  }: {
    setterProps: {
      item: string;
      obj: {
        [LOCAL_MESSAGES]: IMessage[];
        [LOCAL_TABLES]: {
          [LOCAL_TODOS]: ITodo[];
        };
      };
    };
  }) => {
    setState(setterProps.obj);
    return setter(setterProps.item, setterProps.obj);
  };

  React.useEffect(() => {
    if (isEmpty(getLocalDB(nodeId))) {
      extendedSetter({
        setterProps: { item: constructLocalDB(nodeId), obj: initialState },
      });
    }
  }, []);

  React.useEffect(() => {
    if (isMounted.current) {
      if (isOnline) sync();
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
    let sortedMessages = [...getLocalDBMessages(nodeId)].sort(
      (first, second) => {
        if (first.timestamp < second.timestamp) return 1;
        else if (first.timestamp > second.timestamp) return -1;
        return 0;
      }
    );
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
    const table = getLocalDBTables(nodeId)[message.table];
    if (!table) throw new Error(`Table \`${message.table}\` does not exist.`);

    const row = table.find((row: IRow) => row.id === message.row);

    if (!row) {
      const updated = [...table];
      updated.push({
        id: message.row,
        [message.column]: message.value,
      });

      extendedSetter({
        setterProps: {
          item: constructLocalDB(nodeId),
          obj: {
            ...getLocalDB(nodeId),
            [LOCAL_TABLES]: {
              ...getLocalDBTables(nodeId),
              [message.table]: updated,
            },
          },
        },
      });
    } else {
      const updated = [...table];
      updated[message.column] = message.value;

      extendedSetter({
        setterProps: {
          item: constructLocalDB(nodeId),
          obj: {
            ...getLocalDB(nodeId),
            [LOCAL_TABLES]: {
              ...getLocalDBTables(nodeId),
              [message.table]: updated,
            },
          },
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

        extendedSetter({
          setterProps: {
            item: constructLocalDB(nodeId),
            obj: {
              ...getLocalDB(nodeId),
              [LOCAL_MESSAGES]: [...getLocalDBMessages(nodeId), message],
            },
          },
        });
      }
    });
  };

  const receiveMessages = (messages: IMessage[]) => {
    messages.forEach((message) => {
      node.current.clock = receive({
        localClock: node.current.clock,
        now: Date.now(),
        remoteClock: unpack(message.timestamp),
      });
    });

    applyMessages(messages);
  };

  const sync = (
    initialMessages: IMessage[] = [],
    since: number | null = null
  ): undefined => {
    if (!isOnline) return;
    let messages = initialMessages;

    if (since) {
      let timestamp = initialize({ nodeId, now: since });
      const localMessages: IMessage[] = getLocalDB(nodeId)[LOCAL_MESSAGES];
      messages = localMessages.filter(
        (message) => message.timestamp >= pack(timestamp)
      );
    }

    const result = handleSync({
      clientId: node.current.clock.nodeId,
      groupId: "default",
      messages,
      merkle: node.current.merkle,
    });

    if (result.status !== "ok") {
      throw new Error(`Error: ${result.reason}`);
    }

    if (result.data.messages.length > 0) {
      receiveMessages(result.data.messages);
    }

    let diffTime = difference(result.data.merkle, node.current.merkle);

    if (diffTime) {
      if (since && since === diffTime) {
        throw new Error(
          `A problem occured whilst syncing node ID ${nodeId} with the server.`
        );
      }

      return sync([], diffTime);
    }
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
      <div css={{ display: "flex" }}>
        <div css={{ marginBottom: 8, marginRight: 4 }}>
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
        <div css={{ marginBottom: 8, marginLeft: 4 }}>
          <button onClick={() => sync()}>Sync</button>
        </div>
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
      {getLocalDB(nodeId) &&
        getLocalDBTables(nodeId) &&
        getLocalDBTodos(nodeId) &&
        !!getLocalDBTodos(nodeId).length && (
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
            {getLocalDBTodos(nodeId).map((todo: ITodo) => {
              return <div key={todo.id}>{todo.title}</div>;
            })}
          </div>
        )}
    </div>
  );
};
