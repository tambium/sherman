import { Clock } from "../types/clock";

export const pack = ({ counter, logical, nodeId }: Clock): string => {
  const ISO = new Date(logical).toISOString();

  const uniform = ({
    fillString = "0",
    length,
    original,
  }: {
    fillString?: string;
    length: number;
    original: string | number;
  }): string => {
    const stringified =
      typeof original === "number" ? original.toString(16) : original;
    return stringified
      .padStart(length, fillString)
      .slice(length - stringified.length);
  };

  return `${ISO}/${uniform({
    length: 4,
    original: counter,
  })}/${uniform({
    length: 16,
    original: nodeId,
  })}`;
};
