import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import styles from "./FacialExpression.module.scss";
import axios from "axios";
export default function FacialExpression({ setSongs }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [mood, setMood] = useState("—");
    const [error, setError] = useState("");

    const loadModels = async () => {
        const MODEL_URL = "/models";
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
    };

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setError("Webcam access blocked or unavailable.");
            console.error("Error accessing webcam: ", err);
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const detectMood = async () => {
        if (!videoRef.current) return;
        setIsDetecting(true);
        setError("");

        try {
            const detections = await faceapi
                .detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceExpressions();

            if (!detections || detections.length === 0) {
                setMood("no face");
                setIsDetecting(false);
                return;
            }
            // Pick the strongest expression across all detected faces
            let topExpression = "neutral";
            let topScore = 0;
            for (const d of detections) {
                const entries = Object.entries(d.expressions || {});
                for (const [expr, score] of entries) {
                    if (score > topScore) {
                        topScore = score;
                        topExpression = expr;
                    }
                }
            }
            setMood(topExpression);
            axios.get(`http://localhost:3000/songs?mood=${topExpression}`)
               .then(res => {
                   setSongs(res.data.songs);
               })
               .catch(err => {
                   setError("Failed to fetch songs.");
                   console.error(err);
               });
        } catch (e) {
            setError("Detection failed. Try again.");
            console.error(e);
        } finally {
            setIsDetecting(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await loadModels();
                await startVideo();
                setIsReady(true);
            } catch (e) {
                setError("Model load failed.");
                console.error(e);
            }
        })();

        return () => {
            stopVideo();
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            <div className={styles.leftPane}>
                <div className={styles.videoFrame}>
                    <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                </div>
            </div>

            <div className={styles.rightPane}>
                <p className={styles.moodLine}>
                    Current mood: <span className={styles.moodValue}>{mood}</span>
                </p>

                <button
                    className={styles.detectBtn}
                    onClick={detectMood}
                    disabled={!isReady || isDetecting || !!error}
                    aria-busy={isDetecting}
                >
                    {isDetecting ? "Detecting..." : "Detect Mood"}
                </button>

                {error && <p className={styles.error}>{error}</p>}

            </div>
        </div>
    );
}
