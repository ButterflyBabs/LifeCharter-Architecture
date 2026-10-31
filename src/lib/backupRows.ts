// Keeps private links, keys and passwords out of a client's backup file, whichever table a row came from.
const SECRET = /token|secret|api_?key|password|passcode|access_code|otp|_hash$/i;

export function withoutSecrets<T extends object>(rows: T[]): Partial<T>[] {
  return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => !SECRET.test(k))) as Partial<T>);
}
