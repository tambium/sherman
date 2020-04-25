export type Clock = {
  /** Lamport logical clock -esque counter.  */
  count: number;
  /** Wall clock for node in system. */
  timestamp: number;
  /** Unique identifier for node in system, used to settle deadlocks. */
  nodeId: string;
};
