import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Screener from './components/Screener';

interface BookmarksData {
  pairs: string[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedPairs, setBookmarkedPairs] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
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
      <h1 className="text-3xl font-bold mb-8 text-center">FractalizeND</h1>

      <div className="grid grid-cols-1 gap-8">

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2" id="screener">Screener</h2>
          <Screener />
        </div>
      </div>
    </div>
  );
} 