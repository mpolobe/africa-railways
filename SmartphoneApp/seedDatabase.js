import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export const seedTrains = async () => {
  const INITIAL_TRAINS = [
    { id: 'AR101', trainName: 'Lagos Express', from: 'Lagos', to: 'Abuja', status: 'On Time' },
    { id: 'AR202', trainName: 'Benin Coastal', from: 'Lagos', to: 'Benin', status: 'Delayed' },
    { id: 'AR305', trainName: 'Northern Link', from: 'Abuja', to: 'Kano', status: 'On Time' }
  ];
  try {
    for (const train of INITIAL_TRAINS) {
      await setDoc(doc(db, "trains", train.id), train);
    }
    alert("Database seeded successfully!");
  } catch (e) {
    alert("Seed failed: " + e.message);
  }
};
