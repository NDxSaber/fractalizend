import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
//     "rsi": 65,
//     "macd": 120,
//     "volume": 1500000,
//     "trend": "up"
//   }
// }'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔔 Webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookData = req.body as WebhookData;
    console.log('📦 Parsed webhook data:', webhookData);
    
    // Validate required fields
    if (!webhookData.pair || !webhookData.timeframe || !webhookData.price) {
      console.log('❌ Missing required fields:', {
        pair: webhookData.pair,
        timeframe: webhookData.timeframe,
        price: webhookData.price
      });
      return res.status(400).json({ 
        message: 'Missing required fields: pair, timeframe, and price are required' 
      });
    }

    // Add timestamp to the webhook data
    const dataWithTimestamp = {
      ...webhookData,
      receivedAt: FieldValue.serverTimestamp()
    };
    console.log('⏰ Data with timestamp:', dataWithTimestamp);

    // Get the alerts collection reference
    const alertsRef = adminDb.collection('pairScreener').doc('history').collection('alerts');
    console.log('📚 Using collection reference:', alertsRef.path);
    
    // Get the current count of documents
    const countSnapshot = await alertsRef.count().get();
    const currentCount = countSnapshot.data().count;
    console.log('📊 Current alert count:', currentCount);

    // If we have more than 100 entries, delete the oldest one
    if (currentCount >= 100) {
      console.log('🗑️ Deleting oldest alert (limit reached)');
      const oldestQuery = await alertsRef
        .orderBy('receivedAt', 'asc')
        .limit(1)
        .get();

      if (!oldestQuery.empty) {
        const oldestDoc = oldestQuery.docs[0];
        console.log('🗑️ Found oldest document to delete:', oldestDoc.id);
        await oldestDoc.ref.delete();
        console.log('✅ Oldest document deleted successfully');
      }
    }

    // Add the new alert to history
    console.log('➕ Adding new alert to history');
    const docRef = await alertsRef.add(dataWithTimestamp);
    console.log('✅ Alert added successfully with ID:', docRef.id);
    
    return res.status(200).json({
      success: true,
      message: 'Alert saved to history successfully',
      alertId: docRef.id
    });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 