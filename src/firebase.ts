import { initializeApp, getApps, getApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// TODO: Set EXPO_PUBLIC_FIREBASE_* env vars for production. Placeholder values are for local compile only.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = (() => {
  const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence as
    | ((storage: typeof AsyncStorage) => unknown)
    | undefined;

  try {
    if (getReactNativePersistence) {
      return FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage) as any,
      });
    }
    return FirebaseAuth.getAuth(app);
  } catch {
    return FirebaseAuth.getAuth(app);
  }
})();

export { auth };
export const db = getFirestore(app);
