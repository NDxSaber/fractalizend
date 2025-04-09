import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Screener from './components/Screener';

interface BookmarksData {
  pairs: string[];
}

interface AlertData {
  id: string;
  direction: string;
  timeframe: string;
  timestamp: string;
}

export default function Home() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedPairs, setBookmarkedPairs] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch alerts
        const alertsQuery = query(
          collection(db, 'pairs'),
          orderBy('history.0.timestamp', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(alertsQuery);
        const alertsData: AlertData[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.history && data.history.length > 0) {
            alertsData.push({
              id: doc.id,
              ...data.history[0]
            });
          }
        });
        
        setAlerts(alertsData);

        // Fetch bookmarked pairs
        const bookmarksDoc = await getDoc(doc(db, 'bookmarks', 'user_bookmarks'));
        if (bookmarksDoc.exists()) {
          const data = bookmarksDoc.data() as BookmarksData;
          setBookmarkedPairs(data.pairs || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const formatDate = (timestamp: string): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Function to handle bookmark click
  const handleBookmarkClick = (pairId: string) => {
    const searchElement = document.getElementById('pairSearch') as HTMLInputElement;
    if (searchElement) {
      searchElement.value = pairId;
      // Trigger the change event to update the search
      const event = new Event('input', { bubbles: true });
      searchElement.dispatchEvent(event);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Trading Dashboard</h1>

      <div className="grid grid-cols-1 gap-8">
        {bookmarkedPairs.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Your Bookmarked Pairs</h2>
            <p className="text-sm text-gray-600 mb-4">Quick access to your favorite pairs.</p>
            <div className="flex flex-wrap gap-2">
              {bookmarkedPairs.map((pairId) => (
                <a 
                  key={pairId}
                  href="#screener"
                  onClick={() => handleBookmarkClick(pairId)}
                  className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
                >
                  {pairId}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2" id="screener">Pairs Overview</h2>
          <Screener />
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Recent Alerts</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading alerts...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              <p>{error}</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No recent alerts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.direction?.toLowerCase() === 'up' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {alert.direction?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.timeframe}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(alert.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 