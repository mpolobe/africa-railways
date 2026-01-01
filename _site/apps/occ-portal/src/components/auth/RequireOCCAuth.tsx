/**
 * RequireOCCAuth - Authentication Guard for OCC Portal
 * 
 * Protects OCC routes by verifying:
 * 1. User is authenticated via Alchemy Account Kit
 * 2. User has approved status in database
 * 3. User has appropriate role for the route
 * 
 * Usage:
 *   <RequireOCCAuth>
 *     <OCCDashboard />
 *   </RequireOCCAuth>
 * 
 *   <RequireOCCAuth requiredRole="admin">
 *     <AdminPanel />
 *   </RequireOCCAuth>
 */

import React from 'react';
import { useAlchemyAccountContext } from "@account-kit/react";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AlchemyAuthContext';

interface RequireOCCAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'station_master' | 'operator' | 'staff';
  requiredStation?: string;
}

export const RequireOCCAuth: React.FC<RequireOCCAuthProps> = ({ 
  children, 
  requiredRole,
  requiredStation 
}) => {
  const { isConnected, isLoading } = useAlchemyAccountContext();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Secure Session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not connected to Alchemy
  if (!isConnected) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  // Redirect to login if no user profile
  if (!user) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  // Check if user account is approved
  if (user.status !== 'approved') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 mb-6">
            Your account is currently pending approval by an administrator.
            You will receive an email once your account has been approved.
          </p>
          <div className="bg-gray-50 rounded p-4 text-sm text-left">
            <p className="font-semibold mb-2">Account Details:</p>
            <p className="text-gray-600">Email: {user.email}</p>
            <p className="text-gray-600">Phone: {user.phoneNumber}</p>
            <p className="text-gray-600">Status: {user.status}</p>
          </div>
          <button
            onClick={() => window.location.href = '/staff-login'}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user account is suspended
  if (user.status === 'suspended' || user.status === 'revoked') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account {user.status === 'suspended' ? 'Suspended' : 'Revoked'}
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been {user.status}. Please contact your administrator
            for more information.
          </p>
          <div className="bg-red-50 rounded p-4 text-sm">
            <p className="text-red-800">
              If you believe this is an error, please contact:
              <br />
              <strong>admin@africarailways.com</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      admin: 4,
      station_master: 3,
      operator: 2,
      staff: 1
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-orange-500 text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You do not have sufficient permissions to access this page.
              Required role: <strong>{requiredRole}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check station-based access
  if (requiredStation && user.role !== 'admin') {
    const hasStationAccess = user.stations?.some(
      (station: any) => station.code === requiredStation
    );

    if (!hasStationAccess) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-orange-500 text-5xl mb-4">🚉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Station Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You do not have access to this station.
              Required station: <strong>{requiredStation}</strong>
            </p>
            <div className="bg-gray-50 rounded p-4 text-sm text-left">
              <p className="font-semibold mb-2">Your Assigned Stations:</p>
              {user.stations && user.stations.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600">
                  {user.stations.map((station: any) => (
                    <li key={station.code}>
                      {station.name} ({station.code})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No stations assigned</p>
              )}
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-6 w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed - render protected content
  return <>{children}</>;
};

export default RequireOCCAuth;
