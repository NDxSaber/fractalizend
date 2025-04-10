import { useState } from 'react';
import Head from 'next/head';
import Screener from './components/Screener';
import VibrationalDatesPreview from './components/VibrationalDatesPreview';

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>FractalizeND</title>
        <meta name="description" content="FractalizeND - Trading Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">FractalizeND</h1>
        
        <VibrationalDatesPreview />
        
        <div className="mt-8">
          <Screener 
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
          />
        </div>
      </main>
    </div>
  );
} 