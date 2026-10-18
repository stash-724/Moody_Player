import { useEffect, useRef, useState } from "react";
import styles from "./Player.module.scss";

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Single audio element for the whole app, so playback survives the song list re-ranking.
export default function Player({ song, playing, onPlayingChange, onNext }) {
    const audioRef = useRef(null);
    const [time, setTime] = useState({ current: 0, duration: 0 });

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !song) return;
        if (playing) {
            audio.play().catch((err) => {
                // AbortError just means a newer track replaced this one mid-load.
                if (err.name !== "AbortError") {
                    console.error(err);
                    onPlayingChange(false);
                }
            });
        } else {
            audio.pause();
        }
    }, [playing, song, onPlayingChange]);

    if (!song) return null;

    const seek = (e) => {
        audioRef.current.currentTime = Number(e.target.value);
    };

    return (
        <div className={styles.bar} role="region" aria-label="Player">
            <audio
                ref={audioRef}
                src={song.audio}
                preload="auto"
                onLoadedMetadata={(e) => setTime({ current: 0, duration: e.target.duration })}
                onTimeUpdate={(e) => setTime((t) => ({ ...t, current: e.target.currentTime }))}
                onEnded={onNext}
            />
            <div className={styles.inner}>
                <div className={styles.track}>
                    <span className={styles.title}>{song.title}</span>
                    <span className={styles.artist}>
                        {song.artist}
                        {song.license && <> · {song.license}</>}
                    </span>
                </div>

                <div className={styles.controls}>
                    <button
                        className={styles.playBtn}
                        onClick={() => onPlayingChange(!playing)}
                        aria-label={playing ? "Pause" : "Play"}
                    >
                        {playing ? "❚❚" : "▶"}
                    </button>
                    <button className={styles.nextBtn} onClick={onNext} aria-label="Next song">
                        ⏭
                    </button>
                </div>

                <div className={styles.progress}>
                    <span className={styles.time}>{formatTime(time.current)}</span>
                    <input
                        type="range"
                        min={0}
                        max={time.duration || 0}
                        step={0.1}
                        value={Math.min(time.current, time.duration || 0)}
                        onChange={seek}
                        aria-label="Seek"
                        className={styles.seek}
                    />
                    <span className={styles.time}>{formatTime(time.duration)}</span>
                </div>
            </div>
        </div>
    );
}
