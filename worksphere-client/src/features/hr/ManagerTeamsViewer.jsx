import React, { useEffect, useState, useMemo } from 'react';
import { getAllEmployees } from '../../api/employeeApi';
import { Search, UserCircle, Building2, User } from 'lucide-react';

const API_BASE = 'http://localhost:8080'; // Typically retrieved from environment or axios instance. But we can use relative.

function Avatar({ emp, size = 40 }) {
  const profileSrc = emp.profilePic
    ? `${API_BASE}/uploads/profilePhoto/${emp.profilePic}`
    : null;

  if (profileSrc) {
    return (
      <img
        src={profileSrc}
        alt={emp.firstName}
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  
  return (
    <div
      className="rounded-lg flex items-center justify-center bg-blue-100 text-blue-700 font-bold"
      style={{ width: size, height: size }}
    >
      {emp.firstName?.[0] || ''}{emp.lastName?.[0] || ''}
    </div>
  );
}

const ManagerTeamsViewer = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Failed to load employees for team viewer", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Determine who the managers are:
  // Either they have ROLE_MANAGER, or someone actively points to them as managerId.
  const managers = useMemo(() => {
    const managerIdsWithSubordinates = new Set(
      employees.map(e => e.managerId).filter(Boolean)
    );
    
    return employees.filter(emp => 
      managerIdsWithSubordinates.has(emp.id) || 
      emp.roles?.some(r => r.roleName === 'ROLE_MANAGER')
    ).sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [employees]);

  // Filter managers by search
  const filteredManagers = useMemo(() => {
    const q = search.toLowerCase();
    return managers.filter(m => 
      m.firstName.toLowerCase().includes(q) || 
      m.lastName.toLowerCase().includes(q) ||
      m.departmentName?.toLowerCase().includes(q)
    );
  }, [managers, search]);

  // Get subordinates
  const teamMembers = useMemo(() => {
    if (!selectedManagerId) return [];
    return employees.filter(emp => emp.managerId === selectedManagerId)
                    .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [employees, selectedManagerId]);

  const selectedManager = managers.find(m => m.id === selectedManagerId);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* ── Left Sidebar (Manager Selector) ── */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full z-10">
        <div className="px-5 py-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircle size={18} className="text-blue-600"/>
            Select a Manager
          </h2>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-sm text-gray-400 text-center animate-pulse">
              Loading managers...
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              No managers found.
            </div>
          ) : (
            filteredManagers.map((mgr) => {
              const isSelected = selectedManagerId === mgr.id;
              // Compute team size
              const teamSize = employees.filter(e => e.managerId === mgr.id).length;
              
              return (
                <button
                  key={mgr.id}
                  onClick={() => setSelectedManagerId(mgr.id)}
                  className={`w-full text-left p-3 mb-1 rounded-xl transition-all flex items-center gap-3 border border-transparent ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar emp={mgr} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                      {mgr.firstName} {mgr.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Building2 size={10} /> {mgr.departmentName || 'No Dept'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {teamSize} Reps
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right Content (Team view) ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {!selectedManager ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <User size={48} className="mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-600">No Manager Selected</h3>
            <p className="text-sm mt-1 text-gray-500">Choose a manager from the sidebar to view their reporting structure.</p>
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 flex items-center gap-6">
              <Avatar emp={selectedManager} size={72} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Team {selectedManager.lastName}
                </h1>
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {selectedManager.jobTitle || 'Manager'}
                  </span>
                  ·
                  <span>{selectedManager.email}</span>
                </p>
              </div>
            </div>

            {/* Subordinates Grid */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Direct Reports <span className="text-gray-400 font-normal ml-1">({teamMembers.length})</span>
              </h2>
            </div>
            
            {teamMembers.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                <p className="text-gray-500 font-medium">This manager currently has no direct reports assigned.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teamMembers.map(emp => (
                  <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-4">
                      <Avatar emp={emp} size={48} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {emp.jobTitle || 'Employee'}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                            emp.employeeStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {emp.employeeStatus || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerTeamsViewer;
