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

const createNode = (nodeId: string, now: number) => {
  let clock = initialize({ nodeId, now });
  return {
    clock,
    events: [
      {
        clock,
        eventId: `${clock.logical}:${clock.counter}:${nodeId}`,
      },
    ],
    nodeId,
  };
};

const initialState = {
  nodes: {
    a: createNode("a", 10),
    b: createNode("b", 0),
    c: createNode("c", 3),
  },
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "local-event":
      const localCp = { ...state };
      const localNow = localCp.nodes[action.nodeId].clock.logical;
      const leClock = send({
        localClock: localCp.nodes[action.nodeId].clock,
        now: localNow + 1,
      });

      localCp.nodes[action.nodeId] = {
        ...localCp.nodes[action.nodeId],
        clock: leClock,

        events: [
          ...localCp.nodes[action.nodeId].events,
          {
            eventId: `${leClock.logical}:${leClock.counter}:${action.nodeId}`,
            clock: leClock,
          },
        ],
      };

      return {
        ...state,
      };
    case "send-event":
      const sendCp = { ...state };
      const sourceNow = sendCp.nodes[action.sourceNodeId].clock.logical;
      const destinationNow =
        sendCp.nodes[action.destinationNodeId].clock.logical;
      const sendLocalClock = send({
        localClock: sendCp.nodes[action.sourceNodeId].clock,
        now: sourceNow + 1,
      });
      const sendRemoteClock = receive({
        localClock: sendCp.nodes[action.destinationNodeId].clock,
        remoteClock: {
          ...sendCp.nodes[action.sourceNodeId].clock,
          logical: sourceNow + 1,
        },
        now: destinationNow + 1,
      });

      // handle "local" part of send event
      sendCp.nodes[action.sourceNodeId] = {
        ...sendCp.nodes[action.sourceNodeId],
        clock: sendLocalClock,

        events: [
          ...sendCp.nodes[action.sourceNodeId].events,
          {
            eventId: `${sendLocalClock.logical}:${sendLocalClock.counter}:${action.sourceNodeId}`,
            clock: sendLocalClock,
          },
        ],
      };

      // handle "remote" part of send event
      sendCp.nodes[action.destinationNodeId] = {
        ...sendCp.nodes[action.destinationNodeId],
        clock: sendRemoteClock,
        events: [
          ...sendCp.nodes[action.destinationNodeId].events,
          {
            eventId: `${sendRemoteClock.logical}:${sendRemoteClock.counter}:${action.destinationNodeId}`,
            clock: sendRemoteClock,
          },
        ],
      };

      return {
        ...state,
      };
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
        <div css={{ marginBottom: 16 }}>
          <div style={{ fontStyle: "italic", maxWidth: 400 }}>
            l.j is introduced as a level of indirection to maintain the maximum
            of pt information learned so far, and c is used for capturing
            causality updates only when l values are equal [...] we can reset c
            when the information heard about maximum pt catches up or goes ahead
            of l.
          </div>
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
ReactDOM.render(<App />, rootElement);
