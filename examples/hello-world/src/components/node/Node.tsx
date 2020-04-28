import * as React from "react";
import { INode } from "./types";

interface NodeProps {
  handleLocalEvent: () => void;
  handleSendEvent: (destinationNodeId: string) => void;
  node: INode;
  nodeIds: string[];
}

export const Node: React.FC<NodeProps> = ({
  handleLocalEvent,
  handleSendEvent,
  node,
  nodeIds,
}) => {
  const { clock, nodeId } = node;
  const { counter, logical } = clock;

  return (
    <div css={{ padding: 8 }}>
      <div css={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
        Node {nodeId}
      </div>
      <div css={{ marginBottom: 8 }}>
        <div css={{ fontWeight: 600, textDecoration: "underline" }}>Clock</div>
        <div>Counter: {counter}</div>
        <div>Logical: {logical}</div>
      </div>
      <div css={{ display: "flex", flexDirection: "column" }}>
        {nodeIds
          .filter((nodeId) => nodeId !== node.nodeId)
          .map((destinationNodeId) => (
            <button
              css={{ marginBottom: 4 }}
              onClick={() => handleSendEvent(destinationNodeId)}
              key={destinationNodeId}
            >
              Send event to {destinationNodeId}
            </button>
          ))}

        <button onClick={handleLocalEvent}>Local event</button>
      </div>
    </div>
  );
};
