import { v3 as murmurhashv3 } from "murmurhash";
import { Clock } from "../types";
import { pack } from "./pack";

export const hash = (clock: Clock): number => {
  return murmurhashv3(pack(clock));
};
