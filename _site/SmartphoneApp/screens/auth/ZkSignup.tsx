import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZkLogin } from '@/contexts/ZkLoginContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Smartphone, ArrowLeft, Shield, User, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ZkSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    phoneNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
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

    // Validate form
    if (!formData.fullName || !formData.country || !formData.phoneNumber) {
      setError('Please fill in all required fields');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phoneNumber);
    
    if (!validatePhoneNumber(formattedPhone)) {
      setError('Please enter a valid phone number with country code (e.g., +254712345678)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(formattedPhone);

      if (result.success) {
        setStep('otp');
        setFormData({ ...formData, phoneNumber: formattedPhone });
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
      const result = await verifyOTP(formData.phoneNumber, otp);
      
      if (result.success) {
        // Store additional user info
        localStorage.setItem('zklogin_user_info', JSON.stringify({
          fullName: formData.fullName,
          country: formData.country
        }));
        
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
      const result = await resendOTP(formData.phoneNumber);
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
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Sign up with zkLogin for secure railway booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'details' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-800">
                    Create your account to book railway tickets
                  </span>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Kenya"
                      className="mt-1 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+254712345678"
                      className="mt-1 pl-10"
                    />
                  </div>
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
                    'Create Account'
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>Already have an account?</p>
                  <Link to="/zklogin" className="text-orange-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Enter the 6-digit code sent to {formData.phoneNumber}
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
                    'Verify & Create Account'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change details
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

export default ZkSignup;
