import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { sendTelegramNotification } from '../../lib/telegram';

interface WebhookData {
  pair: string;
  timeframe: string;
  timestamp: string;
  data?: {
    direction: string;
    confirmationStatus?: string;
    type: string; // "direction" or "confirmation"
    [key: string]: any;
  };
}

// CONTEXT JSON EXAMPLE
// curl -X POST http://localhost:3000/api/webhook \
// -H "Content-Type: application/json" \
// -d '{"pair": "AUDJPY", "timeframe": "D", "timestamp": "2025-04-09 21:00", "data": { "direction": "up", "type": "direction" }}'

// CONFIRMATION JSON EXAMPLE
// curl -X POST http://localhost:3000/api/webhook \
// -H "Content-Type: application/json" \
// -d '{"pair": "AUDJPY", "timeframe": "D", "timestamp": "2025-04-09 21:00", "data": { "confirmationStatus": "ready", "type": "confirmation" }}'

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

    if (!pair || !timeframe || !timestamp || !data?.type) {
      console.log('❌ Missing required fields:', { pair, timeframe, timestamp, data });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const type = data.type;
    console.log('📊 Using data type:', type);

    // Reference to the pair document
    const pairRef = doc(db, 'pairs', pair);
    console.log('📚 Using pair reference:', pairRef.path);

    const pairDoc = await getDoc(pairRef);
    console.log('📄 Pair document exists:', pairDoc.exists());

    if (type === "direction") {
      if (!data?.direction) {
        console.log('❌ Missing direction field for direction type');
        return res.status(400).json({ message: 'Missing direction field' });
      }

      const direction = data.direction;
      console.log('📊 Using direction:', direction);

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

        if ((pair === 'XAUUSD' || pair === 'USDJPY' || pair === 'US100') && timeframe === '30') {
          await sendTelegramNotification(telegramMessage);
          console.log('📢 Sent Telegram notification for direction change');
        }
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
    } else if (type === "confirmation") {
      if (!data?.confirmationStatus) {
        console.log('❌ Missing confirmationStatus field for confirmation type');
        return res.status(400).json({ message: 'Missing confirmationStatus field' });
      }

      const confirmationStatus = data.confirmationStatus;
      console.log('🔍 Confirmation status:', confirmationStatus);

      // Send confirmation notification
      const telegramMessage = `
<b>====🚨🚨🚨 ✅ CONFIRMATION UPDATE ✅ 🚨🚨🚨====</b>
Pair: ${pair}
Timeframe: ${timeframe}
Status: ${confirmationStatus === "ready" ? 'Ready to Trade 🚀' : 'Not Ready ⏳'}

Timestamp: ${timestamp}
      `.trim();

      if ((pair === 'XAUUSD' || pair === 'USDJPY' || pair === 'US100') && confirmationStatus === 'ready' && timeframe === '5') {
        await sendTelegramNotification(telegramMessage);
        console.log('📢 Sent Telegram notification for confirmation update');
      }

      // Update confirmationTimeframe
      if (!pairDoc.exists()) {
        console.log('➕ Creating new pair document with confirmation');
        const newPairData = {
          confirmationTimeframe: {
            [timeframe]: confirmationStatus
          }
        };
        await setDoc(pairRef, newPairData);
      } else {
        console.log('🔄 Updating confirmation status');
        const currentData = pairDoc.data();
        const updatedConfirmationTimeframe = {
          ...currentData.confirmationTimeframe,
          [timeframe]: confirmationStatus
        };
        await updateDoc(pairRef, {
          confirmationTimeframe: updatedConfirmationTimeframe
        });
      }
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
