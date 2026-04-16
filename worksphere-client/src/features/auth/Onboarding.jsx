import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [step, setStep] = useState(1);
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const activateAccount = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreed) {
      setError('You must accept Terms & Privacy Policy');
      return;
    }

    setError('');

    try {
      await axiosInstance.post(`/employees/activate`, {
        phoneNumber: contactNo,
        password,
      });
      setStep(2);
    } catch (err) {
      console.log(err);
      setError('Failed to activate account');
    }
  };

  const uploadPhoto = async (e) => {
    e.preventDefault();

    if (!profileImage) {
      setError('Please upload a profile photo');
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', profileImage);

    try {
      await axiosInstance.post(`employees/photo`, formData);

      login({
        token: localStorage.getItem('token'),
        employeeId: user.id,
        roles: user.roles,
        status: 'ACTIVE',
      });

      navigate('/dashboard');
    } catch (err) {
      console.log(err);
      setError('Failed to upload photo');
    }
  };

  const passwordsMatch = password === confirmPassword;

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
            <h2 className="text-2xl font-semibold text-center text-slate-800">
              Activate Account
            </h2>

            {/* Contact */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Contact number
              </label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-slate-900 shadow-sm focus:ring-2 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-300 focus:border-blue-500'
                }`}
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <p className="text-sm text-slate-600">
                I agree to the{' '}
                <span
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Terms & Conditions
                </span>{' '}
                and{' '}
                <span
                  onClick={() => setShowPrivacy(true)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Privacy Policy
                </span>
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!agreed}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 rounded-lg font-medium transition"
            >
              Next →
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={uploadPhoto} className="space-y-5 text-center">
            <h2 className="text-2xl font-semibold text-slate-800">
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

            {error && <p className="text-sm text-red-500">{error}</p>}

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

      {/* Terms Modal */}
      {showTerms && (
        <Modal title="Terms & Conditions" onClose={() => setShowTerms(false)}>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              These Terms and Conditions ("Terms") govern your access to and use
              of this platform. By activating your account and using the
              services provided, you agree to be bound by these Terms. If you do
              not agree, you must not proceed with account activation.
            </p>

            <p>
              You agree to use the platform strictly for lawful purposes and in
              accordance with all applicable company policies and regulations.
              Unauthorized use, including but not limited to misuse of data,
              impersonation, or attempts to compromise system security, is
              strictly prohibited and may result in disciplinary action,
              suspension, or termination of access.
            </p>

            <p>
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activities that occur under your
              account. The organization shall not be liable for any loss or
              damage arising from your failure to safeguard your credentials.
            </p>

            <p>
              The company reserves the right to modify, suspend, or discontinue
              any part of the platform at any time without prior notice.
              Continued use of the platform after such changes constitutes
              acceptance of the updated Terms.
            </p>

            <p>
              All content, systems, and data provided through this platform
              remain the intellectual property of the organization. You may not
              copy, distribute, or exploit any part of the system without
              explicit authorization.
            </p>

            <p>
              Violation of these Terms may result in immediate termination of
              access, and in severe cases, legal action may be pursued in
              accordance with applicable laws and company policy.
            </p>

            <p>
              By proceeding, you acknowledge that you have read, understood, and
              agreed to these Terms and Conditions in their entirety.
            </p>
          </div>
        </Modal>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              This Privacy Policy outlines how your personal data is collected,
              used, stored, and protected when you use this platform. By
              activating your account, you consent to the practices described
              herein.
            </p>

            <p>
              We collect information including, but not limited to, your name,
              contact details, employment-related data, and any information you
              provide during onboarding and usage of the platform. This data is
              used strictly for operational, administrative, and compliance
              purposes.
            </p>

            <p>
              Your information is stored securely using appropriate technical
              and organizational measures to prevent unauthorized access,
              disclosure, or misuse. Access to your data is restricted to
              authorized personnel only.
            </p>

            <p>
              We do not sell, rent, or trade your personal data to third
              parties. However, your information may be shared with internal
              departments or external service providers strictly for business
              operations, legal compliance, or system functionality.
            </p>

            <p>
              The organization may retain your data for as long as necessary to
              fulfill employment, legal, or operational requirements. Upon
              termination of employment, data may be retained in accordance with
              applicable laws and company policies.
            </p>

            <p>
              You have the right to request access to, correction of, or
              deletion of your personal data, subject to legal and operational
              constraints. Requests may be submitted through appropriate company
              channels.
            </p>

            <p>
              This Privacy Policy may be updated periodically. Continued use of
              the platform constitutes acceptance of any changes made.
            </p>

            <p>
              By proceeding, you acknowledge that you have read and understood
              this Privacy Policy and consent to the collection and use of your
              data as described.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* Simple Reusable Modal */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-black">
          ✕
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto">{children}</div>
    </div>
  </div>
);

export default Onboarding;
