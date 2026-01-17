import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

const AttendanceControl = () => {
  const [history, setHistory] = useState([]);
  const employeeId = localStorage.getItem('employeeId');

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/attendance`);
      setHistory(response.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }, []);

  // const fetchHistory = useCallback(
  //   async (signal) => {
  //     if (!employeeId || !token) return;
  //     try {
  //       const response = await fetch(
  //         `http://localhost:8080/attendance/${employeeId}`,
  //         {
  //           method: 'GET',
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //           signal,
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error('Fetch failed');
  //       }

  //       const data = await response.json();
  //       setHistory(data);
  //     } catch (err) {
  //       if (err.name !== 'AbortError') console.error(err);
  //     }
  //   },
  //   [employeeId, token]
  // );

  useEffect(() => {
    if (employeeId) {
      const loadIntialData = async () => {
        fetchHistory();
      };
      loadIntialData();
    }
  }, [fetchHistory, employeeId]);

  const punchClockIn = async () => {
    try {
      await axiosInstance.post(`attendance/clock-in`);
      console.log('Clock-in successfull');
      fetchHistory();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  // const punchClockIn = async () => {
  //   try {
  //     const response = await fetch(
  //       `http://localhost:8080/attendance/clock-in/${employeeId}`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Clock In failed, please wait or contact helpline');
  //     }

  //     console.log('Clock In successful');
  //     fetchHistory();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const punchClockOut = async () => {
    try {
      await axiosInstance.post(`/attendance/clock-out`);
      console.log('Clock-out successful');
      fetchHistory();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  // const punchClockOut = async () => {
  //   try {
  //     const response = await fetch(
  //       `http://localhost:8080/attendance/clock-out/${employeeId}`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Clock out failed, please wait or contact helpline');
  //     }

  //     console.log('Clock out successful');
  //     fetchHistory();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const today = new Date().toISOString().split('T')[0];
  const todaysRecord = history.find((record) => record.date === today);

  if (!todaysRecord) {
    return (
      <div className="card">
        <button
          className="btn btn-success"
          type="submit"
          onClick={punchClockIn}
        >
          Clock In
        </button>
      </div>
    );
  }
  if (todaysRecord.clockOut === null) {
    return (
      <div>
        <button
          className="btn btn-primary"
          type="submit"
          onClick={punchClockOut}
        >
          Clock out
        </button>
      </div>
    );
  }
  return <div className="alert alert-success">Good Work today</div>;
};
export default AttendanceControl;
