import { IMerkle } from "../../../../packages/sherman-merkle";
import {
  HOSTED_MESSAGES_MERKLES,
  HOSTED_MESSAGES,
  LOCAL_MESSAGES,
  LOCAL_TABLES,
  LOCAL_TODOS,
} from "../constants";

export interface IMessage {
  column: string;
  table: string;
  row: string;
  timestamp: string;
  value: string;
}

export interface IRow {
  [key: string]: any;
}

export interface ITodo {
  id: string;
  title: string;
  tombstone?: number;
}

export interface IMerkleEntity {
  groupId: string;
  merkle: string;
}

export interface IHostedDB {
  [HOSTED_MESSAGES]: IMessage[];
  [HOSTED_MESSAGES_MERKLES]: IMerkle[];
}

export interface ILocalDB {
  [LOCAL_MESSAGES]: IMessage[];
  [LOCAL_TABLES]: {
    [LOCAL_TODOS]: ITodo[];
  };
}

export interface ISyncOptions {
  clientId: string;
  groupId: string;
  merkle: IMerkle;
  messages: IMessage[];
}

export interface ISyncData {
  groupId?: string;
  clientId?: string;
  messages: IMessage[];
  merkle: IMerkle;
}

export interface ISyncResponse {
  status: string;
  reason?: string;
  data: ISyncData;
}
