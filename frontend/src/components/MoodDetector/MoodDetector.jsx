import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import styles from "./MoodDetector.module.scss";
import EmotionBars from "../EmotionBars/EmotionBars.jsx";
import { loadEmotionModel } from "../../lib/emotionModel.js";
import { faceToInput, INPUT_SIZE } from "../../lib/preprocess.js";
import { createMoodSmoother } from "../../lib/smoothing.js";

const TARGET_FPS = 5;
const FRAME_MS = 1000 / TARGET_FPS;
// Below this smoothed confidence the previous mood is kept. Chosen from the test-set
// confidence curve in ml/results.json (>= 0.5 keeps ~73% of images at ~75% accuracy).
const CONFIDENCE_THRESHOLD = 0.5;
const EMA_ALPHA = 0.3;
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
const LATENCY_WINDOW = 50;

const EMPTY_FRAME = { smoothed: null, mood: null, confident: false, face: false };

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : null;
};

const pushWindow = (xs, x) => [...xs.slice(-(LATENCY_WINDOW - 1)), x];

export default function MoodDetector({ onMoodChange }) {
    const videoRef = useRef(null);
    const cropRef = useRef(null);
    const streamRef = useRef(null);
    const modelRef = useRef(null);
    const timerRef = useRef(null);
    const runningRef = useRef(false);
    const timingsRef = useRef({ detect: [], classify: [] });
    const smootherRef = useRef(createMoodSmoother({ alpha: EMA_ALPHA, threshold: CONFIDENCE_THRESHOLD }));

    const [status, setStatus] = useState("loading"); // loading | ready | starting | running | error
    const [error, setError] = useState("");
    const [labels, setLabels] = useState([]);
    const [frame, setFrame] = useState(EMPTY_FRAME);
    const [box, setBox] = useState(null);
    const [videoSize, setVideoSize] = useState(null);
    const [latency, setLatency] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [model] = await Promise.all([
                    loadEmotionModel(),
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                ]);
                if (cancelled) return;
                modelRef.current = model;
                setLabels(model.labels);
                setStatus("ready");
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError("Could not load the models. Check your connection and reload.");
                    setStatus("error");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // One frame: detect the face, crop it, classify it, smooth. Scheduled with setTimeout
    // (not requestAnimationFrame) so frames never overlap and we stay near TARGET_FPS.
    const tick = useCallback(async () => {
        if (!runningRef.current) return;
        const started = performance.now();
        const video = videoRef.current;
        try {
            if (video && video.readyState >= 2) {
                const timings = timingsRef.current;
                const t0 = performance.now();
                const detection = await faceapi.detectSingleFace(video, DETECTOR_OPTIONS);
                timings.detect = pushWindow(timings.detect, performance.now() - t0);

                let probs = null;
                if (detection) {
                    const ctx = cropRef.current.getContext("2d", { willReadFrequently: true });
                    const result = await modelRef.current.classify(faceToInput(video, detection.box, ctx));
                    probs = result.probs;
                    timings.classify = pushWindow(timings.classify, result.ms);
                }
                if (!runningRef.current) return;
                setBox(detection ? detection.box : null);
                setFrame(smootherRef.current.update(probs));
                setLatency({ detect: median(timings.detect), classify: median(timings.classify) });
            }
        } catch (e) {
            console.error(e);
        }
        if (runningRef.current) {
            timerRef.current = setTimeout(tick, Math.max(0, FRAME_MS - (performance.now() - started)));
        }
    }, []);

    const stopCamera = useCallback(() => {
        runningRef.current = false;
        clearTimeout(timerRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        // Don't leave the last face crop on screen once the camera is off.
        cropRef.current?.getContext("2d", { willReadFrequently: true }).clearRect(0, 0, INPUT_SIZE, INPUT_SIZE);
        smootherRef.current.reset();
        setFrame(EMPTY_FRAME);
        setBox(null);
    }, []);

    const startCamera = async () => {
        setError("");
        setStatus("starting");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();
            setVideoSize({ width: video.videoWidth, height: video.videoHeight });
            runningRef.current = true;
            setStatus("running");
            tick();
        } catch (e) {
            console.error(e);
            stopCamera();
            setError("Camera access was blocked or no camera is available.");
            setStatus("ready");
        }
    };

    const handleStop = () => {
        stopCamera();
        setStatus("ready");
    };

    useEffect(() => stopCamera, [stopCamera]);

    const moodLabel = frame.mood !== null ? labels[frame.mood] : null;
    useEffect(() => {
        if (moodLabel) onMoodChange?.(moodLabel);
    }, [moodLabel, onMoodChange]);

    const running = status === "running";
    // The preview is mirrored, so the box's x is flipped to line up with it.
    const boxStyle = box && videoSize && {
        left: `${(1 - (box.x + box.width) / videoSize.width) * 100}%`,
        top: `${(box.y / videoSize.height) * 100}%`,
        width: `${(box.width / videoSize.width) * 100}%`,
        height: `${(box.height / videoSize.height) * 100}%`,
    };

    let statusText;
    if (status === "loading") statusText = "Loading models…";
    else if (!running) statusText = "Camera is off";
    else if (!frame.face) statusText = "Looking for a face…";
    else if (!frame.confident) statusText = "Not sure yet, keeping the last mood";
    else statusText = "Tracking";

    return (
        <section className={styles.detector} aria-label="Mood detection">
            <div className={styles.cameraColumn}>
                <div
                    className={styles.videoFrame}
                    style={videoSize ? { aspectRatio: `${videoSize.width} / ${videoSize.height}` } : undefined}
                >
                    <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                    {running && boxStyle && <div className={styles.faceBox} style={boxStyle} />}
                    {!running && (
                        <div className={styles.placeholder}>
                            {status === "loading" ? "Loading models…" : "Camera is off"}
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    {running ? (
                        <button className={styles.secondaryBtn} onClick={handleStop}>Stop camera</button>
                    ) : (
                        <button
                            className={styles.primaryBtn}
                            onClick={startCamera}
                            disabled={status !== "ready"}
                            aria-busy={status === "starting"}
                        >
                            {status === "starting" ? "Starting…" : "Start camera"}
                        </button>
                    )}
                    <figure className={styles.crop}>
                        <canvas ref={cropRef} width={INPUT_SIZE} height={INPUT_SIZE} className={styles.cropCanvas} />
                        <figcaption>Model input (48×48)</figcaption>
                    </figure>
                </div>

                <p className={styles.privacy}>
                    <strong>Runs on your device.</strong> Face detection and emotion recognition happen in this
                    browser. No video frames leave your device; only the detected mood word is sent to fetch songs.
                </p>
            </div>

            <div className={styles.readout}>
                <p className={styles.moodLine}>
                    Current mood: <span className={styles.moodValue}>{moodLabel ?? "—"}</span>
                </p>
                <p className={styles.status} role="status">{statusText}</p>

                <EmotionBars labels={labels} probs={frame.smoothed} active={frame.mood} />

                <p className={styles.meta}>
                    Smoothed over frames (EMA α = {EMA_ALPHA}); the mood changes only above{" "}
                    {CONFIDENCE_THRESHOLD * 100}% confidence.
                    {latency?.classify != null && (
                        <>
                            {" "}Median per frame on this device: face detection {latency.detect.toFixed(1)} ms,
                            emotion model {latency.classify.toFixed(1)} ms.
                        </>
                    )}
                </p>

                {error && <p className={styles.error} role="alert">{error}</p>}
            </div>
        </section>
    );
}
