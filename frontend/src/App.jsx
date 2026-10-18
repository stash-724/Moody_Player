import './App.scss';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import MoodDetector from './components/MoodDetector/MoodDetector.jsx';
import MoodSongs from './components/MoodSongs/MoodSongs.jsx';
import Player from './components/Player/Player.jsx';
import { API_URL } from './config.js';

const REPO_URL = 'https://github.com/stash-724/Moody_Player';
// Free-tier hosting sleeps when idle; after this long, tell the user it is waking up.
const SLOW_REQUEST_MS = 4000;

function App() {
  const [mood, setMood] = useState(null);
  const [songs, setSongs] = useState([]);
  const [songsStatus, setSongsStatus] = useState({ slow: false, error: '' });
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);

  // Start waking the API while the models load and the user grants camera access.
  useEffect(() => {
    axios.get(`${API_URL}/health`, { timeout: 60000 }).catch(() => {});
  }, []);

  const handleMoodChange = useCallback((next) => setMood(next), []);

  // Fetch only when the smoothed mood changes, not on every frame.
  useEffect(() => {
    if (!mood) return;
    const controller = new AbortController();
    const slowTimer = setTimeout(() => setSongsStatus({ slow: true, error: '' }), SLOW_REQUEST_MS);
    axios.get(`${API_URL}/songs`, { params: { mood }, signal: controller.signal, timeout: 60000 })
      .then((res) => {
        setSongs(res.data.songs);
        setSongsStatus({ slow: false, error: '' });
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error(err);
        setSongsStatus({ slow: false, error: 'Failed to fetch songs.' });
      })
      .finally(() => clearTimeout(slowTimer));
    return () => {
      controller.abort();
      clearTimeout(slowTimer);
    };
  }, [mood]);

  const handleSelect = useCallback((song) => {
    if (current?._id === song._id) {
      setPlaying((p) => !p);
    } else {
      setCurrent(song);
      setPlaying(true);
    }
  }, [current]);

  // The current ranking is the queue; a song that dropped out of it continues into the top match.
  const handleNext = useCallback(() => {
    if (!songs.length) return;
    const i = songs.findIndex((s) => s._id === current?._id);
    setCurrent(songs[(i + 1) % songs.length]);
    setPlaying(true);
  }, [songs, current]);

  return (
    <div className={`app ${current ? 'withPlayer' : ''}`}>
      <header className="header">
        <div>
          <h1>Moody Player</h1>
          <p className="tagline">
            Music that matches your mood, read from your face by a CNN trained on FER-2013 and run entirely in your browser.
          </p>
        </div>
        <a className="repoLink" href={REPO_URL} target="_blank" rel="noreferrer">Source on GitHub</a>
      </header>
      <main className="main">
        <MoodDetector onMoodChange={handleMoodChange} />
        <MoodSongs
          songs={songs}
          mood={mood}
          status={songsStatus}
          currentId={current?._id}
          playing={playing}
          onSelect={handleSelect}
        />
      </main>
      <Player song={current} playing={playing} onPlayingChange={setPlaying} onNext={handleNext} />
    </div>
  );
}

export default App;
