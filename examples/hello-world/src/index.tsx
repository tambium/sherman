import React from "react";
import ReactDOM from "react-dom";
import { Clock, receive, send } from "../../../packages/sherman-clock";
import { INode, Node } from "./components/node";
import { Event, IEvent } from "./components/event";
import { GlobalStyle } from "./components/global-style";
import { compareEvents, createEventId } from "./utils/event";
import { createNode } from "./utils/node";

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

const initialState = {
  nodes: {
    A: createNode("A", 10),
    B: createNode("B", 0),
    C: createNode("C", 5),
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
    <div css={{ display: "flex", flexWrap: "wrap" }}>
      <div css={{ display: "flex", flexWrap: "wrap", marginRight: 16 }}>
        {Object.keys(state.nodes).map((nodeId) => (
          <div css={{ padding: 8 }} key={nodeId}>
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
              node={state.nodes[nodeId]}
              nodeIds={Object.keys(state.nodes)}
            />
          </div>
        ))}
      </div>
      <div css={{ padding: 8 }}>
        <div css={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Event log
        </div>
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
ReactDOM.render(
  <React.Fragment>
    <GlobalStyle />
    <App />
  </React.Fragment>,
  rootElement
);
