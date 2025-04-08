import { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const mockData = [
  {
    pair: "BTCUSDT",
    timeframe: "1H",
    signal: "BUY",
    price: 50000.50,
    timestamp: serverTimestamp()
  },
  {
    pair: "ETHUSDT",
    timeframe: "4H",
    signal: "SELL",
    price: 2500.75,
    timestamp: serverTimestamp()
  },
  {
    pair: "SOLUSDT",
    timeframe: "1D",
    signal: "BUY",
    price: 100.25,
    timestamp: serverTimestamp()
  },
  {
    pair: "BNBUSDT",
    timeframe: "1H",
    signal: "SELL",
    price: 350.00,
    timestamp: serverTimestamp()
  },
  {
    pair: "ADAUSDT",
    timeframe: "4H",
    signal: "BUY",
    price: 0.50,
    timestamp: serverTimestamp()
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const results = [];
    for (const data of mockData) {
      const docRef = await addDoc(collection(db, 'pairScreener'), data);
      results.push({ id: docRef.id, ...data });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mock data added successfully',
      data: results
    });
  } catch (error) {
    console.error('Error adding mock data:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 