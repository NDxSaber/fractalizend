import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../../../lib/firebase';
import styles from './Screener.module.css';

interface PairData {
  id: string;
  directionTimeframe: {
    [key: string]: string; // timeframe: direction
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
    console.log('🔔 Setting up real-time listener for pairs...');
    
    const pairsQuery = query(collection(db, 'pairs'));
    
    const unsubscribe = onSnapshot(
      pairsQuery,
      (snapshot) => {
        console.log('📡 Received real-time update');
        
        if (snapshot.empty) {
          console.log('⚠️ No pairs found in the collection');
          setPairs([]);
          setLoading(false);
          return;
        }
        
        const pairsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`📦 Processing pair ${doc.id}:`, data);
          
          return {
            id: doc.id,
            directionTimeframe: data.directionTimeframe || {},
            history: data.history || []
          } as PairData;
        });

        console.log('✅ Updated pairs data:', pairsData);
        setPairs(pairsData);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error in real-time listener:', err);
        if (err instanceof FirebaseError) {
          console.error('🔥 Firebase error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
          });
        } else {
          console.error('🔥 Unknown error:', err);
        }
        setError('Error fetching pairs');
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up real-time listener');
      unsubscribe();
    };
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
                    <span className={styles.timeframeLabel}>{timeframe}</span>
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
} 