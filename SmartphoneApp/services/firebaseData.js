import { db, auth } from '../firebaseConfig';
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";

// Listen to Live Train Schedules
export const subscribeToSchedules = (callback) => {
  const q = query(collection(db, "schedules"));
  return onSnapshot(q, (snapshot) => {
    const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(schedules);
  });
};

// Listen to User Wallet Balance
export const subscribeToBalance = (callback) => {
  const user = auth.currentUser;
  if (!user) return;
  return onSnapshot(doc(db, "users", user.uid), (doc) => {
    callback(doc.data()?.balance || 0);
  });
};

// Handle Top Up (Using a simple update for demo, usually Cloud Functions)
export const topUpWallet = async (amount) => {
  const user = auth.currentUser;
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    balance: increment(amount)
  });
};
