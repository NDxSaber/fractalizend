import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface WebhookData {
  pair: string;
  timeframe: string;
  price: number;
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
//   "price": 50000.50,
//   "data": {
//     "direction": "up"
//   }
// }'

// curl -X POST http://localhost:3000/api/webhook \
// -H "Content-Type: application/json" \
// -d '{
//   "pair": "btcusd",
//   "timeframe": "1m",
//   "price": 50000.50,
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
    const { pair, timeframe, price, data } = req.body;
    console.log('📦 Received webhook data:', { pair, timeframe, price, data });

    if (!pair || !timeframe || !price || !data?.direction) {
      console.log('❌ Missing required fields:', { pair, timeframe, price, data });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const direction = data.direction;
    console.log('📊 Using direction from data:', direction);

    // Format timestamp as YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const formattedTimestamp = now.getFullYear() + '-' + 
                               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(now.getDate()).padStart(2, '0') + ' ' + 
                               String(now.getHours()).padStart(2, '0') + ':' + 
                               String(now.getMinutes()).padStart(2, '0') + ':' + 
                               String(now.getSeconds()).padStart(2, '0');
    
    console.log('⏰ Formatted timestamp:', formattedTimestamp);

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
          price: parseFloat(price),
          direction: direction,
          timeframe: timeframe,
          timestamp: formattedTimestamp
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
        price: parseFloat(price),
        direction: direction,
        timeframe: timeframe,
        timestamp: formattedTimestamp
      };
      console.log('📝 New history entry:', newHistoryEntry);

      await updateDoc(pairRef, {
        directionTimeframe: updatedDirectionTimeframe,
        history: arrayUnion(newHistoryEntry)
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
