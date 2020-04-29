/**
 * Instance of Hybrid Logical Clock
 */
export type Clock = {
  /** Captures causality updates only when `Clock.logical` values are equal.  */
  counter: number;
  /** Maximum physical time heard among nodes. */
  logical: number;
  /** Unique identifier for node in system, used to settle deadlocks. */
  nodeId: string;
};
