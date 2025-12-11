import React, { useState, useRef } from 'react';

const WorkTracker = () => {
  const [isWorking, setIsWorking] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startWork = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
      });

      videoRef.current.srcObject = displayStream;
      setStream(displayStream);
      setIsWorking(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
      alert('We need screen permission to track your work session!');
    }
  };

  const stopWork = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsWorking(false);
    setStream(null);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>Work Tracker</h2>

      {}
      {!isWorking ? (
        <button
          onClick={startWork}
          style={{ backgroundColor: 'green', color: 'white', padding: '10px' }}
        >
          Start Session
        </button>
      ) : (
        <button
          onClick={stopWork}
          style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}
        >
          Stop Session
        </button>
      )}

      <div style={{ marginTop: '20px' }}>
        <p>Live Preview (Hidden in Prod):</p>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '300px', border: '2px dashed red' }}
        />
      </div>
    </div>
  );
};

export default WorkTracker;
