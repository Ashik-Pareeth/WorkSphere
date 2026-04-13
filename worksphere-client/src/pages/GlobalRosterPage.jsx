import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DailyRosterBoard from '../features/attendance/DailyRosterBoard';
import TimesheetAdjustModal from '../features/attendance/TimesheetAdjustModal';
import AuditLogDrawer from '../features/attendance/AuditLogDrawer';
import { Skeleton } from '../components/ui/skeleton';
import { getGlobalDailyRoster } from '../api/attendanceApi';

const GlobalRosterPage = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  const {
    data: roster = [],
    isLoading: rosterLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['globalRoster'],
    queryFn: getGlobalDailyRoster,
    refetchInterval: 60000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const handleEditTime = (employee) => {
    setSelectedRecord(employee);
    setIsAdjustModalOpen(true);
  };

  const handleViewHistory = (employee) => {
    setSelectedRecord(employee);
    setIsAuditDrawerOpen(true);
  };

  return (
    <>
      {isError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
          Unable to load the global roster. Ensure you have HR permissions.
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            📋 Company Live Roster
          </span>

          {lastUpdated && (
            <span className="text-xs font-semibold text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="p-4">
          {rosterLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <DailyRosterBoard
              roster={roster}
              onEditTime={handleEditTime}
              onViewHistory={handleViewHistory}
            />
          )}
        </div>
      </div>

      <TimesheetAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        attendanceId={selectedRecord?.attendanceId}
        currentClockIn={selectedRecord?.clockIn}
        currentClockOut={selectedRecord?.clockOut}
        onRefresh={() => refetch()}
      />

      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        attendanceId={selectedRecord?.attendanceId}
      />
    </>
  );
};

export default GlobalRosterPage;
