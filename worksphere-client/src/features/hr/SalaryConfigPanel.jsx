import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Settings } from 'lucide-react';

export default function SalaryConfigPanel({
  employees,
  jobPositions,
  openSalaryModal,
  openJobPositionSalaryModal,
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors text-sm">
          <Settings className="w-4 h-4" />
          Manage Structures
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Salary Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Salary Structures
            </h2>
            <p className="text-sm text-slate-600 font-medium mb-4">
              Click an employee to set or update their salary structure.
            </p>
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => openSalaryModal(emp)}
                  className="px-4 py-2 text-sm font-semibold text-slate-800 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors shadow-sm"
                >
                  {emp.firstName} {emp.lastName}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Job Position Templates
            </h2>
            <p className="text-sm text-slate-600 font-medium mb-4">
              Maintain reusable salary templates by position. Finalize hire will load from these defaults and then create an employee-specific copy.
            </p>
            <div className="flex flex-wrap gap-2">
              {jobPositions.map((position) => (
                <button
                  key={position.id}
                  onClick={() => openJobPositionSalaryModal(position)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {position.positionName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
