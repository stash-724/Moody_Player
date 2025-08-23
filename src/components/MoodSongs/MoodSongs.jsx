import React, { useState } from "react";
import styles from "./MoodSongs.module.scss";

export default function MoodSongs() {
  const [songs] = useState([
    { title: "Blinding Lights", artist: "The Weeknd", url: "#" },
    { title: "Shape of You", artist: "Ed Sheeran", url: "#" },
    { title: "Levitating", artist: "Dua Lipa", url: "#" }
  ]);

  return (
    <div className={styles.wrapper}>
      <h2>Recommended Songs</h2>
      <div className={styles.songList}>
        {songs.map((song, i) => (
          <div key={i} className={styles.songItem}>
            <div className={styles.songInfo}>
              <span className={styles.title}>{song.title}</span>
              <small className={styles.artist}>{song.artist}</small>
            </div>
            <button className={styles.playBtn}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );
}
