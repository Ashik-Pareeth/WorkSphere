import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axiosInstance';
import './Auth.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId');
  const [step, setStep] = useState(1);
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const activateAccount = async (e) => {
    e.preventDefault();
    const signUpForm = {
      phoneNumber: contactNo,
      password: password,
    };
    try {
      await axiosInstance.post(`/employees/activate/${employeeId}`, signUpForm);
      setStep(2);
    } catch (err) {
      console.log(err);
    }
  };

  const uploadPhoto = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('profilePic', profileImage);
    try {
      await axiosInstance.post(`employees/photo/${employeeId}`, formData);
      navigate('/dashboard');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="auth-container">
      {step === 1 && (
        <div className="auth-card">
          <form onSubmit={activateAccount}>
            <div className="form-group">
              Contact no:
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
            <div className="form-group">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              next
            </button>
          </form>
        </div>
      )}
      {step === 2 && (
        <form onSubmit={uploadPhoto}>
          <div>Choos Photo</div>
          <div>
            <input
              type="file"
              onChange={(e) => setProfileImage(e.target.files[0])}
            />
          </div>
          <button type="submit">Finish</button>
        </form>
      )}
    </div>
  );
};
export default Onboarding;
