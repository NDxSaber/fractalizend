import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { sendTelegramNotification } from '../../lib/telegram';

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

    // Check if direction has changed
    let shouldNotify = true;
    if (pairDoc.exists()) {
      const currentData = pairDoc.data();
      const previousDirection = currentData.directionTimeframe?.[timeframe];
      console.log('Previous direction:', previousDirection, 'New direction:', direction);
      
      if (previousDirection === direction) {
        console.log('Direction unchanged, skipping notification');
        shouldNotify = false;
      }
    }

    // Send notification only if direction has changed
    if (shouldNotify) {
      const telegramMessage = `
<b>=========⭐ CONTEXT is CHANGED ⭐=========</b>
Pair: ${pair}
Timeframe: ${timeframe}
Direction: ${direction === "up" ? 'Bullish 🟢' : direction === "down" ? 'Bearish 🔴' : 'Neutral 🟡'}

Timestamp: ${timestamp}
      `.trim();

      await sendTelegramNotification(telegramMessage);
      console.log('📢 Sent Telegram notification for direction change');
    }

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
