/**
 * Admin Audit Log Dashboard
 * 
 * "Safety First" requirement for railway operations
 * Tracks all administrative actions with full accountability
 * 
 * Features:
 * - View all admin actions
 * - Filter by action type, admin, date range
 * - Export audit logs
 * - Real-time updates
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AlchemyAuthContext';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuditLog {
  id: string;
  admin_email: string;
  admin_name: string;
  action_type: string;
  action_description: string;
  target_user_email: string;
  target_user_name: string;
  old_value: any;
  new_value: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  performed_at: string;
  reason?: string;
  ip_address?: string;
}

interface AdminSummary {
  admin_email: string;
  admin_name: string;
  total_actions: number;
  approvals: number;
  suspensions: number;
  station_assignments: number;
  critical_actions: number;
  last_action_at: string;
}

export default function AdminAuditLogDashboard() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    actionType: 'all',
    adminEmail: 'all',
    severity: 'all',
    dateRange: '7' // days
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
    loadAdminSummary();
  }, [filter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filter.actionType !== 'all') {
        query = query.eq('action_type', filter.actionType);
      }
      
      if (filter.adminEmail !== 'all') {
        query = query.eq('admin_email', filter.adminEmail);
      }
      
      if (filter.severity !== 'all') {
        query = query.eq('severity', filter.severity);
      }
      
      if (filter.dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filter.dateRange));
        query = query.gte('performed_at', daysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_summary')
        .select('*')
        .order('total_actions', { ascending: false });

      if (error) throw error;
      setAdminSummary(data || []);
    } catch (error) {
      console.error('Error loading admin summary:', error);
    }
  };

  // Export audit logs to CSV
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Admin Email',
      'Admin Name',
      'Action Type',
      'Description',
      'Target User',
      'Severity',
      'Old Value',
      'New Value'
    ];

    const rows = auditLogs.map(log => [
      new Date(log.performed_at).toISOString(),
      log.admin_email,
      log.admin_name || '',
      log.action_type,
      log.action_description,
      log.target_user_email || '',
      log.severity,
      JSON.stringify(log.old_value || {}),
      JSON.stringify(log.new_value || {})
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-audit-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'staff_approved': return '✅';
      case 'staff_suspended': return '⚠️';
      case 'staff_revoked': return '🚫';
      case 'staff_role_changed': return '🔄';
      case 'station_assigned': return '🚉';
      case 'station_removed': return '❌';
      default: return '📝';
    }
  };

  // Filter logs by search term
  const filteredLogs = auditLogs.filter(log =>
    searchTerm === '' ||
    log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Audit Log</h1>
              <p className="mt-2 text-gray-600">
                Complete accountability trail for all administrative actions
              </p>
              <p className="mt-1 text-sm text-orange-600 font-medium">
                🛡️ Safety First: Railway Operations Compliance
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Admin Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {adminSummary.slice(0, 3).map((admin) => (
            <div key={admin.admin_email} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {admin.admin_name || admin.admin_email}
                </h3>
                {admin.critical_actions > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    {admin.critical_actions} Critical
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Actions:</span>
                  <span className="font-semibold">{admin.total_actions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approvals:</span>
                  <span className="font-semibold text-green-600">{admin.approvals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suspensions:</span>
                  <span className="font-semibold text-red-600">{admin.suspensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Action:</span>
                  <span className="font-semibold text-xs">
                    {new Date(admin.last_action_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Action Type Filter */}
            <select
              value={filter.actionType}
              onChange={(e) => setFilter({ ...filter, actionType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="staff_approved">Approvals</option>
              <option value="staff_suspended">Suspensions</option>
              <option value="staff_role_changed">Role Changes</option>
              <option value="station_assigned">Station Assignments</option>
            </select>

            {/* Severity Filter */}
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadAuditLogs}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No audit logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.performed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.admin_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{log.admin_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getActionIcon(log.action_type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.action_type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">{log.action_description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.target_user_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{log.target_user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {log.old_value && log.new_value && (
                          <div className="text-xs space-y-1">
                            <div className="text-red-600">
                              From: {JSON.stringify(log.old_value)}
                            </div>
                            <div className="text-green-600">
                              To: {JSON.stringify(log.new_value)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSeverityColor(log.severity)}`}>
                          {log.severity.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🛡️ Immutable Audit Trail
          </h3>
          <p className="text-sm text-blue-800">
            All administrative actions are permanently logged and cannot be modified or deleted.
            This ensures complete accountability for TAZARA/ZRL railway operations compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
