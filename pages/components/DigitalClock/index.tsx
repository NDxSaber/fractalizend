'use client';

import { useState, useEffect } from 'react';
import styles from './DigitalClock.module.css';

export default function DigitalClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\./g, ':');
      setTime(formattedTime);
    };

    // Initial update
    updateTime();

    // Update every second
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.clock}>
      {time || '--:--:--'}
    </div>
  );
} 