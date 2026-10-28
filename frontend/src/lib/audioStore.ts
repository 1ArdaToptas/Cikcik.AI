/**
 * Persists generated audio in IndexedDB so history clips can be replayed
 * without asking the backend to synthesize them again.
 */

const DB_NAME = 'resonant'
const STORE = 'audio'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('IndexedDB unavailable'))
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error ?? new Error('IndexedDB open failed'))
    }
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export async function saveAudio(id: string, blob: Blob) {
  try {
    await run('readwrite', (store) => store.put(blob, id))
  } catch {
    // Storage is best-effort: the clip can still be regenerated later.
  }
}

export async function loadAudio(id: string): Promise<Blob | null> {
  try {
    const result = await run<Blob | undefined>('readonly', (store) => store.get(id))
    return result instanceof Blob ? result : null
  } catch {
    return null
  }
}

/** Deletes every stored clip whose id is not in `keep`. */
export async function pruneAudio(keep: Set<string>) {
  try {
    const keys = await run<IDBValidKey[]>('readonly', (store) => store.getAllKeys())
    await Promise.all(
      keys
        .filter((key) => typeof key === 'string' && !keep.has(key))
        .map((key) => run('readwrite', (store) => store.delete(key))),
    )
  } catch {
    // ignore
  }
}
