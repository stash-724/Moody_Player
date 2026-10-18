import styles from "./EmotionBars.module.scss";

export default function EmotionBars({ labels, probs, active }) {
    return (
        <ul className={styles.bars} aria-label="Emotion probabilities">
            {labels.map((label, i) => {
                const value = probs ? probs[i] : 0;
                const pct = Math.round(value * 100);
                return (
                    <li key={label} className={`${styles.row} ${i === active ? styles.active : ""}`}>
                        <span className={styles.label}>{label}</span>
                        <span
                            className={styles.track}
                            role="meter"
                            aria-label={label}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={pct}
                        >
                            <span className={styles.fill} style={{ width: `${value * 100}%` }} />
                        </span>
                        <span className={styles.value}>{probs ? `${pct}%` : "–"}</span>
                    </li>
                );
            })}
        </ul>
    );
}
