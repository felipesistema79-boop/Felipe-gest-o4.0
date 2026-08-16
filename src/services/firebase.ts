import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfigData) : getApp();

// Initialize Firestore with custom databaseId if specified
export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Sign in anonymously to authenticate with Firebase Auth
signInAnonymously(auth).catch((err) => {
  console.warn('Firebase Auth anonymous login note:', err.message);
});

export type CloudSyncStatus = 'connecting' | 'connected' | 'offline' | 'error';

let currentSyncStatus: CloudSyncStatus = 'connecting';
let syncStatusListeners: ((status: CloudSyncStatus) => void)[] = [];

export const onCloudSyncStatusChange = (cb: (status: CloudSyncStatus) => void) => {
  syncStatusListeners.push(cb);
  cb(currentSyncStatus);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== cb);
  };
};

function setCloudSyncStatus(status: CloudSyncStatus) {
  currentSyncStatus = status;
  syncStatusListeners.forEach((cb) => cb(status));
}

// Collections definition in Firestore
export const COLLECTIONS = {
  EMPRESA: 'sgm_empresa',
  ETAPAS: 'sgm_etapas',
  SEGMENTOS: 'sgm_segmentos',
  VENDEDORES: 'sgm_vendedores',
  FORNECEDORES: 'sgm_fornecedores',
  OBRAS: 'sgm_obras',
  COMPRAS: 'sgm_compras',
  REQUISICOES: 'sgm_requisicoes',
  PDCA: 'sgm_pdca',
  EISENHOWER: 'sgm_eisenhower',
  GUT: 'sgm_gut',
  FIVE_W_TWO_H: 'sgm_five_w_two_h',
  BRAINSTORMING: 'sgm_brainstorming',
  GOOGLE_TASKS: 'sgm_google_tasks',
  APRENDIZADOS: 'sgm_aprendizados',
  GARGALOS: 'sgm_gargalos',
  REGISTROS_RAPIDOS: 'sgm_registros_rapidos',
  CONFIG_GARGALOS: 'sgm_config_gargalos',
  MANUTENCOES: 'sgm_manutencoes',
};

// Generic Firestore Helpers
export async function saveDocument<T extends { id?: string }>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<void> {
  try {
    const id = docId || data.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const docRef = doc(db, collectionName, id);
    // Sanitize undefined fields which Firestore rejects
    const cleanData = JSON.parse(JSON.stringify({ ...data, id }));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error(`Error saving document to ${collectionName}:`, error);
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
  }
}

export async function deleteDocumentsBatch(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  if (!docIds || docIds.length === 0) return;
  try {
    for (let i = 0; i < docIds.length; i += 500) {
      const chunk = docIds.slice(i, i + 500);
      const batch = writeBatch(db);
      chunk.forEach((docId) => {
        if (docId) {
          const docRef = doc(db, collectionName, docId);
          batch.delete(docRef);
        }
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error batch deleting from ${collectionName}:`, error);
  }
}

export async function clearCollection(collectionName: string): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const qSnap = await getDocs(colRef);
    if (qSnap.empty) return;
    const docs = qSnap.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
  }
}

export async function saveCollectionBatch<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    for (let i = 0; i < items.length; i += 500) {
      const chunk = items.slice(i, i + 500);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        if (item && item.id) {
          const docRef = doc(db, collectionName, item.id);
          const cleanData = JSON.parse(JSON.stringify(item));
          batch.set(docRef, cleanData, { merge: true });
        }
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error batch saving to ${collectionName}:`, error);
  }
}

// Single config document helper for Empresa
export async function saveEmpresaDoc<T>(data: T): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPRESA, 'config');
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error('Error saving empresa to Firestore:', error);
  }
}

export { setCloudSyncStatus };
