import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendWhatsAppAlert } from '../../lib/whatsapp';

interface WebhookData {
  pair: string;
  timeframe: string;
  price: number;
  data?: {
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
//     "direction": "up",
//   }
// }'

// curl -X POST http://localhost:3000/api/webhook \
// -H "Content-Type: application/json" \
// -d '{
//   "pair": "test",
//   "timeframe": "1m",
//   "price": 50000.50,
//   "data": {
//     "direction": "up",
//   }
// }'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook received:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    const { pair, timeframe, price, data } = req.body;

    // Add timestamp to the data
    const dataWithTimestamp = {
      ...req.body,
      receivedAt: FieldValue.serverTimestamp()
    };

    console.log('⏰ Data with timestamp:', dataWithTimestamp);

    // 1. Add to main history collection
    const historyRef = adminDb.collection('pairScreener').doc('history').collection('alerts');
    console.log('📚 Using collection reference: pairScreener/history/alerts');

    // 2. Create or update pair-specific collection
    const pairRef = adminDb.collection('pairScreener').doc('pairs').collection(pair).doc('history').collection('alerts');
    console.log(`📚 Using pair-specific collection reference: pairScreener/pairs/${pair}/history/alerts`);

    // 3. Analyze timeframe data and determine trend
    const analyzeTimeframe = (data: any) => {
      const { direction } = data;
      let timeframeStatus = 'Normal';

      if (direction === 'up') {
        timeframeStatus = 'Bullish';
      } else if (direction === 'down') {
        timeframeStatus = 'Bearish';
      }

      return timeframeStatus;
    };

    const timeframeStatus = analyzeTimeframe(data);
    console.log(`📊 Timeframe analysis for ${pair} ${timeframe}: ${timeframeStatus} (based on direction: ${data.direction})`);

    // 4. Update pair document with timeframe status
    const pairDocRef = adminDb.collection('pairScreener').doc('pairs').collection(pair).doc('info');
    await pairDocRef.set({
      [timeframe]: timeframeStatus,
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✅ Updated pair document with ${timeframe} status: ${timeframeStatus}`);

    // 5. Add to pair-specific history
    const pairHistoryDoc = await pairRef.add(dataWithTimestamp);
    console.log(`✅ Added to pair-specific history with ID: ${pairHistoryDoc.id}`);

    // 6. Add to main history
    const historyDoc = await historyRef.add(dataWithTimestamp);
    console.log(`✅ Added to main history with ID: ${historyDoc.id}`);

    // 7. Check and maintain history limit
    const historySnapshot = await historyRef.count().get();
    const currentCount = historySnapshot.data().count;
    console.log(`📊 Current alert count: ${currentCount}`);

    if (currentCount > 100) {
      const oldestDoc = await historyRef.orderBy('receivedAt').limit(1).get();
      if (!oldestDoc.empty) {
        await oldestDoc.docs[0].ref.delete();
        console.log('🗑️ Deleted oldest alert to maintain limit');
      }
    }

    // 8. Send WhatsApp notification
    try {
      await sendWhatsAppAlert({
        pair,
        timeframe,
        price,
        signal: timeframeStatus
      });
      console.log('📱 WhatsApp notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send WhatsApp notification:', error);
    }

    return res.status(200).json({ 
      success: true, 
      historyId: historyDoc.id,
      pairHistoryId: pairHistoryDoc.id,
      timeframeStatus
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
