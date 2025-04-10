import { useState } from 'react';
import Head from 'next/head';
import Screener from './components/Screener';
import VibrationalDatesPreview from './components/VibrationalDatesPreview';
import DigitalClock from './components/DigitalClock';
import HeaderShortcut from './components/HeaderShortcut';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <>
      <Head>
        <title>FractalizeND</title>
        <meta name="description" content="FractalizeND - Trading Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>FractalizeND</h1>
            <HeaderShortcut />
          </div>
          <DigitalClock />
        </div>
      </header>

      <main className={styles.main}>
        <div id="today-news" className={styles.section}>
          <VibrationalDatesPreview />
        </div>
        <div id="screener" className={styles.section}>
          <Screener selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </div>
      </main>
    </>
  );
} 