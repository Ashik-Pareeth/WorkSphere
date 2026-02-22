import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';

// Simple Icons
const MailIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const BriefcaseIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const ShieldIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);
const UserIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Using the user.id from context to fetch full details
        const response = await axiosInstance.get(`/employees/${user.id}`);
        setProfileData(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Could not load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 font-medium text-sm">
          Loading Profile...
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200">
          {error || 'Profile not found.'}
        </div>
      </div>
    );
  }

  // Safely grab initials for the avatar fallback
  const initials =
    `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`
      .trim()
      .toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-y-auto">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and view your roles.
        </p>
      </header>

      <main className="p-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT COLUMN: AVATAR & QUICK INFO */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center flex flex-col items-center">
              {/* AVATAR: We can upgrade this to an actual image tag later if you serve static files! */}
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                <span className="text-3xl font-bold text-blue-600">
                  {initials}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 capitalize">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-sm text-blue-600 font-medium mt-1 capitalize">
                {profileData.jobTitle || 'Employee'}
              </p>

              <div className="mt-6 w-full pt-6 border-t border-gray-100 flex flex-col gap-3 text-left">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MailIcon />
                  <span className="truncate">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <UserIcon />
                  <span>@{profileData.username}</span>
                </div>
              </div>
            </div>

            {/* SECURITY/ROLES CARD */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldIcon />
                <h3 className="font-bold text-gray-900">System Roles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.roles?.length > 0 ? (
                  profileData.roles.map((role) => (
                    <span
                      key={role.id}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-gray-200"
                    >
                      {role.roleName.replace('ROLE_', '')}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">
                    No roles assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED INFO */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <BriefcaseIcon /> Employment Details
                </h3>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Employee Status
                    </dt>
                    <dd className="text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${profileData.employeeStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {profileData.employeeStatus}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Department
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {profileData.departmentName || 'Unassigned'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Current Salary
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {/* Formats salary with commas based on local currency standards */}
                      {profileData.salary
                        ? `₹${profileData.salary.toLocaleString('en-IN')}`
                        : 'Not Disclosed'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Joining Date
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {profileData.joiningDate
                        ? new Date(profileData.joiningDate).toLocaleDateString()
                        : 'Pending Onboarding'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
