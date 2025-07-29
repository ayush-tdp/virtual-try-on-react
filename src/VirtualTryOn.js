import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import handImage from './assets/images/hand1.jpg';
import ringImage1 from './assets/images/ring.png';
import ringImage2 from './assets/images/ring1.webp';
import ringImage3 from './assets/images/ring2.png';

const RingTryOn = () => {
  const videoRef = useRef(null);
  const [ringImage, setRingImage] = useState(ringImage1);
  const [ringSize, setRingSize] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [ringFilter, setRingFilter] = useState('round');
  const [showCamera, setShowCamera] = useState(false);
  const [handPreview, setHandPreview] = useState(handImage);
  const [cameraStream, setCameraStream] = useState(null);


  // Load images
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const img = new Image();
        img.src = handPreview;
        img.onload = () => setIsLoading(false);
      } catch (err) {
        console.error('Asset load failed:', err);
        setIsLoading(false);
      }
    };
    loadAssets();
  }, [handPreview]);

  const startCamera = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch (envErr) {
        console.warn('Rear camera not available, trying default...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera error:', error.name, error.message);
      alert(`Camera error: ${error.name} - ${error.message}`);
    }
  };



  // Wait for video to render before attaching stream
  useEffect(() => {
    if (showCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);


  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setHandPreview(canvas.toDataURL('image/jpeg'));
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setShowCamera(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setHandPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRingFilterChange = (e) => {
    const value = e.target.value;
    setRingFilter(value);
    setRingImage(
      value === 'round' ? ringImage1 :
        value === 'oval' ? ringImage2 :
          ringImage3
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-md">
        <header className="text-center p-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">
            Virtual Ring Try-On
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row p-4 gap-6 overflow-y-auto">
          {/* Try-On Area */}
          <div className="flex-1 relative min-h-[320px] lg:min-h-[500px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
                <p className="text-gray-600">Loading...</p>
              </div>
            )}

            <div
              className="relative w-full h-[320px] lg:h-[500px]  bg-white bg-center bg-contain bg-no-repeat rounded-lg"
              style={{ backgroundImage: `url(${handPreview})` }}
            >
              <Draggable
                position={position}
                onDrag={(e, data) => setPosition({ x: data.x, y: data.y })}
                bounds="parent"
              >
                <div
                  className="absolute cursor-move"
                  style={{
                    width: `${ringSize}px`,
                    height: `${ringSize}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <img
                    src={ringImage}
                    alt="Ring"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </Draggable>
            </div>
          </div>

          {/* Controls Panel */}
          <aside className="w-full lg:w-80 flex flex-col gap-4">
            {/* Ring Style */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ring Metal Color
              </label>
              <select
                value={ringFilter}
                onChange={handleRingFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="round">Silver</option>
                {/* <option value="oval">Oval</option> */}
                <option value="emerald">Gold</option>
              </select>
            </div>

            {/* Ring Size */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ring Size ({ringSize}px)
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={ringSize}
                onChange={(e) => setRingSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Upload Hand Image */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Hand Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm"
              />
            </div>

            {/* Live Camera */}
            {!showCamera ? (
              <button
                onClick={startCamera}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Try with Live Camera
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {showCamera && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded shadow-md"
                  />
                )}
                <button
                  onClick={captureImage}
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Capture Hand Photo
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setRingSize(100);
                setPosition({ x: 0, y: 0 });
              }}
              className="py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
            >
              Reset Ring
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RingTryOn;
