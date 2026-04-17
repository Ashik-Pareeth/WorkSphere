import React from 'react';

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function TaskFilterBar({
  filters,
  onChange,
  hasOversightAccess,
  isGlobalAdmin,
  isTeamManager,
  hasBothRoles,
  uniqueAssignees,
}) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasOversightAccess && (
        <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
          {/* My Tasks — always shown to anyone with oversight */}
          <button
            onClick={() => handleChange('viewMode', 'MY_TASKS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filters.viewMode === 'MY_TASKS'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Tasks
          </button>

          {/* Team View — shown to managers (pure or dual-role) */}
          {isTeamManager && (
            <button
              onClick={() => handleChange('viewMode', 'TEAM_TASKS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filters.viewMode === 'TEAM_TASKS'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Team View
            </button>
          )}

          {/* All Tasks — shown to HR/Admin (pure or dual-role) */}
          {isGlobalAdmin && (
            <button
              onClick={() => handleChange('viewMode', 'ALL_TASKS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filters.viewMode === 'ALL_TASKS'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {hasBothRoles ? 'All Tasks' : 'All Tasks'}
            </button>
          )}
        </div>
      )}

      <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>

      {/* Graveyard Toggle Button */}
      <button
        onClick={() => handleChange('showCancelled', !filters.showCancelled)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
          filters.showCancelled
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <EyeIcon />
        <span>{filters.showCancelled ? 'Hide Graveyard' : 'Show Cancelled'}</span>
      </button>

      {/* Assignee Filter (Only when viewing Team/All Tasks) */}
      {filters.viewMode !== 'MY_TASKS' && uniqueAssignees.length > 0 && (
        <select
          value={filters.filterAssignee || 'ALL'}
          onChange={(e) => handleChange('filterAssignee', e.target.value)}
          className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[120px] truncate"
        >
          <option value="ALL">All Employees</option>
          {uniqueAssignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}

      {/* Priority Filter */}
      <select
        value={filters.filterPriority || 'ALL'}
        onChange={(e) => handleChange('filterPriority', e.target.value)}
        className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      >
        <option value="ALL">All Priorities</option>
        <option value="URGENT">Urgent Priority</option>
        <option value="HIGH">High Priority</option>
        <option value="MEDIUM">Medium Priority</option>
        <option value="LOW">Low Priority</option>
      </select>
      
      {/* Date Range Filters */}
      <div className="flex items-center gap-1">
        <input 
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
          className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[120px]"
          title="Due Date From"
        />
        <span className="text-gray-400 text-xs">-</span>
        <input 
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleChange('dateTo', e.target.value)}
          className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[120px]"
          title="Due Date To"
        />
      </div>
      
      {(filters.dateFrom || filters.dateTo || filters.filterPriority !== 'ALL' || filters.filterAssignee !== 'ALL') && (
        <button 
          onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '', filterPriority: 'ALL', filterAssignee: 'ALL' })}
          className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
