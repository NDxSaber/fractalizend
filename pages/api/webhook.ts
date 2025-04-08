import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface WebhookData {
  pair: string;
  timeframe: string;
  timestamp: string;
  data?: {
    direction: string;
    [key: string]: any;
  };
}

// for testing only
// curl -X POST https://fractalizend.vercel.app/api/webhook \
// -H "Content-Type: application/json" \
// -d '{
//   "pair": "testing",
//   "timeframe": "1H",
//   "timestamp": "2023-10-25T14:30:45.000Z",
//   "data": {
//     "direction": "up"
//   }
// }'

// curl -X POST http://localhost:3000/api/webhook \
// -H "Content-Type: application/json" \
// -d '{
//   "pair": "btcusd",
//   "timeframe": "1m",
//   "timestamp": "2023-10-25T14:30:45.000Z",
//   "data": {
//     "direction": "down"
//   }
// }'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔔 Webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { pair, timeframe, timestamp, data } = req.body;
    console.log('📦 Received webhook data:', { pair, timeframe, timestamp, data });

    if (!pair || !timeframe || !timestamp || !data?.direction) {
      console.log('❌ Missing required fields:', { pair, timeframe, timestamp, data });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const direction = data.direction;
    console.log('📊 Using direction from data:', direction);

    // Reference to the pair document
    const pairRef = doc(db, 'pairs', pair);
    console.log('📚 Using pair reference:', pairRef.path);

    const pairDoc = await getDoc(pairRef);
    console.log('📄 Pair document exists:', pairDoc.exists());

    // Create or update the pair document
    if (!pairDoc.exists()) {
      console.log('➕ Creating new pair document');
      const newPairData = {
        directionTimeframe: {
          [timeframe]: direction
        },
        history: [{
          direction: direction,
          timeframe: timeframe,
          timestamp: timestamp
        }]
      };
      console.log('📝 New pair data:', newPairData);

      await setDoc(pairRef, newPairData);
      console.log('✅ Created new pair document for', pair);
    } else {
      console.log('🔄 Updating existing pair document');
      const currentData = pairDoc.data();
      console.log('📊 Current pair data:', currentData);
      
      // Update directionTimeframe
      const updatedDirectionTimeframe = {
        ...currentData.directionTimeframe,
        [timeframe]: direction
      };
      console.log('📈 Updated directionTimeframe:', updatedDirectionTimeframe);

      // Add new history entry
      const newHistoryEntry = {
        direction: direction,
        timeframe: timeframe,
        timestamp: timestamp
      };
      console.log('📝 New history entry:', newHistoryEntry);

      // Get current history and limit to 100 entries
      const currentHistory = currentData.history || [];
      const updatedHistory = [newHistoryEntry, ...currentHistory].slice(0, 100);
      console.log('📊 Updated history length:', updatedHistory.length);

      await updateDoc(pairRef, {
        directionTimeframe: updatedDirectionTimeframe,
        history: updatedHistory
      });
      console.log('✅ Updated pair document for', pair);
    }

    console.log('🎉 Webhook processing completed successfully');
    return res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
} 
