import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import axiosInstance from '../../api/axiosInstance';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function LoginValidation(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    const loginForm = {
      userName: userName,
      password: password,
    };

    try {
      const response = await axiosInstance.post('/login', loginForm);
      console.log('login successful');
      console.log('SERVER RESPONSE:', response.data); // <--- Add this!
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('employeeId', response.data.employeeId);
      //should i use .data here?
      if (response.data.employeeStatus === 'ACTIVE') {
        navigate('/dashboard');
      } else if (response.data.employeeStatus === 'PENDING') {
        navigate('/onboarding');
      } else {
        console.log(
          'your account is ' + response.data.employeeStatus.toLowerCase()
        );
      }
    } catch (err) {
      console.log(err);
    }
    // fetch('http://localhost:8080/login', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(loginForm),
    // })
    //   .then((response) => {
    //     if (!response.ok) {
    //       throw new Error('Login unsuccessfull');
    //     }
    //     return response.json();
    //   })
    //   .then((data) => {
    //     localStorage.setItem('token', data.token);
    //     localStorage.setItem('employeeId', data.employeeId);
    //     navigate('/dashboard');
    //   });

    setPassword('');
  }
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-card-title">Welcome back</h2>
        <p>Please sign in to continue</p>

        <form onSubmit={LoginValidation}>
          <div className="form-group">
            <label>User Name</label>
            <input
              type="text"
              name="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn  btn-primary" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
