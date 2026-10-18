import "server-only";
import { getDb as getDbInternal, type Db } from "./client";

export type { Db };
export const getDb = getDbInternal;
