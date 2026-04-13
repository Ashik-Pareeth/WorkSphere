import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Users, X, Building2, User, ChevronRight, Lock, Search } from 'lucide-react';
import { ROLE_HIERARCHY, getHighestRole, canManage } from '../../utils/rbac';
import { GLOBAL_STYLES } from './shared/constants';
import { Avatar, RolePill, StatusPill } from './shared/atoms';
import EmployeeModal from './EmployeeModal';

/* ═══════════════════════════════════════════════════════════════
   SEARCH + FILTER BAR
═══════════════════════════════════════════════════════════════ */
function SearchFilterBar({
  search,
  setSearch,
  department,
  setDepartment,
  jobTitle,
  setJobTitle,
  departments,
  jobTitles,
}) {
  const hasFilter = department || jobTitle;
  const activeCount = [department, jobTitle].filter(Boolean).length;

  return (
    <div className="el-filter-bar">
      <div className="el-search-wrap">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="el-input el-search-input"
        />
        {search && (
          <button className="el-search-clear" onClick={() => setSearch('')}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="el-select-wrap">
        <Building2 size={13} />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="el-select"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="el-select-wrap">
        <User size={13} />
        <select
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="el-select"
        >
          <option value="">All Job Titles</option>
          {jobTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <button
          className="el-clear-btn"
          onClick={() => {
            setDepartment('');
            setJobTitle('');
          }}
        >
          <X size={11} /> Clear ({activeCount})
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE LIST PAGE
═══════════════════════════════════════════════════════════════ */
const EmployeeList = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const rawRole = getHighestRole(user?.roles ?? []);
  const viewerRank = ROLE_HIERARCHY[rawRole] ?? 1;

  useEffect(() => {
    axiosInstance
      .get('/employees')
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error('Failed to load employees', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = useCallback((updated) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelected(updated);
  }, []);

  const departments = useMemo(
    () =>
      [
        ...new Set(employees.map((e) => e.departmentName).filter(Boolean)),
      ].sort(),
    [employees]
  );
  const jobTitles = useMemo(
    () => [...new Set(employees.map((e) => e.jobTitle).filter(Boolean))].sort(),
    [employees]
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.departmentName?.toLowerCase().includes(q) ||
        emp.jobTitle?.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!department || emp.departmentName === department) &&
        (!jobTitle || emp.jobTitle === jobTitle)
      );
    });
  }, [employees, search, department, jobTitle]);

  if (loading) {
    return (
      <div className="el-root el-page">
        <div className="el-page-header">
          <div className="el-page-header-left">
            <div className="el-icon-box">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <div
                className="el-skeleton"
                style={{ height: 20, width: 220, marginBottom: 6 }}
              />
              <div className="el-skeleton" style={{ height: 13, width: 160 }} />
            </div>
          </div>
        </div>
        <div className="el-filter-bar">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="el-skeleton"
              style={{
                height: 38,
                flex: i === 1 ? 1 : 'none',
                width: i === 1 ? undefined : 188,
              }}
            />
          ))}
        </div>
        <div className="el-table-card">
          <div
            style={{
              height: 44,
              borderBottom: '1px solid var(--border)',
              background: 'var(--paper)',
            }}
          />
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div
                className="el-skeleton"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="el-skeleton"
                  style={{ height: 13, width: 180, marginBottom: 6 }}
                />
                <div
                  className="el-skeleton"
                  style={{ height: 11, width: 130 }}
                />
              </div>
              <div
                className="el-skeleton"
                style={{ height: 22, width: 80, borderRadius: 20 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="el-root">
      <style>{GLOBAL_STYLES}</style>

      <div className="el-page">
        {/* Page header */}
        <div className="el-page-header">
          <div className="el-page-header-left">
            <div className="el-icon-box">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <h1 className="el-page-title">Employee Directory</h1>
              <p className="el-page-subtitle">
                {employees.length} employees across all departments
              </p>
            </div>
          </div>
          <RolePill roleName={rawRole ?? 'EMPLOYEE'} />
        </div>

        {/* Search / filter */}
        <SearchFilterBar
          search={search}
          setSearch={setSearch}
          department={department}
          setDepartment={setDepartment}
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          departments={departments}
          jobTitles={jobTitles}
        />

        <p className="el-result-count">
          {filtered.length === employees.length
            ? `${employees.length} employees`
            : `${filtered.length} of ${employees.length} employees`}
        </p>

        {/* Table */}
        <div className="el-table-card">
          <table className="el-table">
            <thead className="el-thead">
              <tr>
                {[
                  'Employee',
                  'Email',
                  'Department',
                  'Job Title',
                  'Status',
                  '',
                ].map((h, i) => (
                  <th key={i} className="el-th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="el-empty">
                    No employees match your search or filters.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => {
                const manageable = canManage(viewerRank, emp.roles);
                return (
                  <tr
                    key={emp.id}
                    className="el-tr"
                    onClick={() => setSelected(emp)}
                  >
                    <td className="el-td">
                      <div className="el-name-cell">
                        <Avatar emp={emp} size={32} />
                        <span className="el-td-name">
                          {emp.firstName} {emp.lastName}
                        </span>
                        {!manageable && (
                          <Lock
                            size={10}
                            color="var(--border-md)"
                            title="You cannot manage this employee"
                          />
                        )}
                      </div>
                    </td>
                    <td className="el-td">{emp.email}</td>
                    <td className="el-td">{emp.departmentName || '—'}</td>
                    <td className="el-td">{emp.jobTitle || '—'}</td>
                    <td className="el-td">
                      <StatusPill status={emp.employeeStatus} />
                    </td>
                    <td className="el-td" style={{ textAlign: 'right' }}>
                      <ChevronRight
                        size={15}
                        className="el-chevron"
                        style={{ display: 'inline-block' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <EmployeeModal
          emp={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          viewerRank={viewerRank}
        />
      )}
    </div>
  );
};

export default EmployeeList;
