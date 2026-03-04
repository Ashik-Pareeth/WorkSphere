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
    fetchData(); // Automatically refetch balances and ledger after a successful request!
  };

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center text-gray-500">
        Loading your Time Off profile...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-500 mt-1">
            Manage your balances, view history, and request time away.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-95"
        >
          + Request Time Off
        </button>
      </div>

      {/* Balances Widget */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          Current Balances{' '}
          <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {new Date().getFullYear()}
          </span>
        </h2>
        <LeaveBalanceCard balances={balances} />
      </section>

      {/* Ledger Widget */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Transaction Ledger
        </h2>
        <MyLeaveRequestsTable ledger={ledger} />
      </section>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                New Time Off Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <LeaveRequestForm
              balances={balances}
              onSuccess={handleRequestSuccess}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestPage;
