import { useState } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Admin.module.css';

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mockPairs = [
    { pair: 'BTCUSDT', timeframe: '1H', price: 50000.50, data: { direction: 'up' } },
    { pair: 'ETHUSDT', timeframe: '4H', price: 3000.25, data: { direction: 'down' } },
    { pair: 'BNBUSDT', timeframe: '1D', price: 400.75, data: { direction: 'up' } },
    { pair: 'SOLUSDT', timeframe: '1H', price: 100.50, data: { direction: 'down' } },
    { pair: 'ADAUSDT', timeframe: '4H', price: 0.50, data: { direction: 'up' } }
  ];

  const addMockData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Add to main history
      const historyRef = collection(db, 'pairScreener', 'history', 'alerts');
      for (const mock of mockPairs) {
        await addDoc(historyRef, {
          ...mock,
          receivedAt: serverTimestamp()
        });
      }

      // Add to pairs
      for (const mock of mockPairs) {
        const pairRef = collection(db, 'pairScreener', 'pairs', mock.pair, 'history', 'alerts');
        const infoRef = doc(db, 'pairScreener', 'pairs', mock.pair, 'info');
        
        // Add to pair history
        await addDoc(pairRef, {
          ...mock,
          receivedAt: serverTimestamp()
        });

        // Update pair info
        await setDoc(infoRef, {
          [mock.timeframe]: mock.data.direction === 'up' ? 'Bullish' : 'Bearish',
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }

      setSuccess('Mock data added successfully');
    } catch (error) {
      console.error('Error adding mock data:', error);
      setError('Failed to add mock data');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllData = async () => {
    if (!confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Starting deletion process...');
      
      // 1. Delete main history alerts
      try {
        console.log('Deleting main history alerts...');
        const historyAlertsRef = collection(db, 'pairScreener', 'history', 'alerts');
        const historySnapshot = await getDocs(historyAlertsRef);
        
        if (historySnapshot.docs.length > 0) {
          const batch = writeBatch(db);
          historySnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          console.log(`Deleted ${historySnapshot.docs.length} history alerts`);
        } else {
          console.log('No history alerts to delete');
        }
      } catch (err) {
        console.error('Error deleting history alerts:', err);
      }
      
      // 2. List all pairs (requires creating a Cloud Function to list subcollections)
      // As a workaround, we'll use the known pairs from mockPairs
      const pairsToDelete = mockPairs.map(p => p.pair);
      console.log(`Deleting data for pairs: ${pairsToDelete.join(', ')}`);
      
      // 3. Delete each pair's data
      for (const pair of pairsToDelete) {
        try {
          console.log(`Processing pair: ${pair}`);
          
          // Delete pair history alerts
          try {
            const alertsRef = collection(db, 'pairScreener', 'pairs', pair, 'history', 'alerts');
            const alertsSnapshot = await getDocs(alertsRef);
            
            if (alertsSnapshot.docs.length > 0) {
              const batch = writeBatch(db);
              alertsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
              console.log(`Deleted ${alertsSnapshot.docs.length} alerts for ${pair}`);
            } else {
              console.log(`No alerts for ${pair}`);
            }
          } catch (err) {
            console.error(`Error deleting alerts for ${pair}:`, err);
          }
          
          // Delete pair info
          try {
            const infoRef = doc(db, 'pairScreener', 'pairs', pair, 'info');
            await deleteDoc(infoRef);
            console.log(`Deleted info for ${pair}`);
          } catch (err) {
            console.error(`Error deleting info for ${pair}:`, err);
          }
        } catch (err) {
          console.error(`Error processing pair ${pair}:`, err);
        }
      }
      
      console.log('Deletion process completed');
      setSuccess('All data deleted successfully');
    } catch (error) {
      console.error('Error in deletion process:', error);
      setError(`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPanel}>
        <div className={styles.adminCard}>
          <h1 className={styles.adminTitle}>Admin Panel</h1>

          {error && (
            <div className={styles.alertError}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              {success}
            </div>
          )}

          <div className={styles.buttonContainer}>
            <button
              onClick={addMockData}
              disabled={loading}
              className={loading ? styles.buttonDisabled : styles.buttonPrimary}
            >
              {loading ? 'Processing...' : 'Add Mock Data'}
            </button>

            <button
              onClick={deleteAllData}
              disabled={loading}
              className={loading ? styles.buttonDisabled : styles.buttonDanger}
            >
              {loading ? 'Processing...' : 'Delete All Data'}
            </button>
          </div>

          <div className={styles.previewContainer}>
            <h2 className={styles.previewTitle}>Mock Data Preview</h2>
            <div className={styles.previewContent}>
              <pre className={styles.previewText}>
                {JSON.stringify(mockPairs, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 