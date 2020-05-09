import { HOSTED_DB, HOSTED_MESSAGES, LOCAL_DB } from "../constants";
import { IMessage } from "../types";

export const stringify = (obj: object): string => {
  return JSON.stringify(obj);
};

export const parse = (str: string): object => {
  return JSON.parse(str);
};

export const getter = (item: string): any => {
  return parse(localStorage.getItem(item) || "{}");
};

export const setter = (item: string, obj: object): void => {
  return localStorage.setItem(item, stringify(obj));
};

export const hasItem = (item: string): boolean => {
  return localStorage.hasOwnProperty(item);
};

const getHostedDB = () => {
  return getter(HOSTED_DB);
};

export const constructLocalDB = (nodeId: string): string => {
  return `${LOCAL_DB}${nodeId}`;
};

export const getLocalDB = (nodeId: string) => {
  const localDB = constructLocalDB(nodeId);
  return getter(localDB);
};
