import { useState, useEffect } from 'react';
import styles from './DigitalClock.module.css';

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, ':');

  return (
    <div className={styles.clock}>
      {formattedTime}
    </div>
  );
} 