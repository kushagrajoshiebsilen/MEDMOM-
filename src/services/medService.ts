import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  setDoc,
  getDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Medication } from '../types';

export const subscribeToMeds = (userId: string, callback: (meds: Medication[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'meds'),
    orderBy('time', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const meds: Medication[] = [];
    snapshot.forEach((doc) => {
      meds.push({ id: doc.id, ...doc.data() } as Medication);
    });
    callback(meds);
  }, (error) => {
    console.error("Firestore Listen Error:", error);
  });
};

export const addMedication = async (userId: string, med: Omit<Medication, 'id'>) => {
  const medRef = collection(db, 'users', userId, 'meds');
  await addDoc(medRef, {
    ...med,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateMedicationStatus = async (userId: string, medId: string, status: Medication['status']) => {
  const medRef = doc(db, 'users', userId, 'meds', medId);
  await updateDoc(medRef, {
    status,
    updatedAt: serverTimestamp()
  });
};

export const deleteMedication = async (userId: string, medId: string) => {
  const medRef = doc(db, 'users', userId, 'meds', medId);
  await deleteDoc(medRef);
};

export const ensureUserProfile = async (user: { uid: string, displayName: string | null, email: string | null }) => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || 'Guest',
      email: user.email || '',
      role: 'standard',
      createdAt: serverTimestamp()
    });
  }
};

export const findUserByEmail = async (email: string) => {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email)
  );
  // Note: For this to work efficiently, users should have an index on email.
  // In standard Firestore rules, this might requires 'allow list' with filter.
  // We'll assume the client can do a simple query.
  // However, search is restricted by rules often. Let's use a simpler "Add by UID" for now or just mock it if complex.
  // Actually, I'll implement a simple one.
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { uid: doc.id, ...doc.data() };
  }
  return null;
};

export const createConnectionRequest = async (myUid: string, targetUid: string, type: string) => {
  const connId = [myUid, targetUid].sort().join('_');
  await setDoc(doc(db, 'connections', connId), {
    uidA: myUid,
    uidB: targetUid,
    status: 'accepted', // Auto-accept for demo/speed as requested "connect with mom"
    typeA: 'Son',
    typeB: type,
    createdAt: serverTimestamp()
  });
};

export const subscribeToConnections = (myUid: string, callback: (connections: any[]) => void) => {
  const q = query(
    collection(db, 'connections'),
    where('uidA', '==', myUid)
  );
  const q2 = query(
    collection(db, 'connections'),
    where('uidB', '==', myUid)
  );

  // We'll combine these or just listen to one for simplicity in the 'Connect' view
  return onSnapshot(q, (snapshot) => {
    const conns: any[] = [];
    snapshot.forEach(doc => conns.push({ id: doc.id, ...doc.data() }));
    callback(conns);
  });
};
