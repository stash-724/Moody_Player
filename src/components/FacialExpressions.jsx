import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export default function FacialExpression() {
    const videoRef = useRef();
    const loadModels = async () => {
        const MODEL_URL = '/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };
    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                videoRef.current.srcObject = stream;
            })
            .catch((err) => console.error("Error accessing webcam: ", err));
    };
    async function detectMood() {
        const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
        let max = 0;
        let expression = '';
        if (detections.length === 0) {
            console.log("No face detected");
            return;
        }
        detections.forEach(detection => {
            const emotions = detection.expressions;
            const currentMax = Math.max(...Object.values(emotions));
            if (currentMax > max) {
                max = currentMax;
                expression = Object.keys(emotions).find(key => emotions[key] === currentMax);
            }
        });
        console.log(`Detected expression: ${expression}`);
    }
    useEffect(() => {

        loadModels().then(startVideo);
    }, []);
    return (
        <div style={{ position: 'relative' }}>
            <video
                ref={videoRef}
                autoPlay
                muted
                style={{ height: '20rem', aspectRatio: '16/9' }}
            />
            <button onClick={detectMood}>Detect Mood</button>
        </div>
    );
}