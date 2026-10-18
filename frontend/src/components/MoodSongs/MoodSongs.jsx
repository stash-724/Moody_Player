import styles from "./MoodSongs.module.scss";
import { useState } from "react";

export default function MoodSongs({ songs, mood, error }) {
  // Tracked by id, not list position: the list re-ranks whenever the mood changes.
  const [playingId, setPlayingId] = useState(null);

  const handlePlayPause = (id) => {
    setPlayingId((current) => (current === id ? null : id));
  };

  const hasCcBy = songs.some((song) => song.license === "CC BY 4.0");

  return (
    <div className={styles.wrapper}>

      <h2>Recommended Songs</h2>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!error && songs.length === 0 && (
        <p className={styles.empty}>
          {mood
            ? `No songs for “${mood}” yet.`
            : "Start the camera to get song recommendations for your mood."}
        </p>
      )}
      {!error && songs.length > 0 && (
        <p className={styles.subtitle}>Closest matches to “{mood}” by valence and energy</p>
      )}
      <div className={styles.songList}>
        {songs.map((song) => (
          <div key={song._id} className={styles.songItem}>
            <div className={styles.songInfo}>
              <span className={styles.title}>{song.title}</span>
              <small className={styles.artist}>
                {song.artist}
                {song.license && (
                  <>
                    {" · "}
                    <a href={song.licenseUrl} target="_blank" rel="noreferrer">{song.license}</a>
                  </>
                )}
              </small>
            </div>
            <div className={styles.controls}>
              {playingId === song._id && (
                <audio src={song.audio} autoPlay onEnded={() => setPlayingId(null)} />
              )}
              <button
                className={styles.playBtn}
                onClick={() => handlePlayPause(song._id)}
                aria-label={playingId === song._id ? `Pause ${song.title}` : `Play ${song.title}`}
              >
                {playingId === song._id ? "❚❚" : "▶"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {hasCcBy && (
        <p className={styles.credit}>
          Music by Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noreferrer">incompetech.com</a>),
          licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons: By Attribution 4.0</a>.
        </p>
      )}
    </div>
  );
}
