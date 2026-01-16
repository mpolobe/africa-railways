/**
 * OAuth Consent Page for OCC Portal
 * 
 * Handles OAuth 2.1 authorization flow for third-party railway operators
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthorizationDetails {
  client: {
    id: string;
    name: string;
    logo_url?: string;
    country?: string;
  };
  redirect_uri: string;
  scopes: string[];
  state?: string;
}

const SCOPE_INFO: Record<string, { label: string; description: string; icon: string }> = {
  openid: { label: 'Identity', description: 'Verify your identity', icon: '🔐' },
  email: { label: 'Email', description: 'View your email address', icon: '📧' },
  profile: { label: 'Profile', description: 'View your name and profile', icon: '👤' },
  phone: { label: 'Phone', description: 'View your phone number', icon: '📱' },
  'read:tickets': { label: 'Read Tickets', description: 'View your railway tickets', icon: '🎫' },
  'write:tickets': { label: 'Manage Tickets', description: 'Create and validate tickets', icon: '✅' },
  'read:bookings': { label: 'Read Bookings', description: 'View your bookings', icon: '📋' },
  'write:bookings': { label: 'Manage Bookings', description: 'Create and modify bookings', icon: '📝' },
  'read:routes': { label: 'Routes', description: 'View route schedules', icon: '🚂' },
  'read:payments': { label: 'Payments', description: 'View payment history', icon: '💳' },
  'write:payments': { label: 'Process Payments', description: 'Process payments on your behalf', icon: '💰' },
  'read:africoin': { label: 'Wallet Balance', description: 'View your Africoin balance', icon: '🪙' },
  'write:africoin': { label: 'Transfer Africoin', description: 'Transfer Africoin tokens', icon: '💸' },
  'read:analytics': { label: 'Analytics', description: 'Access reports and analytics', icon: '📊' },
};

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        const returnUrl = window.location.href;
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      setUser(user);

      // Fetch client details
      if (clientId) {
        const { data: client, error: clientError } = await supabase
          .from('oauth_clients')
          .select('client_id, operator_name, operator_country, operator_logo_url')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();

        if (clientError || !client) {
          setError('Invalid or inactive OAuth client');
          setLoading(false);
          return;
        }

        setAuthDetails({
          client: {
            id: client.client_id,
            name: client.operator_name,
            logo_url: client.operator_logo_url,
            country: client.operator_country,
          },
          redirect_uri: redirectUri || '',
          scopes: scope?.split(' ').filter(Boolean) || [],
          state: state || undefined,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!user || !authDetails) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/oauth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: authDetails.client.id,
          redirect_uri: authDetails.redirect_uri,
          scope: authDetails.scopes.join(' '),
          state: authDetails.state,
          user_id: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        setError('Failed to process authorization');
      }
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!user || !authDetails) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/oauth/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: authDetails.client.id,
          redirect_uri: authDetails.redirect_uri,
          state: authDetails.state,
          user_id: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.redirect_to) {
        window.location.href = data.redirect_to;
      }
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authorization request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authorization Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!authDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {authDetails.client.logo_url ? (
              <img 
                src={authDetails.client.logo_url} 
                alt={authDetails.client.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <span className="text-3xl">🚂</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Authorize {authDetails.client.name}
          </h1>
          {authDetails.client.country && (
            <p className="text-gray-500">{authDetails.client.country}</p>
          )}
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-medium text-gray-900">{user?.email || user?.phone}</p>
        </div>

        {/* Requested Permissions */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            This application is requesting access to:
          </h2>
          <div className="space-y-2">
            {authDetails.scopes.map((scope) => {
              const info = SCOPE_INFO[scope] || {
                label: scope,
                description: `Access to ${scope}`,
                icon: '🔑'
              };
              return (
                <div 
                  key={scope} 
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{info.label}</p>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Security Notice</p>
              <p className="text-yellow-700">
                Only authorize applications you trust. You can revoke access anytime from your account settings.
              </p>
            </div>
          </div>
        </div>

        {/* Redirect URI */}
        <div className="text-xs text-gray-500 mb-6">
          <p>You will be redirected to:</p>
          <p className="font-mono break-all">{authDetails.redirect_uri}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleDeny}
            disabled={processing}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            {processing ? '...' : 'Deny'}
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 font-medium"
          >
            {processing ? 'Processing...' : 'Authorize'}
          </button>
        </div>
      </div>
    </div>
  );
}
