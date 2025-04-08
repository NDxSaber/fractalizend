import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import styles from './Screener.module.css';

interface PairData {
  id: string;
  directionTimeframe: {
    [key: string]: string;
  };
  history: Array<{
    price: number;
    direction: string;
    timeframe: string;
    timestamp: string;
  }>;
}

export default function Screener() {
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const pairsQuery = query(collection(db, 'pairs'));
    
    const unsubscribe = onSnapshot(
      pairsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setPairs([]);
          setLoading(false);
          return;
        }
        
        const pairsData = snapshot.docs.map(doc => ({
          id: doc.id,
          directionTimeframe: doc.data().directionTimeframe || {},
          history: doc.data().history || []
        })) as PairData[];

        setPairs(pairsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pairs:', err);
        setError('Error fetching pairs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getIndicatorClass = (direction: string) => {
    switch (direction?.toLowerCase()) {
      case 'up':
        return styles.indicatorBar + ' ' + styles.bullish;
      case 'down':
        return styles.indicatorBar + ' ' + styles.bearish;
      default:
        return styles.indicatorBar + ' ' + styles.neutral;
    }
  };

  const filteredPairs = pairs.filter(pair => 
    pair.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pairs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded bg-red-100 text-red-700">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search pairs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredPairs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No pairs found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPairs.map((pair) => (
            <div key={pair.id} className={styles.pairCard}>
              <div className={styles.pairHeader}>
                <span className={styles.pairName}>{pair.id}</span>
              </div>
              
              <div className={styles.timeframeContainer}>
                {Object.entries(pair.directionTimeframe || {}).map(([timeframe, direction]) => (
                  <div key={timeframe} className={styles.timeframeItem}>
                    <span className={styles.timeframeLabel}>{getTimeframeName(timeframe)}</span>
                    <div className={getIndicatorClass(direction)} title={`${timeframe}: ${direction}`} />
                  </div>
                ))}
              </div>
              
              {Object.keys(pair.directionTimeframe || {}).length === 0 && (
                <p className="text-gray-500 text-sm p-2">No timeframes available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getTimeframeName = (timeframe: string) => {
  if (timeframe === "1") return '1m';
  if (timeframe === "5") return '5m';
  if (timeframe === "15") return '15m';
  if (timeframe === "30") return '30m';
  if (timeframe === "60") return '1H';
  if (timeframe === "240") return '4H';
  if (timeframe === "D") return '1D';
  if (timeframe === "W") return '1W';
  if (timeframe === "M") return '1M';
  return timeframe;
};