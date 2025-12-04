export default function AttendanceWidget() {
  function handleClockIn() {
    fetch('http://localhost:8080/attendance/clock-in/1', {
      headers: {
        'Content-type': 'application/json',
      },
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Clock-in failed');
        return response;
      })
      .then(() => alert('Clock-in successfull'))
      .catch((err) => alert('Error:could not clock-in'));
  }
  function handleClockOut() {
    fetch('http://localhost:8080/attendance/clock-out/1', {
      headers: {
        'Content-type': 'application/json',
      },
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Clock-out failed');
        return response;
      })
      .then(() => alert('Clock-out successfull'))
      .catch((err) => alert('Error:could not clock-out'));
  }
  return (
    <div className="widget">
      <h2>Attendence</h2>
      <div style={{ display: 'flex', gap: '10px' }}></div>
      <button onClick={handleClockIn}>Clock-in</button>
      <button onClick={handleClockOut}>Clock-out</button>
    </div>
  );
}
