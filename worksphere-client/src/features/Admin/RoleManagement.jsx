import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'sonner';

const RoleManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, rolesRes] = await Promise.all([
        axiosInstance.get('/employees'), // Might need a specific SuperAdmin endpoint if HR one limits them
        axiosInstance.get('/roles'),
      ]);
      setEmployees(empRes.data);
      setAvailableRoles(rolesRes.data);
    } catch (error) {
      console.error('Failed to load Role Management data', error);
      toast.error(
        'Failed to fetch employee data. Ensure you have SUPER_ADMIN privileges.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (employeeId, roleId, currentRoles) => {
    setActionLoading(true);
    try {
      // Check if user currently has this role
      const hasRole = currentRoles.some((r) => r.id === roleId);

      let newRoleIds;
      if (hasRole) {
        // Remove role
        newRoleIds = currentRoles
          .map((r) => r.id)
          .filter((id) => id !== roleId);
      } else {
        // Add role
        newRoleIds = [...currentRoles.map((r) => r.id), roleId];
      }

      const employee = employees.find((e) => e.id === employeeId);

      await axiosInstance.patch(`/employees/${employeeId}/roles`, newRoleIds);

      toast.success(
        `Roles updated for ${employee.firstName} ${employee.lastName}`
      );
      fetchData(); // Refresh to get pristine state
    } catch (error) {
      console.error('Failed to update role', error.response || error);
      toast.error('Failed to update role. Please check network logs.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            Super Admin Access Control
          </h1>
          <p className="text-gray-500 mt-2">
            Manage system-wide permissions and elevate user capabilities.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />{' '}
          Refresh
        </Button>
      </div>

      <Card className="border shadow-lg">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Role Management Registry</CardTitle>
              <CardDescription>
                Grant or revoke elevated privileges across the organization.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading Access Control Matrix...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="w-[300px]">Employee</TableHead>
                    <TableHead>Status</TableHead>
                    {/* Dynamic Role Columns */}
                    {availableRoles.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        {role.roleName.replace('ROLE_', '')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className="group hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                              {employee.firstName?.[0]}
                              {employee.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            employee.employeeStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : employee.employeeStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {employee.employeeStatus}
                        </span>
                      </TableCell>

                      {/* Role Toggles */}
                      {availableRoles.map((role) => {
                        const hasRole =
                          employee.roles?.some((r) => r.id === role.id) ||
                          false;
                        const isSuperAdminSwitch =
                          role.roleName === 'ROLE_SUPER_ADMIN';

                        return (
                          <TableCell key={role.id} className="text-center">
                            <Switch
                              checked={hasRole}
                              onCheckedChange={() =>
                                handleRoleToggle(
                                  employee.id,
                                  role.id,
                                  employee.roles || []
                                )
                              }
                              disabled={actionLoading}
                              className={
                                isSuperAdminSwitch && hasRole
                                  ? 'data-[state=checked]:bg-red-500'
                                  : ''
                              }
                              title={`Toggle ${role.roleName} for ${employee.firstName}`}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={availableRoles.length + 2}
                        className="h-24 text-center text-gray-500"
                      >
                        No employees found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;
