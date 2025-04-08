import { Timestamp } from 'firebase/firestore';

export interface PairScreenerData {
  id: string;
  pair: string;
  timeframe: string;
  price: number;
  receivedAt: Timestamp;
  data?: {
    [key: string]: any;
  };
} 