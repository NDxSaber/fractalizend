import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Notification from '../../components/ui/Notification';

interface PairData {
  id: string;
  tags: string[];
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function Dashboard() {
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    async function fetchPairs() {
      try {
        const pairsQuery = collection(db, 'pairs');
        const querySnapshot = await getDocs(pairsQuery);
        const pairsData: PairData[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          pairsData.push({
            id: doc.id,
            tags: data.tags || ['forex']
          });
        });
        
        setPairs(pairsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pairs:', err);
        setError('Error fetching pairs. Please try again later.');
        setLoading(false);
        showNotification('Error fetching pairs', 'error');
      }
    }
    
    fetchPairs();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const handleAddTag = async () => {
    if (!selectedPair || !newTag.trim()) return;

    try {
      const pairRef = doc(db, 'pairs', selectedPair);
      const pairDoc = await getDoc(pairRef);
      
      if (pairDoc.exists()) {
        const currentData = pairDoc.data();
        const currentTags = currentData.tags || ['forex'];
        
        if (!currentTags.includes(newTag.trim())) {
          await updateDoc(pairRef, {
            tags: [...currentTags, newTag.trim()]
          });
          
          // Update local state
          setPairs(prevPairs => 
            prevPairs.map(pair => 
              pair.id === selectedPair 
                ? { ...pair, tags: [...pair.tags, newTag.trim()] }
                : pair
            )
          );
          
          showNotification('Tag added successfully', 'success');
        } else {
          showNotification('Tag already exists', 'error');
        }
      }
      
      setNewTag('');
    } catch (err) {
      console.error('Error adding tag:', err);
      showNotification('Error adding tag', 'error');
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!selectedPair) return;

    try {
      const pairRef = doc(db, 'pairs', selectedPair);
      const pairDoc = await getDoc(pairRef);
      
      if (pairDoc.exists()) {
        const currentData = pairDoc.data();
        const currentTags = currentData.tags || ['forex'];
        
        const updatedTags = currentTags.filter((tag: string) => tag !== tagToDelete);
        
        await updateDoc(pairRef, {
          tags: updatedTags
        });
        
        // Update local state
        setPairs(prevPairs => 
          prevPairs.map(pair => 
            pair.id === selectedPair 
              ? { ...pair, tags: updatedTags }
              : pair
          )
        );
        
        showNotification('Tag deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Error deleting tag:', err);
      showNotification('Error deleting tag', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">FractalizeND Dashboard</h1>

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manage Tags</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pairs...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Pairs List */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Available Pairs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {pairs.map((pair) => (
                    <button
                      key={pair.id}
                      onClick={() => setSelectedPair(pair.id)}
                      className={`p-2 rounded-md text-sm font-medium transition-colors ${
                        selectedPair === pair.id
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {pair.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Management */}
              {selectedPair && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Current Tags for {selectedPair}</h3>
                    <div className="flex flex-wrap gap-2">
                      {pairs.find(p => p.id === selectedPair)?.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter new tag"
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 