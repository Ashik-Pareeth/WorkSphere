import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { AnonymousToggle } from '../../features/bulletin/AnonymousToggle';
import { resolveProfilePicSrc } from '../../utils/profilePhoto';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef(null);
  const avatarSrc = resolveProfilePicSrc(user?.profilePic);

  // Fallback initials logic
  const getInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return 'U';
  };

  const highestRole = user?.roles?.[0]?.replace('ROLE_', '') || 'EMPLOYEE';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarSrc]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 transition focus:outline-none"
      >
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-semibold text-gray-800">
            {user?.firstName || 'User'}
          </span>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            {highestRole}
          </span>
        </div>

        {/* Avatar */}
        {avatarSrc && !avatarFailed ? (
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
            onError={() => setAvatarFailed(true)}
          />
        ) : null}
        
        {/* Fallback avatar */}
        <div 
          className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200 text-sm"
          style={{ display: avatarSrc && !avatarFailed ? 'none' : 'flex' }}
        >
          {getInitials()}
        </div>

        <ChevronDown size={14} className="text-gray-400 mr-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-50 flex flex-col sm:hidden">
            <span className="text-sm font-semibold text-gray-800">
              {user?.firstName || 'User'}
            </span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {highestRole}
            </span>
          </div>

          <div className="border-b border-gray-50 pb-1">
            <AnonymousToggle 
              user={user} 
              onUpdate={() => window.location.reload()} 
            />
          </div>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
            onClick={() => setIsOpen(false)}
          >
            <User size={16} />
            Profile
          </NavLink>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
