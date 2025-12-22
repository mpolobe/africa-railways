import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "c5SWtYg1Hlw8Eng3Q6fKSS19JNyHbMmW5aS0rxIfDU0", // Using Secret as Key (Check if this is your Web API Key)
  authDomain: "africa-railways.firebaseapp.com",
  projectId: "africa-railways",
  storageBucket: "africa-railways.appspot.com",
  messagingSenderId: "1059521360055", // Example ID, replace if different
  appId: "1:1059521360055:web:8c5b161c77f897682976be"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

// Use your specific Key Pair for browser notifications
export const VAPID_KEY = "BNPYaiRA7gDP0i1WQpUMaOdeCa_se4niw-ar6SSlX8plcRNgjjQGbcUK_BELTPb1phVp5zoyRXPo7EdS2k5IYcY";

export default app;
