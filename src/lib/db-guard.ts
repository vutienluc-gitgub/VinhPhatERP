export function dbGuard() {
  return true;
}

export async function safeUpsert(table: string, data: any) {
  return { data, error: null };
}

export async function safeInsert(table: string, data: any) {
  return { data, error: null };
}

export async function safeUpdate(table: string, data: any, match: any) {
  return { data, error: null };
}

export async function safeDelete(table: string, match: any) {
  return { error: null };
}
