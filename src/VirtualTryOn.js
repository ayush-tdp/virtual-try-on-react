import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import glassesSrc from './assets/images/sunglasses.png';

const VirtualTryOn = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [glassesMesh, setGlassesMesh] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        // Camera Access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }

        // TensorFlow Model
        await tf.setBackend('webgl');
        const loadedModel = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          { shouldLoadIrisModel: true, maxFaces: 1 }
        );
        setModel(loadedModel);

        // Three.js Setup
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
        renderer.setSize(width, height);
        renderer.setAnimationLoop(() => renderer.render(scene, camera));

        // Glasses Mesh
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(glassesSrc, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const geometry = new THREE.PlaneGeometry(2, 1);
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const glasses = new THREE.Mesh(geometry, material);
          scene.add(glasses);
          setGlassesMesh(glasses);
        });
      } catch (error) {
        console.error("Initialization error:", error);
        setIsLoading(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    let animationFrameId;

    const detectAndPositionGlasses = async () => {
      if (!webcamRef.current || !model || !glassesMesh) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;
    
      const faceEstimates = await model.estimateFaces({ input: video });
      if (faceEstimates.length > 0) {
        setIsLoading(false);
        const keypoints = faceEstimates[0].scaledMesh;
    
        // Glasses positioning
        const leftEye = keypoints[130];
        const rightEye = keypoints[359];
        const eyeCenter = keypoints[168];
    
        const eyeDistance = Math.sqrt(
          Math.pow(rightEye[0] - leftEye[0], 2) + Math.pow(rightEye[1] - leftEye[1], 2)
        );
        const scaleMultiplier = eyeDistance / 140;
    
        glassesMesh.position.x = (eyeCenter[0] - video.videoWidth / 2) * -0.01;
        glassesMesh.position.y = (eyeCenter[1] - video.videoHeight / 2) * -0.01;
        glassesMesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
        glassesMesh.position.z = 1;
    
        const eyeLine = new THREE.Vector2(rightEye[0] - leftEye[0], rightEye[1] - leftEye[1]);
        const rotationZ = Math.atan2(eyeLine.y, eyeLine.x);
        glassesMesh.rotation.z = rotationZ;
      }
    
      animationFrameId = requestAnimationFrame(detectAndPositionGlasses);
    };
    

    detectAndPositionGlasses();

    return () => cancelAnimationFrame(animationFrameId);
  }, [model, glassesMesh]);

  return (
    <>
      <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.2)' }}>
        <h1 style={{ textAlign: 'center' }}>Virtual Try-On - 2D Glasses</h1>
      </div>
      <div style={{ position: 'relative', margin: '0 auto', width: '800px', height: '800px' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <h3>Loading...</h3>
          </div>
        )}
        <Webcam ref={webcamRef} autoPlay playsInline style={{ width: '800px', height: '800px' }} mirrored={true} />
        <canvas ref={canvasRef} style={{ width: '800px', height: '800px', position: 'absolute', top: 0, left: 0 }} />
      </div>
    </>
  );
};

export default VirtualTryOn;