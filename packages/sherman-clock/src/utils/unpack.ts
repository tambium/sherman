import { Clock } from "../types";

export const unpack = (serialized: string): Clock => {
  const parts = serialized.split("/");
  const ISO = parts[0];
  const logical = Date.parse(ISO);
  const counter = parseInt(parts[1], 16);
  const nodeId = parts[2];

  return {
    counter,
    logical,
    nodeId,
  };
};
