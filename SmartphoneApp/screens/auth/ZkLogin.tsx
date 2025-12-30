import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZkLogin } from '@/contexts/ZkLoginContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Smartphone, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ZkLogin: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { sendOTP, verifyOTP, resendOTP } = useZkLogin();
  const navigate = useNavigate();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned && !value.startsWith('+')) {
      return '+' + cleaned;
    }
    return value;
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validatePhoneNumber(formattedPhone)) {
      setError('Please enter a valid phone number with country code (e.g., +254712345678)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(formattedPhone);

      if (result.success) {
        setStep('otp');
        setPhoneNumber(formattedPhone);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOTP(phoneNumber, otp);
      
      if (result.success) {
        navigate('/railway-booking');
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await resendOTP(phoneNumber);
      if (result.success) {
        setError('');
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">zkLogin Authentication</CardTitle>
            <CardDescription className="text-center">
              Secure login with one-time password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Enter your phone number to receive a verification code
                  </span>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+254712345678"
                    className="mt-1"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code (e.g., +254 for Kenya, +234 for Nigeria)
                  </p>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>New to Africoin?</p>
                  <Link to="/zklogin-signup" className="text-orange-600 hover:underline font-medium">
                    Create an account
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Enter the 6-digit code sent to {phoneNumber}
                  </span>
                </div>

                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="mt-1 text-center text-2xl tracking-widest"
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                Secured with zkLogin technology
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZkLogin;
