import './App.scss';
import FacialExpression from './components/FacialExpressions/FacialExpressions.jsx';
import MoodSongs from './components/MoodSongs/MoodSongs.jsx';
import { useState } from 'react';
function App() {
  const [songs, setSongs] = useState([]);
  
  return (
    <div className="app">
      <FacialExpression setSongs={setSongs}/>
      <MoodSongs songs={songs}/>
    </div>
  );
}

export default App;
