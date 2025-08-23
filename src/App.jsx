import './app.scss';
import FacialExpression from './components/FacialExpressions/FacialExpressions.jsx';
import MoodSongs from './components/MoodSongs/MoodSongs.jsx';
function App() {
  return (
    <div className="app">
      <FacialExpression />
      <MoodSongs />
    </div>
  );
}

export default App;
