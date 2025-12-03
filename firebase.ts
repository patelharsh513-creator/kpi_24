
// @ts-nocheck
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { DailyRecord, BellabonaRecord } from "../types";

// Your web app's Firebase configuration
// HARDCODED AS REQUESTED
const firebaseConfig = {
  apiKey: "AIzaSyCHpiYrXfvAfT-C2y40Uk78GBNFeVj9iQo", // Default (hardcoded as fallback)
  authDomain: "kpi-24.firebaseapp.com",
  databaseURL: "https://kpi-24-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kpi-24",
  storageBucket: "kpi-24.firebasestorage.app",
  messagingSenderId: "268575598668",
  appId: "1:268575598668:web:793efb6f28b3f1ea85ece9"
};

let firebaseAppInstance;

const getFirebaseApp = () => {
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  let userFirebaseApiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_api_key') : '';
  const currentConfig = { ...firebaseConfig };

  if (userFirebaseApiKey) {
    currentConfig.apiKey = userFirebaseApiKey;
  }

  firebaseAppInstance = initializeApp(currentConfig);
  return firebaseAppInstance;
}

const db = getDatabase(getFirebaseApp());

const DB_PATH = 'daily_records';
const BELLABONA_DB_PATH = 'bellabona_records';

export const saveDailyRecord = async (record: DailyRecord) => {
  if (!record.date) {
      console.error("Cannot save record without a date");
      return;
  }

  try {
    const recordRef = ref(db, `${DB_PATH}/${record.date}`);
    await set(recordRef, record);
    console.log("Saved to Firebase:", record.date);
  } catch (error) {
    console.error("Firebase save failed:", error);
    throw error;
  }
};

export const subscribeToRecords = (callback: (records: DailyRecord[]) => void) => {
  const recordsRef = ref(db, DB_PATH);
  
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const records = Object.values(data) as DailyRecord[];
      // Sort by date
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(records);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Firebase subscription error:", error);
    callback([]);
  });

  return unsubscribe;
};

// --- BELLABONA FUNCTIONS ---

export const saveBellabonaRecord = async (record: BellabonaRecord) => {
    if (!record.date) return;
    try {
        const recordRef = ref(db, `${BELLABONA_DB_PATH}/${record.date}`);
        await set(recordRef, record);
    } catch (error) {
        console.error("Bellabona save failed:", error);
        throw error;
    }
};

export const subscribeToBellabonaRecords = (callback: (records: BellabonaRecord[]) => void) => {
    const recordsRef = ref(db, BELLABONA_DB_PATH);
    const unsubscribe = onValue(recordsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const records = Object.values(data) as BellabonaRecord[];
            records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            callback(records);
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};
