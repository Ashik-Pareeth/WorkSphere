import React, { useEffect, useMemo, useState } from 'react';
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
import { CheckCircle2, RefreshCw } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import SalaryStructureForm from '../hr/SalaryStructureForm';
import SalaryStructureModal from '../hr/SalaryStructureModal';
import {
  buildSalaryPayload,
  calculateSalaryGross,
  DEFAULT_SALARY_FORM,
  parseAmount,
  toSalaryForm,
} from '../hr/salaryStructureUtils';
import { fetchSalaryStructureTemplate } from '../../api/hrApi';
import { fetchOfferForCandidate } from '../../api/hiringApi';

const today = new Date().toISOString().split('T')[0];

const FinalizeHireModal = ({ isOpen, onClose, candidate, onHireFinalized }) => {
  const [loading, setLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const [salary, setSalary] = useState('');
  const [salarySource, setSalarySource] = useState('Manual');
  const [salaryForm, setSalaryForm] = useState(DEFAULT_SALARY_FORM);
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');

  const [availableRoles, setAvailableRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const selectedJobPosition = useMemo(
    () => positions.find((position) => position.id === selectedPos) || null,
    [positions, selectedPos]
  );

  const applySalaryForm = (nextForm, sourceLabel) => {
    const normalized = toSalaryForm(nextForm);
    const gross = calculateSalaryGross(normalized);
    setSalaryForm(normalized);
    setSalary(gross.toFixed(2));
    setSalarySource(sourceLabel);
  };

  const loadTemplateForPosition = async (jobPositionId, sourceLabel = 'Job position template') => {
    if (!jobPositionId) {
      setSalaryForm(DEFAULT_SALARY_FORM);
      setSalary('');
      setSalarySource('Manual');
      return;
    }

    setSalaryLoading(true);
    try {
      const res = await fetchSalaryStructureTemplate(jobPositionId);
      applySalaryForm(res.data, sourceLabel);
    } catch (error) {
      console.error('Failed to load salary template', error);
      toast.error('Failed to load salary template.');
    } finally {
      setSalaryLoading(false);
    }
  };

  const initializeSalaryForCandidate = async (jobPositionId, currentSalary) => {
    setSalaryLoading(true);
    try {
      const offerRes = await fetchOfferForCandidate(candidate.id);
      const snapshot = offerRes.data?.salaryStructureSnapshot;
      if (snapshot) {
        const parsedSnapshot = JSON.parse(snapshot);
        applySalaryForm(
          { ...parsedSnapshot, effectiveDate: parsedSnapshot.effectiveDate || today },
          'Accepted offer snapshot'
        );
        return;
      }
    } catch (error) {
      console.info('No offer snapshot available for finalize-hire prefill', error);
    } finally {
      setSalaryLoading(false);
    }

    if (jobPositionId) {
      await loadTemplateForPosition(jobPositionId);
      return;
    }

    if (currentSalary) {
      applySalaryForm(
        {
          baseSalary: currentSalary,
          hra: 0,
          da: 0,
          travelAllowance: 0,
          otherAllowances: 0,
          professionalTax: 0,
          pfEmployeePercent: 12,
          pfEmployerPercent: 12,
          effectiveDate: today,
        },
        'Existing employee salary'
      );
    }
  };

  useEffect(() => {
    if (!isOpen || !candidate) return;

    const emp = candidate.convertedEmployee;
    if (emp) {
      setSalary(emp.salary ? String(emp.salary) : '');
      setSelectedDept(emp.departmentId || '');
      setSelectedPos(emp.jobPositionId || '');
      setUsername(emp.userName || emp.username || '');
    }

    setSelectedManager('');
    setSelectedSchedule('');
    setSalarySource('Loading...');
    setSalaryForm(DEFAULT_SALARY_FORM);

    fetchFormData();
    initializeSalaryForCandidate(
      emp?.jobPositionId || candidate?.jobOpening?.jobPosition?.id,
      emp?.salary
    );
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

  const handlePositionChange = async (nextPositionId) => {
    setSelectedPos(nextPositionId);
    await loadTemplateForPosition(nextPositionId);
  };

  const handleFinalize = async () => {
    if (!selectedRole || !selectedManager || !selectedDept || !selectedPos) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (parseAmount(salaryForm.baseSalary) <= 0) {
      toast.error('Base salary is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: candidate.convertedEmployee.id,
        salary: parseAmount(salary),
        departmentId: selectedDept,
        jobPositionId: selectedPos,
        roleIds: [selectedRole],
        managerId: selectedManager,
        username: username.trim() || undefined,
        workScheduleId: selectedSchedule || undefined,
        ...buildSalaryPayload(salaryForm),
      };

      await axiosInstance.post('/employees/finalize-hire', payload);
      toast.success('Hire finalized and onboarding invite sent.');
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Verify & Finalize: {candidate.fullName}
            </DialogTitle>
            <DialogDescription>
              Review access, reporting lines, and salary structure before sending the onboarding invite.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                Gross Salary
                <span className="ml-1 text-xs text-muted-foreground">
                  (auto-calculated)
                </span>
              </Label>
              <Input type="number" value={salary} readOnly className="bg-slate-50" />
            </div>

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
              <Select value={selectedPos} onValueChange={handlePositionChange}>
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

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Salary Structure
                </h3>
                <p className="text-sm text-slate-600">
                  Source: {salaryLoading ? 'Loading...' : salarySource}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedPos || salaryLoading}
                  onClick={() => loadTemplateForPosition(selectedPos)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedJobPosition}
                  onClick={() => setTemplateModalOpen(true)}
                >
                  Edit Position Template
                </Button>
              </div>
            </div>

            <SalaryStructureForm
              value={salaryForm}
              onChange={(nextForm) => {
                setSalarySource('Custom in finalize hire');
                applySalaryForm(nextForm, 'Custom in finalize hire');
              }}
              disabled={salaryLoading}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={loading || salaryLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Verify & Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SalaryStructureModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        jobPosition={selectedJobPosition}
        onSave={() => {
          toast.success('Position salary template saved.');
          if (selectedPos) {
            loadTemplateForPosition(selectedPos, 'Updated job position template');
          }
        }}
      />
    </>
  );
};

export default FinalizeHireModal;
