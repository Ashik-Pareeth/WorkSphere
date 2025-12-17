import React, { useState, useRef, useEffect } from 'react';

const WorkTracker = () => {
  // UI State
  const [isWorking, setIsWorking] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState(null);

  // References (Data that doesn't trigger re-renders)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const sessionIdRef = useRef(null); // Stores the DB ID of the current session

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Step 1: START Session ---
  const startWork = async () => {
    setError(null);
    try {
      // A. Get Screen Stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // B. Show Video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;

      // C. Handle "Stop Sharing" browser button
      stream.getVideoTracks()[0].onended = () => {
        stopWork();
      };

      // D. Call Backend API
      const employeeId = localStorage.getItem('employeeId');
      const token = localStorage.getItem('token');

      // NOTE: Check your Backend Controller URL here.
      // I am assuming: POST /work-session/clock-in
      const response = await fetch(
        'http://localhost:8080/work-session/clock-in',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ employeeId: employeeId }), // Send ID
        }
      );

      if (!response.ok) throw new Error('Server failed to clock in');

      const data = await response.json();
      sessionIdRef.current = data.id; // Save the Session ID for later

      setIsWorking(true);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start Error:', err);
      setError('Failed to start session. ' + err.message);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  // --- Step 2: STOP Session ---
  const stopWork = async () => {
    // A. Stop Timer
    if (timerRef.current) clearInterval(timerRef.current);

    // B. Stop Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    // C. Call Backend API
    const token = localStorage.getItem('token');
    const sessionId = sessionIdRef.current;

    if (sessionId) {
      try {
        await fetch(
          `http://localhost:8080/work-session/clock-out/${sessionId}`,
          {
            method: 'PUT', // or POST depending on your controller
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error('Stop Error:', err);
      }
    }

    // D. Reset State
    setIsWorking(false);
    setTimer(0);
    sessionIdRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <h3>Work Tracker</h3>

      {/* Timer Display */}
      <div
        style={{ fontSize: '2rem', margin: '10px 0', fontFamily: 'monospace' }}
      >
        {formatTime(timer)}
      </div>

      {/* Error Message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Video Preview */}
      <div
        style={{
          background: '#000',
          width: '100%',
          height: '250px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: isWorking ? 'block' : 'none',
          }}
        />
        {!isWorking && <span>Screen Preview Off</span>}
      </div>

      {/* Buttons */}
      {!isWorking ? (
        <button
          onClick={startWork}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Start Session
        </button>
      ) : (
        <button
          onClick={stopWork}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Stop Session
        </button>
      )}
    </div>
  );
};

export default WorkTracker;
