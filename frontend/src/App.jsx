import './App.scss';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import MoodDetector from './components/MoodDetector/MoodDetector.jsx';
import MoodSongs from './components/MoodSongs/MoodSongs.jsx';
import { API_URL } from './config.js';

function App() {
  const [mood, setMood] = useState(null);
  const [songs, setSongs] = useState([]);
  const [songsError, setSongsError] = useState('');

  const handleMoodChange = useCallback((next) => setMood(next), []);

  // Fetch only when the smoothed mood changes, not on every frame.
  useEffect(() => {
    if (!mood) return;
    const controller = new AbortController();
    axios.get(`${API_URL}/songs`, { params: { mood }, signal: controller.signal })
      .then((res) => {
        setSongs(res.data.songs);
        setSongsError('');
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error(err);
        setSongsError('Failed to fetch songs.');
      });
    return () => controller.abort();
  }, [mood]);

  return (
    <div className="app">
      <MoodDetector onMoodChange={handleMoodChange} />
      <MoodSongs songs={songs} mood={mood} error={songsError} />
    </div>
  );
}

export default App;
