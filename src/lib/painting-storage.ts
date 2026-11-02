// Functional, device-local storage. No drawing pixels leave the browser.
let connection: Promise<IDBDatabase> | undefined;
function database() {
  return connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('colotopia-paintings', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drawings');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(new Error('storage blocked')); };
  });
}
export async function loadPainting(key: string): Promise<Blob | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('drawings', 'readonly').objectStore('drawings').get(key);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
    request.onerror = () => reject(request.error);
  });
}
export async function savePainting(key: string, blob: Blob): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drawings', 'readwrite');
    tx.objectStore('drawings').put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
