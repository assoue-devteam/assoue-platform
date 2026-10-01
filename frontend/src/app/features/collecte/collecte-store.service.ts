import { Injectable } from '@angular/core';
import { DeclarationCollecteRequest } from '../../shared/models/api';

export type CollecteLocale = DeclarationCollecteRequest & {
  creeeLe: string;
};

const DB_NAME = 'assoue-collecte';
const STORE_NAME = 'declarations';
const MATERIAUX_STORE = 'materiaux';

@Injectable({ providedIn: 'root' })
export class CollecteStoreService {
  private dbPromise?: Promise<IDBDatabase>;

  enregistrer(declaration: CollecteLocale): Promise<void> {
    return this.transaction('readwrite', store => store.put(declaration)).then(() => undefined);
  }

  async enAttente(): Promise<CollecteLocale[]> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as CollecteLocale[]).sort((a, b) => a.creeeLe.localeCompare(b.creeeLe)));
      request.onerror = () => reject(request.error);
    });
  }

  supprimer(referenceClient: string): Promise<void> {
    return this.transaction('readwrite', store => store.delete(referenceClient)).then(() => undefined);
  }

  enregistrerMateriaux(materiaux: unknown[]): Promise<void> {
    return this.db().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(MATERIAUX_STORE, 'readwrite');
      const store = transaction.objectStore(MATERIAUX_STORE);
      store.clear();
      for (const materiau of materiaux) store.put(materiau);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }));
  }

  materiaux<T>(): Promise<T[]> {
    return this.db().then(db => new Promise((resolve, reject) => {
      const request = db.transaction(MATERIAUX_STORE, 'readonly').objectStore(MATERIAUX_STORE).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    }));
  }

  private transaction(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    return this.db().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    }));
  }

  private db(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'referenceClient' });
        if (!request.result.objectStoreNames.contains(MATERIAUX_STORE)) request.result.createObjectStore(MATERIAUX_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }
}
