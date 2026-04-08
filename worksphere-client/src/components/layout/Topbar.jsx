import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import AttendanceTracker from '../dashboard/AttendanceTracker';
import GlobalSearch from './GlobalSearch';

export default function Topbar({ globalSearchOpen, setGlobalSearchOpen }) {
  return (
    <header className="h-16 px-4 sm:px-8 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
      {/* Global Search Component */}
      <div className="flex-1 max-w-xl hidden sm:flex items-center gap-2">
        <GlobalSearch open={globalSearchOpen} setOpen={setGlobalSearchOpen} />
      </div>

      <div className="flex-1 sm:hidden">{/* Mobile space layout */}</div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <AttendanceTracker />

        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
