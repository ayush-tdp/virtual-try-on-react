import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import ringImage1 from './assets/images/ring.png';
import ringImage2 from './assets/images/ring1.webp';
import ringImage3 from './assets/images/ring2.png';

const RingTryOn = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [ringImage, setRingImage] = useState(ringImage1);
  const [ringFilter, setRingFilter] = useState('round');
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!cameraActive) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => await hands.send({ image: videoRef.current }),
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [cameraActive]);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Choose two landmarks for finger width (e.g. the base and proximal of ring finger)
      const p1 = landmarks[12]; // ring finger base
      const p2 = landmarks[14]; // ring finger middle

      const x1 = p1.x * canvas.width;
      const y1 = p1.y * canvas.height;
      const x2 = p2.x * canvas.width;
      const y2 = p2.y * canvas.height;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      const ringSize = dist * 2.5; // tunable scale factor

      const cx = x1;
      const cy = y1;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.drawImage(
        ringImage,
        -ringSize / 2,
        -ringSize / 2,
        ringSize,
        ringSize
      );
      ctx.restore();
    }
  };

  const handleRingFilterChange = (e) => {
    const val = e.target.value;
    setRingFilter(val);
    setRingImage(val === 'round' ? ringImage1 : val === 'oval' ? ringImage2 : ringImage3);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-4">
        <h1 className="text-2xl font-semibold text-center mb-4">Live Ring Try-On</h1>
        <div className="aspect-w-4 aspect-h-3 relative mb-4">
          <video
            ref={videoRef}
            style={{ display: cameraActive ? 'block' : 'none' }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={ringFilter}
            onChange={handleRingFilterChange}
            className="p-2 border rounded"
          >
            <option value="round">Round</option>
            <option value="oval">Oval</option>
            <option value="emerald">Emerald</option>
          </select>

          {!cameraActive && (
            <button
              onClick={() => setCameraActive(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RingTryOn;
