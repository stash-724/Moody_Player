import './app.scss';
import FacialExpression from './components/FacialExpressions/FacialExpressions.jsx';
import MoodSongs from './components/MoodSongs/MoodSongs.jsx';
import { useState } from 'react';
function App() {
  const [songs, setSongs] = useState([
      { title: "Blinding Lights", artist: "The Weeknd", url: "#" },
      { title: "Shape of You", artist: "Ed Sheeran", url: "#" },
      { title: "Levitating", artist: "Dua Lipa", url: "#" }
    ]);
  
  return (
    <div className="app">
      <FacialExpression setSongs={setSongs}/>
      <MoodSongs songs={songs}/>
    </div>
  );
}

export default App;
