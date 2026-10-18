import styles from "./MoodSongs.module.scss";
import { useState } from "react";
export default function MoodSongs({ songs }) {
  const [isPlaying, setIsPlaying] = useState(null);
  const handlePlayPause = (index) => {
    if(isPlaying === index) {
      setIsPlaying(null);
    }else setIsPlaying(index);
  };
  return (
    <div className={styles.wrapper}>

      <h2>Recommended Songs</h2>
      {songs.length === 0 && (
        <p className={styles.empty}>Detect your mood to get song recommendations.</p>
      )}
      <div className={styles.songList}>
        {songs.map((song, i) => (
          <div key={song._id ?? i} className={styles.songItem}>
            <div className={styles.songInfo}>
              <span className={styles.title}>{song.title}</span>
              <small className={styles.artist}>{song.artist}</small>
            </div>
            <div className={styles.controls}>
              {
               isPlaying === i &&
               <audio 
                  src={song.audio} style={{ 
                    display: "none" 
                  }} 
                  autoPlay={isPlaying === i}>
                </audio>
              }
              <button className={styles.playBtn} onClick={() => handlePlayPause(i)}>
                {isPlaying === i ? "❚❚" : "▶"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
