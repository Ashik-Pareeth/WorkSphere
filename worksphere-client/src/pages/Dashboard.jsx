import ActiveTasksWidget from '../components/dashboard/ActiveTasksWidget'; // Adjust path if needed!

const Dashboard = () => {
  // Extract user info from local storage for a personalized greeting
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'there';

  // Check role to conditionally show manager panels later
  const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isManagerOrAdmin =
    storedRoles.includes('ROLE_MANAGER') || storedRoles.includes('ROLE_ADMIN');

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans w-full overflow-y-auto">
      {/* --- DASHBOARD HEADER --- */}
      <header className="flex-none bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Good morning, {firstName}! ☕
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is what's happening in your workspace today.
        </p>
      </header>

      {/* --- DASHBOARD GRID --- */}
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-125">
          {/* PANEL 1: MY ACTIVE TASKS (Imported Component) */}
          <div className="lg:col-span-1 h-full">
            <ActiveTasksWidget />
          </div>

          {/* PANEL 2 & 3: EMPTY PLACEHOLDERS */}
          <div className="lg:col-span-2 h-full flex flex-col gap-6">
            {/* Top Empty Slot (Maybe Stats Row?) */}
            <div className="flex-1 bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
              + Add Stats Widget
            </div>

            {/* Bottom Empty Slot (Maybe Manager Approvals?) */}
            <div className="flex-2 bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
              + Add Workflow Widget
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
