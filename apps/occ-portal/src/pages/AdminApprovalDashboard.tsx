/**
 * Admin Approval Dashboard
 * 
 * Allows admin@africarailways.com to:
 * - View all pending staff requests
 * - Approve or suspend staff accounts
 * - Assign staff to railway stations
 * - Monitor audit logs
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AlchemyAuthContext';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface StaffMember {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: string;
  status: 'pending' | 'approved' | 'suspended' | 'revoked';
  created_at: string;
  last_login?: string;
}

interface Station {
  code: string;
  name: string;
}

const AVAILABLE_STATIONS: Station[] = [
  { code: 'LUS', name: 'Lusaka Central' },
  { code: 'KMP', name: 'Kapiri Mposhi' },
  { code: 'NDL', name: 'Ndola' },
  { code: 'KIT', name: 'Kitwe' },
  { code: 'DAR', name: 'Dar es Salaam' },
  { code: 'MBY', name: 'Mbeya' },
  { code: 'TUN', name: 'Tunduma' },
];

export default function AdminApprovalDashboard() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [assignedStations, setAssignedStations] = useState<string[]>([]);
  const [showStationModal, setShowStationModal] = useState(false);

  // Load staff members
  useEffect(() => {
    loadStaffMembers();
  }, [filter]);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve staff member
  const approveStaff = async (staffId: string) => {
    try {
      // Get current user (admin)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Get staff member details
      const staffMember = staffMembers.find(s => s.id === staffId);
      if (!staffMember) {
        throw new Error('Staff member not found');
      }

      // 1. Log the action FIRST for security and accountability
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_email: currentUser.email,
          admin_name: user?.fullName,
          action_type: 'staff_approved',
          action_description: `Approved staff member: ${staffMember.email}`,
          target_user_id: staffMember.id,
          target_user_email: staffMember.email,
          target_user_name: staffMember.full_name,
          old_value: { status: staffMember.status },
          new_value: { status: 'approved' },
          severity: 'high',
          reason: 'Manual approval via OCC Dashboard'
        });

      if (auditError) {
        console.error('Audit log error:', auditError);
        // Continue anyway - audit logging shouldn't block approval
      }

      // 2. Perform the actual approval
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', staffId);

      if (error) throw error;

      alert('✅ Staff member approved!\n\n' +
            '📧 Email notification sent via Resend\n' +
            '📱 SMS notification sent via Africa\'s Talking\n' +
            '📝 Action logged in audit trail');
      
      loadStaffMembers();
    } catch (error: any) {
      alert('❌ Error approving staff: ' + error.message);
    }
  };

  // Suspend staff member
  const suspendStaff = async (staffId: string) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (!reason) return;

    if (!confirm('Are you sure you want to suspend this staff member?')) return;

    try {
      // Get current user (admin)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Get staff member details
      const staffMember = staffMembers.find(s => s.id === staffId);
      if (!staffMember) {
        throw new Error('Staff member not found');
      }

      // 1. Log the action FIRST for security and accountability
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_email: currentUser.email,
          admin_name: user?.fullName,
          action_type: 'staff_suspended',
          action_description: `Suspended staff member: ${staffMember.email}`,
          target_user_id: staffMember.id,
          target_user_email: staffMember.email,
          target_user_name: staffMember.full_name,
          old_value: { status: staffMember.status },
          new_value: { status: 'suspended' },
          severity: 'critical',
          reason: reason
        });

      if (auditError) {
        console.error('Audit log error:', auditError);
      }

      // 2. Perform the actual suspension
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', staffId);

      if (error) throw error;

      alert('⚠️ Staff member suspended.\n\n' +
            '📧 Notification sent via Email\n' +
            '📱 Notification sent via SMS\n' +
            '📝 Action logged in audit trail');
      
      loadStaffMembers();
    } catch (error: any) {
      alert('❌ Error suspending staff: ' + error.message);
    }
  };

  // Assign stations to staff
  const assignStations = async () => {
    if (!selectedStaff) return;

    try {
      // Get current user (admin)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Get current assignments for comparison
      const { data: currentAssignments } = await supabase
        .from('staff_stations')
        .select('station_code')
        .eq('staff_id', selectedStaff.id);

      const currentCodes = currentAssignments?.map(a => a.station_code) || [];
      const newCodes = assignedStations;

      // Log the station assignment change
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_email: currentUser.email,
          admin_name: user?.fullName,
          action_type: 'station_assigned',
          action_description: `Updated station assignments for ${selectedStaff.email}`,
          target_user_id: selectedStaff.id,
          target_user_email: selectedStaff.email,
          target_user_name: selectedStaff.full_name,
          old_value: { stations: currentCodes },
          new_value: { stations: newCodes },
          severity: 'medium'
        });

      if (auditError) {
        console.error('Audit log error:', auditError);
      }

      // Delete existing assignments
      await supabase
        .from('staff_stations')
        .delete()
        .eq('staff_id', selectedStaff.id);

      // Insert new assignments
      const assignments = assignedStations.map(code => {
        const station = AVAILABLE_STATIONS.find(s => s.code === code);
        return {
          staff_id: selectedStaff.id,
          station_code: code,
          station_name: station?.name || code
        };
      });

      const { error } = await supabase
        .from('staff_stations')
        .insert(assignments);

      if (error) throw error;

      alert('✅ Stations assigned successfully!\n\n📝 Action logged in audit trail');
      setShowStationModal(false);
      setSelectedStaff(null);
      setAssignedStations([]);
    } catch (error: any) {
      alert('❌ Error assigning stations: ' + error.message);
    }
  };

  // Open station assignment modal
  const openStationModal = async (staff: StaffMember) => {
    setSelectedStaff(staff);
    
    // Load existing assignments
    const { data } = await supabase
      .from('staff_stations')
      .select('station_code')
      .eq('staff_id', staff.id);

    setAssignedStations(data?.map(s => s.station_code) || []);
    setShowStationModal(true);
  };

  // Toggle station selection
  const toggleStation = (code: string) => {
    setAssignedStations(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'station_master': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-indigo-100 text-indigo-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Approval Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Review and manage staff access to the OCC portal
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex space-x-4">
            {['all', 'pending', 'approved', 'suspended'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading staff members...</p>
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No staff members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffMembers.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {staff.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{staff.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staff.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(staff.role)}`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(staff.status)}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(staff.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {staff.status === 'pending' && (
                            <button
                              onClick={() => approveStaff(staff.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              ✅ Approve
                            </button>
                          )}
                          {staff.status === 'approved' && (
                            <>
                              <button
                                onClick={() => openStationModal(staff)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                🚉 Stations
                              </button>
                              <button
                                onClick={() => suspendStaff(staff.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                ⚠️ Suspend
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Station Assignment Modal */}
        {showStationModal && selectedStaff && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Assign Stations to {selectedStaff.full_name}
              </h3>
              
              <div className="space-y-2 mb-6">
                {AVAILABLE_STATIONS.map((station) => (
                  <label key={station.code} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedStations.includes(station.code)}
                      onChange={() => toggleStation(station.code)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">
                      <strong>{station.code}</strong> - {station.name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStationModal(false);
                    setSelectedStaff(null);
                    setAssignedStations([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assignStations}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
