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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookData = req.body as WebhookData;
    
    // Validate required fields
    if (!webhookData.pair || !webhookData.timeframe || !webhookData.price) {
      return res.status(400).json({ 
        message: 'Missing required fields: pair, timeframe, and price are required' 
      });
    }

    // Add timestamp to the webhook data
    const dataWithTimestamp = {
      ...webhookData,
      receivedAt: FieldValue.serverTimestamp()
    };

    // Get the alerts collection reference
    const alertsRef = adminDb.collection('pairScreener').doc('history').collection('alerts');
    
    // Get the current count of documents
    const countSnapshot = await alertsRef.count().get();
    const currentCount = countSnapshot.data().count;

    // If we have more than 100 entries, delete the oldest one
    if (currentCount >= 100) {
      const oldestQuery = await alertsRef
        .orderBy('receivedAt', 'asc')
        .limit(1)
        .get();

      if (!oldestQuery.empty) {
        const oldestDoc = oldestQuery.docs[0];
        await oldestDoc.ref.delete();
      }
    }

    // Add the new alert to history
    await alertsRef.add(dataWithTimestamp);
    
    return res.status(200).json({
      success: true,
      message: 'Alert saved to history successfully'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 