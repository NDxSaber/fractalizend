import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import styles from './VibrationalDatesPreview.module.css';

interface VibrationalDate {
  id: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  name: string;
  description: string;
}

export default function VibrationalDatesPreview() {
  const [dates, setDates] = useState<VibrationalDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const datesQuery = query(collection(db, 'vibrationalDates'), orderBy('fromDate', 'asc'));
    
    const unsubscribe = onSnapshot(datesQuery, (snapshot) => {
      const datesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VibrationalDate[];
      
      setDates(datesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const today = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + 7);
  
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const isNews = (date: VibrationalDate) => {
    return date.fromDate === date.toDate;
  };

  const isToday = (date: VibrationalDate) => {
    const dateObj = new Date(date.fromDate);
    return dateObj.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: VibrationalDate) => {
    const dateObj = new Date(date.fromDate);
    return dateObj >= today && dateObj <= endOfWeek;
  };

  const isCurrentSeason = (date: VibrationalDate) => {
    const fromDate = new Date(date.fromDate);
    const toDate = new Date(date.toDate);
    return fromDate <= today && toDate >= today;
  };

  const isNextMonthSeason = (date: VibrationalDate) => {
    const fromDate = new Date(date.fromDate);
    return fromDate > today && fromDate <= endOfMonth;
  };

  const todayNews = dates.filter(date => isNews(date) && isToday(date));
  const weekNews = dates.filter(date => isNews(date) && isThisWeek(date));
  const currentSeasons = dates.filter(date => !isNews(date) && isCurrentSeason(date));
  const nextMonthSeasons = dates.filter(date => !isNews(date) && isNextMonthSeason(date));

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's News</h2>
        {todayNews.length > 0 ? (
          <div className={styles.newsList}>
            {todayNews.map(date => (
              <div key={date.id} className={styles.newsItem}>
                <span className={styles.time}>
                  {new Date(`${date.fromDate}T${date.fromTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={styles.content}>
                  <h3>{date.name}</h3>
                  <p>{date.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noItems}>No news for today</p>
        )}
      </div>

      {/*}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>This Week's News</h2>
        {weekNews.length > 0 ? (
          <div className={styles.newsList}>
            {weekNews.map(date => (
              <div key={date.id} className={styles.newsItem}>
                <h3>{date.name}</h3>
                <p>{date.description}</p>
                <span className={styles.date}>
                  {new Date(date.fromDate).toLocaleDateString()} at{' '}
                  {new Date(`${date.fromDate}T${date.fromTime}`).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noItems}>No news for this week</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Seasons</h2>
        {currentSeasons.length > 0 ? (
          <div className={styles.seasonList}>
            {currentSeasons.map(date => (
              <div key={date.id} className={styles.seasonItem}>
                <h3>{date.name}</h3>
                <p>{date.description}</p>
                <div className={styles.dateRange}>
                  <span>
                    {new Date(`${date.fromDate}T${date.fromTime}`).toLocaleString()} -{' '}
                    {new Date(`${date.toDate}T${date.toTime}`).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noItems}>No current seasons</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Next Month's Seasons</h2>
        {nextMonthSeasons.length > 0 ? (
          <div className={styles.seasonList}>
            {nextMonthSeasons.map(date => (
              <div key={date.id} className={styles.seasonItem}>
                <h3>{date.name}</h3>
                <p>{date.description}</p>
                <div className={styles.dateRange}>
                  <span>
                    {new Date(`${date.fromDate}T${date.fromTime}`).toLocaleString()} -{' '}
                    {new Date(`${date.toDate}T${date.toTime}`).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noItems}>No upcoming seasons</p>
        )}
      </div>
      */}
    </div>
  );
} 