import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import styles from './Screener.module.css';
// We can manually add these icons for now since react-icons isn't installed
// Star icon for bookmarked
const FaStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="text-yellow-400 w-5 h-5">
    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
  </svg>
);

// Empty star icon for not bookmarked
const FaRegStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="text-gray-400 hover:text-yellow-400 w-5 h-5">
    <path d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"/>
  </svg>
);

interface PairData {
  id: string;
  directionTimeframe: {
    [key: string]: string;
  };
  history: Array<{
    direction: string;
    timeframe: string;
    timestamp: string;
  }>;
  bookmarked?: boolean;
  tags: string[];
  lastUpdated: string;
  confirmationTimeframe?: {
    [key: string]: string;
  };
}

interface BookmarksData {
  pairs: string[];
}

const BOOKMARKS_DOC_ID = 'user_bookmarks';

interface ScreenerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function Screener({ selectedTags, onTagsChange }: ScreenerProps) {
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedPairs, setBookmarkedPairs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'bookmarked' | 'name'>('bookmarked');
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const availableTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  // Fetch pairs and bookmarks
  useEffect(() => {
    setLoading(true);
    
    // First, get bookmarks
    const fetchBookmarks = async () => {
      try {
        const bookmarksDoc = await getDoc(doc(db, 'bookmarks', BOOKMARKS_DOC_ID));
        if (bookmarksDoc.exists()) {
          const data = bookmarksDoc.data() as BookmarksData;
          setBookmarkedPairs(data.pairs || []);
        } else {
          // Initialize empty bookmarks
          await setDoc(doc(db, 'bookmarks', BOOKMARKS_DOC_ID), { pairs: [] });
          setBookmarkedPairs([]);
        }
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setBookmarkedPairs([]);
      }
    };
    
    fetchBookmarks();
    
    // Then fetch pairs with real-time updates
    const pairsQuery = query(collection(db, 'pairs'));
    
    const unsubscribe = onSnapshot(
      pairsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setPairs([]);
          setLoading(false);
          return;
        }
        
        const pairsData = snapshot.docs.map(doc => {
          const pairId = doc.id;
          return {
            id: pairId,
            directionTimeframe: doc.data().directionTimeframe || {},
            history: doc.data().history || [],
            bookmarked: bookmarkedPairs.includes(pairId),
            tags: doc.data().tags || ['forex'],
            lastUpdated: doc.data().lastUpdated || new Date().toISOString(),
            confirmationTimeframe: doc.data().confirmationTimeframe || {}
          };
        }) as PairData[];

        setPairs(pairsData);
        
        // Extract unique tags from all pairs
        const uniqueTags = Array.from(
          new Set(pairsData.flatMap(pair => pair.tags))
        ).sort();
        setAvailableTags(uniqueTags);
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pairs:', err);
        setError('Error fetching pairs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookmarkedPairs.length]);

  // Update bookmarked status when bookmarkedPairs changes
  useEffect(() => {
    setPairs(currentPairs => 
      currentPairs.map(pair => ({
        ...pair,
        bookmarked: bookmarkedPairs.includes(pair.id)
      }))
    );
  }, [bookmarkedPairs]);

  const toggleBookmark = async (pairId: string) => {
    if (savingBookmark) return;
    
    setSavingBookmark(true);
    try {
      const isCurrentlyBookmarked = bookmarkedPairs.includes(pairId);
      let newBookmarkedPairs: string[];
      
      if (isCurrentlyBookmarked) {
        // Remove from bookmarks
        newBookmarkedPairs = bookmarkedPairs.filter(id => id !== pairId);
      } else {
        // Add to bookmarks
        newBookmarkedPairs = [...bookmarkedPairs, pairId];
      }
      
      // Update Firestore
      await setDoc(doc(db, 'bookmarks', BOOKMARKS_DOC_ID), { pairs: newBookmarkedPairs });
      
      // Update state
      setBookmarkedPairs(newBookmarkedPairs);
    } catch (err) {
      console.error('Error updating bookmark:', err);
    } finally {
      setSavingBookmark(false);
    }
  };

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

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const handleTimeframeToggle = (timeframe: string) => {
    setSelectedTimeframes(prev => {
      if (prev.includes(timeframe)) {
        return prev.filter(tf => tf !== timeframe);
      } else {
        return [...prev, timeframe];
      }
    });
  };

  // Filter pairs based on search term and selected tags only
  const filteredPairs = pairs
    .filter(pair => {
      const matchesSearch = pair.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => pair.tags.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      if (sortBy === 'bookmarked') {
        if (a.bookmarked && !b.bookmarked) return -1;
        if (!a.bookmarked && b.bookmarked) return 1;
      }
      return a.id.localeCompare(b.id);
    });

  // Helper function to filter timeframes for a pair
  const getFilteredTimeframes = (pair: PairData) => {
    if (!pair.directionTimeframe) return {};
    
    if (selectedTimeframes.length === 0) {
      return pair.directionTimeframe;
    }
    
    // Convert timeframe format if needed (e.g., "1" to "1m")
    const formatTimeframe = (tf: string) => {
      if (tf === "1") return "1m";
      if (tf === "5") return "5m";
      if (tf === "15") return "15m";
      if (tf === "30") return "30m";
      if (tf === "60") return "1h";
      if (tf === "240") return "4h";
      if (tf === "D") return "1d";
      return tf;
    };

    const filtered: { [key: string]: string } = {};
    Object.entries(pair.directionTimeframe).forEach(([tf, direction]) => {
      const formattedTf = formatTimeframe(tf);
      if (selectedTimeframes.includes(formattedTf)) {
        filtered[tf] = direction;
      }
    });
    return filtered;
  };

  const getConfirmationStatus = (pair: PairData, timeframe: string) => {
    const confirmationStatus = pair.confirmationTimeframe?.[timeframe];
    const direction = pair.directionTimeframe?.[timeframe];

  console.log('>>>> confirmationStatus', confirmationStatus, direction);
    if (confirmationStatus === "ready") {
      if (direction === "up") {
        return styles.indicatorPullbackBar + ' ' + styles.bullish;
      } else if (direction === "down") {
        return styles.indicatorPullbackBar + ' ' + styles.bearish;
      }
    }
    return styles.indicatorPullbackBar + ' ' + styles.neutral;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading pairs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Timeframes</h3>
          <div className={styles.timeframeFilters}>
            {availableTimeframes.map(timeframe => (
              <button
                key={timeframe}
                className={`${styles.timeframeButton} ${
                  selectedTimeframes.includes(timeframe) ? styles.selected : ''
                }`}
                onClick={() => handleTimeframeToggle(timeframe)}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Tags</h3>
          <div className={styles.tagFilters}>
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tagButton} ${
                  selectedTags.includes(tag) ? styles.selected : ''
                }`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bookmarkedPairs.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {bookmarkedPairs.length} bookmarked {bookmarkedPairs.length === 1 ? 'pair' : 'pairs'}
          </p>
        </div>
      )}

      {filteredPairs.length === 0 ? (
        <div className={styles.noResults}>
          <p>No pairs found matching your criteria.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPairs.map((pair) => {
            const filteredTimeframes = getFilteredTimeframes(pair);
            const hasTimeframes = Object.keys(filteredTimeframes).length > 0;

            return (
              <div key={pair.id} className={`${styles.pairCard} ${pair.bookmarked ? styles.bookmarked : ''}`}>
                <div className={styles.pairHeader}>
                  <span className={styles.pairName}>{pair.id}</span>
                  <button 
                    onClick={() => toggleBookmark(pair.id)}
                    className={styles.bookmarkButton}
                    disabled={savingBookmark}
                    aria-label={pair.bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    {pair.bookmarked ? <FaStar /> : <FaRegStar />}
                  </button>
                </div>
                
                {hasTimeframes ? (
                  <div className={styles.timeframeContainer}>
                    {Object.entries(filteredTimeframes).map(([timeframe, direction]) => (
                      <div key={timeframe} className={styles.timeframeItem}>
                        <span className={styles.timeframeLabel}>{getTimeframeName(timeframe)}</span>
                        <div className={getIndicatorClass(direction)} title={`${timeframe}: ${direction}`} />
                        <div className={getConfirmationStatus(pair, timeframe)} title={`${timeframe}: ${pair.confirmationTimeframe?.[timeframe]}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noTimeframes}>No timeframes available</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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