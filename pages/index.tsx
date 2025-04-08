import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PairScreenerData } from '../types/pairScreener';

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

interface PairTimeframeStatus {
  pair: string;
  timeframes: {
    [key: string]: string; // timeframe: status
  };
  lastUpdated: Date;
}

export default function Home() {
  const [alerts, setAlerts] = useState<PairScreenerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingMockData, setAddingMockData] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pairs, setPairs] = useState<PairTimeframeStatus[]>([]);

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

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const pairsRef = collection(db, 'pairScreener', 'pairs');
        const pairsSnapshot = await getDocs(pairsRef);
        
        const pairPromises = pairsSnapshot.docs.map(async (pairDoc) => {
          const infoDoc = await getDocs(collection(pairsRef, pairDoc.id, 'info'));
          const infoData = infoDoc.docs[0]?.data() || {};
          
          return {
            pair: pairDoc.id,
            timeframes: Object.fromEntries(
              Object.entries(infoData).filter(([key]) => key !== 'lastUpdated')
            ),
            lastUpdated: infoData.lastUpdated?.toDate() || new Date()
          };
        });

        const pairsData = await Promise.all(pairPromises);
        setPairs(pairsData);
      } catch (error) {
        console.error('Error fetching pairs:', error);
        setError('Error fetching pairs');
      }
    };

    fetchPairs();
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">FractalizeND Screener</h1>
      
      {/* Search and Controls */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search pairs..."
          className="p-2 border rounded mr-4"
        />
        <label className="inline-flex items-center">
          <span className="mr-2">Swing is</span>
          <div className="relative inline-block w-12 h-6 rounded-full bg-gray-300">
            <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white"></div>
          </div>
          <span className="ml-2">OFF</span>
        </label>
      </div>

      {/* Pairs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {pairs.map((pair) => (
          <div key={pair.pair} className="border rounded-lg p-4 shadow">
            <h2 className="text-xl font-bold mb-4">{pair.pair}</h2>
            
            {/* Structure, MA, Can indicators */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <div className="text-sm">Val:</div>
                <div className="h-2 bg-gray-300 rounded"></div>
                <div className="text-sm mt-1">Con:</div>
                <div className="h-2 bg-gray-300 rounded"></div>
              </div>
              <div>
                <div className="text-sm">Structure</div>
                <div className="h-2 bg-gray-300 rounded"></div>
                <div className="h-2 bg-gray-300 rounded mt-4"></div>
              </div>
              <div>
                <div className="text-sm">MA</div>
                <div className="h-2 bg-gray-300 rounded"></div>
                <div className="h-2 bg-gray-300 rounded mt-4"></div>
              </div>
            </div>

            {/* Timeframes Grid */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(pair.timeframes).map(([timeframe, status]) => (
                <div key={timeframe} className="text-sm">
                  <span className="font-medium">{timeframe}:</span>
                  <div 
                    className={`h-2 rounded mt-1 ${
                      status === 'Bullish' ? 'bg-green-500' : 
                      status === 'Bearish' ? 'bg-red-500' : 
                      'bg-gray-300'
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Time</th>
              <th className="px-4 py-2 border">Pair</th>
              <th className="px-4 py-2 border">Timeframe</th>
              <th className="px-4 py-2 border">Signal</th>
              <th className="px-4 py-2 border">Price</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td className="px-4 py-2 border">
                  {alert.receivedAt?.toDate().toLocaleString()}
                </td>
                <td className="px-4 py-2 border">{alert.pair}</td>
                <td className="px-4 py-2 border">{alert.timeframe}</td>
                <td className="px-4 py-2 border">
                  <span className={alert.data?.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {alert.data?.direction === 'up' ? 'BUY' : 'SELL'}
                  </span>
                </td>
                <td className="px-4 py-2 border">{alert.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 