import { randomUUID } from "node:crypto"

/** Every course and lesson id is a full v4 UUID (e.g. 3f2b9c1e-8a4d-4f6e-9c1a-2b7d5e8f0a14), shown and copied in full. */
export const newId = () => randomUUID()

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
