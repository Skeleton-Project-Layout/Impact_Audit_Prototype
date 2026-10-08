/**
 * Abhisaran Offline Autosave Engine
 * IndexedDB database: 'abhisaran_offline_db'
 * 
 * Provides resilient offline persistence, local draft caching,
 * and debounced background synchronization with 3-state status monitoring.
 */

const DB_NAME = 'abhisaran_offline_db';
const DB_VERSION = 1;

export interface OfflinePageRecord {
  pageId: string;
  locationId: string;
  pageNumber: number;
  answers: Record<string, any>;
  status: string;
  updatedAt: string;
  dirty?: boolean;
}

export interface PendingSyncItem {
  pageId: string;
  answers: Record<string, any>;
  queuedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('pages')) {
        db.createObjectStore('pages', { keyPath: 'pageId' });
      }

      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'pageId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Persists an audit page record to local IndexedDB
 */
export async function savePageLocally(record: OfflinePageRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readwrite');
    const store = tx.objectStore('pages');
    const req = store.put(record);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a page record from local IndexedDB
 */
export async function getPageLocally(pageId: string): Promise<OfflinePageRecord | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readonly');
    const store = tx.objectStore('pages');
    const req = store.get(pageId);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Enqueues or updates pending sync answers for a page
 */
export async function queuePendingSync(pageId: string, answers: Record<string, any>): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readwrite');
    const store = tx.objectStore('pending_sync');
    const item: PendingSyncItem = {
      pageId,
      answers,
      queuedAt: Date.now()
    };
    const req = store.put(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears pending sync queue item for a page once successfully synced with server
 */
export async function clearPendingSync(pageId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readwrite');
    const store = tx.objectStore('pending_sync');
    const req = store.delete(pageId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all pending sync items across pages
 */
export async function getAllPendingSyncs(): Promise<PendingSyncItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readonly');
    const store = tx.objectStore('pending_sync');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Exports all local pages for a location as a portable JSON backup
 */
export async function exportLocationBackup(locationId: string): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readonly');
    const store = tx.objectStore('pages');
    const req = store.getAll();

    req.onsuccess = () => {
      const allPages = (req.result || []) as OfflinePageRecord[];
      const locationPages = allPages.filter(p => p.locationId === locationId);
      const backup = {
        app: 'ABHISARAN',
        version: 1,
        exportedAt: new Date().toISOString(),
        locationId,
        pages: locationPages
      };
      resolve(JSON.stringify(backup, null, 2));
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Restores local pages from an exported JSON backup
 */
export async function importLocationBackup(jsonString: string): Promise<{ restoredCount: number }> {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.pages)) {
    throw new Error('Invalid backup file format: missing pages array.');
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readwrite');
    const store = tx.objectStore('pages');

    let count = 0;
    for (const page of parsed.pages) {
      if (page.pageId) {
        store.put(page);
        count++;
      }
    }

    tx.oncomplete = () => resolve({ restoredCount: count });
    tx.onerror = () => reject(tx.error);
  });
}
