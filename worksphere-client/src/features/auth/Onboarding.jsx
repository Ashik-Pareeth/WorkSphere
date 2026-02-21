import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const Onboarding = () => {
  const navigate = useNavigate();
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
      await axiosInstance.post(`/employees/activate`, signUpForm);
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
      await axiosInstance.post(`employees/photo`, formData);
      localStorage.setItem('status', 'ACTIVE');
      navigate('/dashboard');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <div
            className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
          >
            1
          </div>
          <div className="h-1 w-10 bg-slate-300 rounded" />
          <div
            className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
          >
            2
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={activateAccount} className="space-y-5">
            <h2 className="text-2xl font-semibold text-center text-slate-700">
              Activate Account
            </h2>

            <div className="space-y-2">
              <label className="text-sm text-slate-600">Contact number</label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
            >
              Next →
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={uploadPhoto} className="space-y-5 text-center">
            <h2 className="text-2xl font-semibold text-slate-700">
              Upload Profile Photo
            </h2>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition">
              <span className="text-slate-500 text-sm mb-2">
                Click to choose a photo
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </label>

            {profileImage && (
              <p className="text-sm text-green-600">{profileImage.name}</p>
            )}

            <button
              type="submit"
              disabled={!profileImage}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-2 rounded-lg font-medium transition"
            >
              Finish ✓
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
