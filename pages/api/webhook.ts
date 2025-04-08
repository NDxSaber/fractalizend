import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Add timestamp to the webhook data
    const dataWithTimestamp = {
      ...webhookData,
      receivedAt: FieldValue.serverTimestamp()
    };

    // Store the webhook data in Firestore using Admin SDK
    const docRef = await adminDb.collection('webhooks').add(dataWithTimestamp);
    
    return res.status(200).json({
      success: true,
      id: docRef.id
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 