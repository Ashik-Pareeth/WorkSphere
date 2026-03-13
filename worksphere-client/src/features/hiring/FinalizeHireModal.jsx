import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const FinalizeHireModal = ({ isOpen, onClose, candidate, onHireFinalized }) => {
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedManager, setSelectedManager] = useState('');
    
    // Data Lists
    const [availableRoles, setAvailableRoles] = useState([]);
    const [managers, setManagers] = useState([]);
    // Note: Work Schedule would go here, omitting for brevity/matching existing data model right now

    useEffect(() => {
        if (isOpen && candidate) {
            fetchFormData();
        }
    }, [isOpen, candidate]);

    const fetchFormData = async () => {
        try {
            // Fetch roles and active employees (potential managers)
            const [rolesRes, empRes] = await Promise.all([
                axiosInstance.get('/roles'),
                axiosInstance.get('/employees')
            ]);
            
            // Filter out SUPER_ADMIN for HR
            const filteredRoles = rolesRes.data.filter(r => !r.roleName.includes('SUPER_ADMIN'));
            setAvailableRoles(filteredRoles);
            
            // Managers are usually people with a MANAGER role, or just anyone active
            const managerList = empRes.data.filter(e => e.employeeStatus === 'ACTIVE');
            setManagers(managerList);
            
            // Try to pre-select EMPLOYEE role if it exists
            const employeeRole = filteredRoles.find(r => r.roleName === 'ROLE_EMPLOYEE' || r.roleName === 'EMPLOYEE');
            if (employeeRole) setSelectedRole(employeeRole.id);

        } catch (error) {
            console.error("Failed to load form data", error);
            toast.error("Failed to load roles and managers.");
        }
    };

    const handleFinalize = async () => {
        if (!selectedRole || !selectedManager) {
            toast.error("Please select a Role and a Line Manager.");
            return;
        }

        setLoading(true);
        try {
            // The candidate object has a reference to the convertedEmployee id
            const employeeId = candidate.convertedEmployee?.id;
            
            if (!employeeId) {
                toast.error("Employee profile not found for this candidate.");
                setLoading(false);
                return;
            }

            const payload = {
                employeeId: employeeId,
                roleIds: [selectedRole],
                managerId: selectedManager,
                // workScheduleId: null 
            };

            await axiosInstance.post('/employees/finalize-hire', payload);
            
            toast.success("Hire Finalized! Invitation email sent.");
            onHireFinalized();
            onClose();
        } catch (error) {
            console.error("Failed to finalize hire", error);
            toast.error(error.response?.data?.message || "Something went wrong finalizing the hire.");
        } finally {
            setLoading(false);
        }
    };

    if (!candidate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Finalize Hire: {candidate.fullName}
                    </DialogTitle>
                    <DialogDescription>
                        Assign their final role and line manager to trigger the official Onboarding invite.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="role">Primary Role <span className="text-red-500">*</span></Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.roleName.replace('ROLE_', '')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="manager">Line Manager <span className="text-red-500">*</span></Label>
                        <Select value={selectedManager} onValueChange={setSelectedManager}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map(mgr => (
                                    <SelectItem key={mgr.id} value={mgr.id}>
                                        {mgr.firstName} {mgr.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 text-blue-800 dark:text-blue-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-xs">
                        Clicking "Finalize & Send Invite" will email {candidate.email} their temporary login credentials so they can complete the self-serve onboarding.
                    </p>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleFinalize} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? 'Processing...' : 'Finalize & Send Invite'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FinalizeHireModal;
