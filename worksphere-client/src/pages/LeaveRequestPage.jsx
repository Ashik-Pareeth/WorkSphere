import React, { useState, useEffect } from 'react';
import LeaveBalanceCard from '../features/leave/LeaveBalanceCard';
import LeaveRequestForm from '../features/leave/LeaveRequestForm';
import MyLeaveRequestsTable from '../features/leave/MyLeaveRequestsTable';
import { getMyBalances, getMyLedger } from '../api/leaveApi';

const LeaveRequestPage = () => {
  const [balances, setBalances] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balData, ledgerData] = await Promise.all([
        getMyBalances(),
        getMyLedger(),
      ]);

      setBalances(balData);
      setLedger(ledgerData);
      console.log('Fetched balances:', balData);
      console.log('Fetched ledger:', ledgerData);
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
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-gray-500">
        Loading your Time Off profile...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
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

          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
            {new Date().getFullYear()}
          </span>
        </div>

        <div className="p-6">
          <LeaveBalanceCard balances={balances} />
        </div>
      </section>

      {/* LEDGER SECTION */}
      <section className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            Transaction Ledger
          </h2>
        </div>

        <div className="p-6">
          <MyLeaveRequestsTable ledger={ledger} />
        </div>
      </section>

      {/* REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
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
