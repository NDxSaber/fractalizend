import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PairScreenerData } from '../types/pairScreener';

interface PairScreenerData {
  id: string;
  pair: string;
  timeframe: string;
  price: number;
  receivedAt: any;
  data: {
    [key: string]: any;
  };
  [key: string]: any;
}

const mockData = [
  {
    pair: "BTCUSDT",
    timeframe: "1H",
    price: 50000.50,
    receivedAt: serverTimestamp(),
    data: {
      rsi: 65,
      macd: 120,
      volume: 1500000,
      trend: "up"
    }
  },
  {
    pair: "ETHUSDT",
    timeframe: "4H",
    price: 2500.75,
    receivedAt: serverTimestamp(),
    data: {
      rsi: 45,
      macd: -80,
      volume: 800000,
      trend: "down"
    }
  },
  {
    pair: "SOLUSDT",
    timeframe: "1D",
    price: 100.25,
    receivedAt: serverTimestamp(),
    data: {
      rsi: 70,
      macd: 200,
      volume: 500000,
      trend: "up"
    }
  },
  {
    pair: "BNBUSDT",
    timeframe: "1H",
    price: 350.00,
    receivedAt: serverTimestamp(),
    data: {
      rsi: 40,
      macd: -150,
      volume: 300000,
      trend: "down"
    }
  },
  {
    pair: "ADAUSDT",
    timeframe: "4H",
    price: 0.50,
    receivedAt: serverTimestamp(),
    data: {
      rsi: 55,
      macd: 50,
      volume: 200000,
      trend: "sideways"
    }
  }
];

export default function Home() {
  const [alerts, setAlerts] = useState<PairScreenerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingMockData, setAddingMockData] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log('Setting up Firestore listener...');
    try {
      const q = query(
        collection(db, 'pairScreener', 'history', 'alerts'),
        orderBy('receivedAt', 'desc'),
        limit(100)
      );
      console.log('Query created:', q);
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Snapshot received:', snapshot);
          const alertList = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Document data:', data);
            return {
              id: doc.id,
              ...data
            };
          }) as PairScreenerData[];
          
          console.log('Processed alert list:', alertList);
          setAlerts(alertList);
          setError(null);
          setLoading(false);
        },
        (error) => {
          console.error('Error in snapshot listener:', error);
          setError('Failed to fetch alerts. Please try again later.');
          setLoading(false);
        }
      );

      return () => {
        console.log('Cleaning up listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up alert listener:', error);
      setError('Failed to set up alert listener.');
      setLoading(false);
    }
  }, []);

  const addMockData = async () => {
    setAddingMockData(true);
    try {
      for (const data of mockData) {
        await addDoc(collection(db, 'pairScreener', 'history', 'alerts'), data);
      }
      console.log('Mock data added successfully');
    } catch (error) {
      console.error('Error adding mock data:', error);
      setError('Failed to add mock data');
    } finally {
      setAddingMockData(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all alerts? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/delete-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete alerts');
      }

      const result = await response.json();
      alert(`Successfully deleted ${result.deletedCount} alerts`);
    } catch (error) {
      console.error('Error deleting alerts:', error);
      alert('Failed to delete alerts. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pair Screener Alerts History</h1>
          <button
            onClick={addMockData}
            disabled={addingMockData}
            className={`px-6 py-3 rounded-lg ${
              addingMockData
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
            } text-white font-medium shadow-sm`}
          >
            {addingMockData ? 'Adding Mock Data...' : 'Add Mock Data'}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={deleting || alerts.length === 0}
            className={`px-4 py-2 rounded-md text-white ${
              deleting || alerts.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {deleting ? 'Deleting...' : 'Delete All Alerts'}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm">
          Showing {alerts.length} latest alerts (max 100)
        </div>
        
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500 text-lg">No alerts found in the history.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Timeframe
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">
                      {alert.receivedAt?.toDate().toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{alert.pair}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{alert.timeframe}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {alert.price.toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(alert.data || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="font-medium text-gray-500">{key}:</span>
                              <span className={`${
                                typeof value === 'number' 
                                  ? 'text-blue-600 font-medium'
                                  : value === 'up' 
                                    ? 'text-green-600'
                                    : value === 'down'
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                              }`}>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 