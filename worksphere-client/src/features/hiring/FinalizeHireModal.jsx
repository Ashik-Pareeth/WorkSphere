import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';
import { CheckCircle2 } from 'lucide-react';

const FinalizeHireModal = ({ isOpen, onClose, candidate, onHireFinalized }) => {
  const [loading, setLoading] = useState(false);

  // Form State
  const [salary, setSalary] = useState('');
  const [username, setUsername] = useState(''); // ← NEW
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');

  // Data Lists
  const [availableRoles, setAvailableRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    if (isOpen && candidate) {
      const emp = candidate.convertedEmployee;
      if (emp) {
        setSalary(emp.salary || '');
        setSelectedDept(emp.departmentId || '');
        setSelectedPos(emp.jobPositionId || '');
        setUsername(emp.userName || ''); // ← pre-fill auto-generated username
      }
      fetchFormData();
    }
  }, [isOpen, candidate]);

  const fetchFormData = async () => {
    try {
      const [rolesRes, empRes, deptRes, posRes, schedRes] = await Promise.all([
        axiosInstance.get('/roles'),
        axiosInstance.get('/employees'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/jobPositions'),
        axiosInstance.get('/api/work-schedules'),
      ]);

      setAvailableRoles(
        rolesRes.data.filter((r) => !r.roleName.includes('SUPER_ADMIN'))
      );
      setManagers(empRes.data.filter((e) => e.employeeStatus === 'ACTIVE'));
      setDepartments(deptRes.data);
      setPositions(posRes.data);
      setSchedules(schedRes.data);

      const employeeRole = rolesRes.data.find(
        (r) => r.roleName === 'ROLE_EMPLOYEE' || r.roleName === 'EMPLOYEE'
      );
      if (employeeRole) setSelectedRole(employeeRole.id);
    } catch (error) {
      toast.error('Failed to load form data.');
      console.error(error.response || error);
    }
  };

  const handleFinalize = async () => {
    if (!selectedRole || !selectedManager || !selectedDept || !selectedPos) {
      toast.error('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: candidate.convertedEmployee.id,
        salary: parseFloat(salary),
        departmentId: selectedDept,
        jobPositionId: selectedPos,
        roleIds: [selectedRole],
        managerId: selectedManager,
        username: username.trim() || undefined, // ← send only if HR changed it
        workScheduleId: selectedSchedule || undefined,
      };

      await axiosInstance.post('/employees/finalize-hire', payload);
      toast.success('Hire Finalized! Invitation email sent.');
      onHireFinalized();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize hire.');
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Verify & Finalize: {candidate.fullName}
          </DialogTitle>
          <DialogDescription>
            Review details before sending onboarding invite.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2">
            <Label>Salary</Label>
            <Input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>

          {/* ── USERNAME FIELD ── */}
          <div className="grid gap-2">
            <Label>
              Username
              <span className="ml-1 text-xs text-muted-foreground">
                (auto-generated)
              </span>
            </Label>
            <Input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '')
                )
              }
              placeholder="e.g. john.doe"
            />
          </div>

          <div className="grid gap-2">
            <Label>Primary Role *</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.roleName.replace('ROLE_', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Department *</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Select dept" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Job Position *</Label>
            <Select value={selectedPos} onValueChange={setSelectedPos}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.positionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 col-span-2">
            <Label>Line Manager *</Label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 col-span-2">
            <Label>
              Work Schedule
              <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.scheduleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Processing...' : 'Verify & Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizeHireModal;
