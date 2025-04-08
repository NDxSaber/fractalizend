import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PairScreenerData {
  id: string;
  pair: string;
  timeframe: string;
  signal: string;
  price: number;
  timestamp: any;
  [key: string]: any;
}

const mockData = [
  {
    pair: "BTCUSDT",
    timeframe: "1H",
    signal: "BUY",
    price: 50000.50,
    timestamp: serverTimestamp()
  },
  {
    pair: "ETHUSDT",
    timeframe: "4H",
    signal: "SELL",
    price: 2500.75,
    timestamp: serverTimestamp()
  },
  {
    pair: "SOLUSDT",
    timeframe: "1D",
    signal: "BUY",
    price: 100.25,
    timestamp: serverTimestamp()
  },
  {
    pair: "BNBUSDT",
    timeframe: "1H",
    signal: "SELL",
    price: 350.00,
    timestamp: serverTimestamp()
  },
  {
    pair: "ADAUSDT",
    timeframe: "4H",
    signal: "BUY",
    price: 0.50,
    timestamp: serverTimestamp()
  }
];

export default function Home() {
  const [alerts, setAlerts] = useState<PairScreenerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingMockData, setAddingMockData] = useState(false);

  useEffect(() => {
    console.log('Setting up Firestore listener...');
    try {
      const q = query(collection(db, 'pairScreener'), orderBy('timestamp', 'desc'));
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
        await addDoc(collection(db, 'pairScreener'), data);
      }
      console.log('Mock data added successfully');
    } catch (error) {
      console.error('Error adding mock data:', error);
      setError('Failed to add mock data');
    } finally {
      setAddingMockData(false);
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pair Screener Alerts</h1>
          <button
            onClick={addMockData}
            disabled={addingMockData}
            className={`px-4 py-2 rounded ${
              addingMockData
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium`}
          >
            {addingMockData ? 'Adding Mock Data...' : 'Add Mock Data'}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No alerts found in the database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeframe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.timestamp?.toDate().toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{alert.pair}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{alert.timeframe}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        alert.signal === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {alert.signal}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alert.price.toLocaleString()}
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