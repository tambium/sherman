import React from "react";
import ReactDOM from "react-dom";
import {
  Clock,
  compare,
  initialize,
  receive,
  send,
} from "../../../packages/clock";
import { INode, Node } from "./components/node";
import { Event, IEvent } from "./components/event";

type State = {
  nodes: { [key: string]: INode };
};

type Action =
  | { nodeId: string; type: "local-event" }
  | {
      destinationNodeId: string;
      sourceNodeId: string;
      type: "send-event";
    };

const compareEvents = (first: IEvent, second: IEvent) => {
  return compare(first.clock, second.clock);
};

const createEventId = (clock: Clock, nodeId: string): string => {
  return `${clock.logical}:${clock.counter}:${nodeId}`;
};

const createNode = (nodeId: string, now: number) => {
  let clock = initialize({ nodeId, now });
  return {
    clock,
    events: [
      {
        clock,
        eventId: createEventId(clock, nodeId),
      },
    ],
    nodeId,
  };
};

const initialState = {
  nodes: {
    a: createNode("a", 10),
    b: createNode("b", 0),
    c: createNode("c", 5),
  },
};

const reducer = (state: State, action: Action) => {
  let cp = { ...state };
  let local, remote;
  const sender = (clock: Clock) => {
    return send({
      localClock: clock,
      now: clock.logical + 1,
    });
  };

  switch (action.type) {
    case "local-event":
      cp = { ...state };
      local = cp.nodes[action.nodeId].clock;
      let clock = sender(local);

      cp.nodes[action.nodeId] = {
        ...cp.nodes[action.nodeId],
        clock,

        events: [
          ...cp.nodes[action.nodeId].events,
          {
            eventId: createEventId(clock, action.nodeId),
            clock,
          },
        ],
      };

      return cp;
    case "send-event":
      cp = { ...state };
      local = cp.nodes[action.sourceNodeId].clock;
      remote = cp.nodes[action.destinationNodeId].clock;
      let localClock = sender(local);

      let remoteClock = receive({
        localClock: remote,
        remoteClock: {
          ...local,
          logical: local.logical + 1,
        },
        now: remote.logical + 1,
      });

      // handle "local" part of send event
      cp.nodes[action.sourceNodeId] = {
        ...cp.nodes[action.sourceNodeId],
        clock: localClock,

        events: [
          ...cp.nodes[action.sourceNodeId].events,
          {
            eventId: createEventId(localClock, action.sourceNodeId),
            clock: localClock,
          },
        ],
      };

      // handle "remote" part of send event
      cp.nodes[action.destinationNodeId] = {
        ...cp.nodes[action.destinationNodeId],
        clock: remoteClock,
        events: [
          ...cp.nodes[action.destinationNodeId].events,
          {
            eventId: createEventId(remoteClock, action.destinationNodeId),
            clock: remoteClock,
          },
        ],
      };

      return cp;
    default:
      throw new Error();
  }
};

export const App = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  return (
    <div css={{ display: "flex" }}>
      <div css={{ display: "flex", marginRight: 16 }}>
        {Object.keys(state.nodes).map((nodeId) => (
          <Node
            handleLocalEvent={() => {
              dispatch({
                nodeId,
                type: "local-event",
              });
            }}
            handleSendEvent={(destinationNodeId) => {
              dispatch({
                type: "send-event",
                sourceNodeId: nodeId,
                destinationNodeId: destinationNodeId,
              });
            }}
            key={nodeId}
            node={state.nodes[nodeId]}
            nodeIds={Object.keys(state.nodes)}
          />
        ))}
      </div>
      <div>
        {([] as IEvent[])
          .concat(
            ...Object.keys(state.nodes).map(
              (nodeId) => state.nodes[nodeId].events
            )
          )
          .sort(compareEvents)
          .map((event) => {
            return <Event event={event} key={event.eventId} />;
          })}
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
