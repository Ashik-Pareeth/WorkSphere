import React, { useState, useEffect } from 'react';
import LeaveBalanceCard from '../features/leave/LeaveBalanceCard';
import LeaveRequestForm from '../features/leave/LeaveRequestForm';
import MyLeaveRequestsTable from '../features/leave/MyLeaveRequestsTable';
import MyLeaveLedgerTable from '../features/leave/MyLeaveRequestsTable'; // <-- Your original ledger table
import {
  getMyBalances,
  getMyLedger,
  getMyLeaveRequests,
} from '../api/leaveApi';

const LeaveRequestPage = () => {
  const [balances, setBalances] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch ALL THREE data sources concurrently
      const [balData, ledgerData, requestsData] = await Promise.all([
        getMyBalances(),
        getMyLedger(),
        getMyLeaveRequests(),
      ]);

      setBalances(balData);
      setLedger(ledgerData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load leave data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSuccess = () => {
    setIsModalOpen(false);
    fetchData(); // Refreshes everything
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-gray-500 [&_*]:text-black">
        Loading your Time Off profile...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 **:text-black [&_button[type='submit']]:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Time Off</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your balances, view leave history, and request time away.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600  text-white--500 hover:text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          Request Time Off
        </button>
      </div>

      {/* BALANCE SECTION */}
      <section className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Current Balances
          </h2>
        </div>
        <div className="p-6">
          <LeaveBalanceCard balances={balances} />
        </div>
      </section>

      {/* REQUESTS SECTION */}
      <section className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            My Leave Requests
          </h2>
          <p className="text-sm text-slate-500">
            Track the status of your submitted time-off requests.
          </p>
        </div>
        <div className="p-6">
          <MyLeaveRequestsTable requests={requests} onRefresh={fetchData} balances={balances} />
        </div>
      </section>

      {/* LEDGER SECTION */}
      <section className="bg-white border rounded-xl shadow-sm opacity-90">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            Balance Ledger
          </h2>
          <p className="text-sm text-slate-500">
            A historical audit of all days accrued, adjusted, or deducted from
            your balances.
          </p>
        </div>
        <div className="p-6">
          <MyLeaveLedgerTable ledger={ledger} />
        </div>
      </section>

      {/* REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 [&_*]:text-black">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">
                New Time Off Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 text-lg"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <LeaveRequestForm
                balances={balances}
                onSuccess={handleRequestSuccess}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestPage;
