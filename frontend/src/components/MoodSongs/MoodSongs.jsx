import styles from "./MoodSongs.module.scss";

export default function MoodSongs({ songs, mood, status, currentId, playing, onSelect }) {
  const hasCcBy = songs.some((song) => song.license === "CC BY 4.0");

  let message = null;
  if (status.error) message = <p className={styles.error} role="alert">{status.error}</p>;
  else if (status.slow) message = <p className={styles.empty}>Waking up the song server, this can take up to a minute…</p>;
  else if (songs.length === 0) {
    message = (
      <p className={styles.empty}>
        {mood ? `No songs for “${mood}” yet.` : "Start the camera to get song recommendations for your mood."}
      </p>
    );
  }

  return (
    <section className={styles.wrapper} aria-label="Recommended songs">
      <h2>Recommended Songs</h2>
      {message}
      {!status.error && songs.length > 0 && (
        <p className={styles.subtitle}>Closest matches to “{mood}” by valence and energy</p>
      )}
      <ol className={styles.songList}>
        {songs.map((song) => {
          const isCurrent = song._id === currentId;
          return (
            <li key={song._id} className={`${styles.songItem} ${isCurrent ? styles.current : ""}`}>
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
              <small className={styles.features} title="Position on the valence/energy plane (0 to 1)">
                valence {song.valence.toFixed(2)} · energy {song.energy.toFixed(2)}
              </small>
              <button
                className={styles.playBtn}
                onClick={() => onSelect(song)}
                aria-label={isCurrent && playing ? `Pause ${song.title}` : `Play ${song.title}`}
              >
                {isCurrent && playing ? "❚❚" : "▶"}
              </button>
            </li>
          );
        })}
      </ol>
      {hasCcBy && (
        <p className={styles.credit}>
          Music by Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noreferrer">incompetech.com</a>),
          licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons: By Attribution 4.0</a>.
        </p>
      )}
    </section>
  );
}
