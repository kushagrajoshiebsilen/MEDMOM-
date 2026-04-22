import { Medication } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const subscribeToMeds = (userId: string, callback: (meds: Medication[]) => void) => {
  let isSubscribed = true;

  const fetchMeds = async () => {
    try {
      const res = await fetch(`/api/medications/${userId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (isSubscribed) callback(data);
      }
    } catch (err) {
      console.error("Fetch Meds Error:", err);
    }
  };

  fetchMeds();
  const interval = setInterval(fetchMeds, 5000);

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
};

export const addMedication = async (userId: string, med: Omit<Medication, 'id'>) => {
  await fetch(`/api/medications/${userId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(med)
  });
};

export const updateMedicationStatus = async (userId: string, medId: string, status: Medication['status']) => {
  await fetch(`/api/medications/${userId}/${medId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
};

export const deleteMedication = async (userId: string, medId: string) => {
  await fetch(`/api/medications/${userId}/${medId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

export const ensureUserProfile = async (user: any) => {
  return true;
};

export const pairWithCode = async (pairingCode: string) => {
  try {
    const res = await fetch('/api/connections/pair', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pairingCode })
    });
    return await res.json();
  } catch (err) {
    console.error("Pairing Error:", err);
    return { error: "Failed to connect" };
  }
};

export const createConnectionRequest = async (myUid: string, targetUid: string, type: string) => {
  await fetch('/api/connections', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ myUid, targetUid, type })
  });
};

export const subscribeToConnections = (myUid: string, callback: (connections: any[]) => void) => {
  let isSubscribed = true;

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/connections/${myUid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (isSubscribed) callback(data);
      }
    } catch (err) {
      console.error("Fetch Connections Error:", err);
    }
  };

  fetchConnections();
  const interval = setInterval(fetchConnections, 10000);

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
};

export const verifyPillAI = async (data: { imageBase64: string, referenceImageUrl?: string, medicationName: string, medicationDose: string }) => {
  const res = await fetch('/api/verify-pill', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return await res.json();
};
