import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function LoginValidation(e) {
    e.preventDefault();
    const loginForm = {
      userName: userName,
      password: password,
    };
    fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginForm),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Login unsuccessfull');
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('employeeId', data.employeeId);
        navigate('/dashboard');
      });

    setPassword('');
  }
  return (
    <div>
      <form onSubmit={LoginValidation}>
        <div>
          Enter User Name:
          <input
            type="text"
            name="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div>
          Password:
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
