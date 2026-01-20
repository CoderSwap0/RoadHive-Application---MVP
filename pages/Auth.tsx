import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Select } from '../components/UI';
import { authService } from '../services/authService';
import { Truck, KeyRound, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '../App';
import { Role } from '../types';
import { useToast } from '../context/ToastContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Signup specific
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<Role>('SHIPPER');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (loginMethod === 'PASSWORD') {
            const user = await authService.loginWithPassword(email, password);
            setUser(user);
            showToast(`Welcome back, ${user.name}!`, 'success');
            navigate('/dashboard');
        } else {
            // OTP Flow
            if (!otpSent) {
                // Request OTP
                await authService.requestOtp(email);
                setOtpSent(true);
                // For MVP convenience
                setTimeout(() => alert(`Demo OTP for ${email}: Check Console`), 100);
            } else {
                // Verify OTP
                const user = await authService.verifyOtp(email, otp);
                setUser(user);
                showToast(`Welcome back, ${user.name}!`, 'success');
                navigate('/dashboard');
            }
        }
    } catch (err: any) {
        showToast(err.message || "Authentication failed", 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const user = await authService.signup({
            name, email, companyName, role, status: 'ACTIVE'
        });
        setUser(user);
        showToast("Account created successfully!", 'success');
        navigate('/dashboard');
    } catch (err: any) {
        showToast(err.message || "Signup failed", 'error');
    } finally {
        setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'SHIPPER', label: 'Shipper (Send Goods)' },
    { value: 'TRANSPORTER', label: 'Transporter (Fleet Owner)' },
    { value: 'DRIVER', label: 'Driver' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center mb-8">
        <Truck className="h-10 w-10 text-brand-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">RoadHive</h1>
      </div>
      
      <Card className="w-full max-w-md p-8">
        {otpSent && isLogin && (
            <button onClick={() => setOtpSent(false)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4">
                <ArrowLeft className="h-3 w-3 mr-1" /> Back to Email
            </button>
        )}

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {isLogin ? (loginMethod === 'PASSWORD' ? 'Welcome Back' : (otpSent ? 'Verify OTP' : 'Login with OTP')) : 'Join RoadHive'}
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {isLogin 
            ? (loginMethod === 'PASSWORD' ? 'Log in using your password' : (otpSent ? `Enter code sent to ${email}` : 'Log in using a one-time code')) 
            : 'Connect with the best logistics network'
          }
        </p>

        {isLogin && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                <button 
                    type="button"
                    onClick={() => { setLoginMethod('PASSWORD'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginMethod === 'PASSWORD' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Password
                </button>
                <button 
                    type="button"
                    onClick={() => { setLoginMethod('OTP'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginMethod === 'OTP' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Via OTP
                </button>
            </div>
        )}

        {isLogin ? (
            // Login Form
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                {!otpSent && (
                     <Input 
                        label="Email Address" 
                        type="email" 
                        name="email"
                        autoComplete="username"
                        placeholder="name@company.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        icon={Mail}
                    />
                )}
                
                {loginMethod === 'PASSWORD' && (
                    <div className="animate-in fade-in">
                        <Input 
                            label="Password" 
                            type="password" 
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            icon={Lock}
                        />
                         <div className="flex justify-end mt-1">
                            <button type="button" className="text-xs text-brand-600 hover:underline">Forgot password?</button>
                        </div>
                    </div>
                )}

                {loginMethod === 'OTP' && otpSent && (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <Input 
                            label="One-Time Password" 
                            type="text" 
                            name="otp"
                            autoComplete="one-time-code"
                            placeholder="123456" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required 
                            icon={KeyRound}
                            className="text-center tracking-widest text-lg font-mono"
                            maxLength={6}
                        />
                        <p className="text-xs text-center text-gray-400 mt-2">Check console logs for demo code</p>
                    </div>
                )}

                <Button type="submit" className="w-full mt-4" isLoading={loading}>
                    {loginMethod === 'PASSWORD' 
                        ? 'Sign In' 
                        : (otpSent ? 'Verify & Login' : 'Get OTP Code')
                    }
                </Button>
            </form>
        ) : (
            // Signup Form
            <form onSubmit={handleSignupSubmit} className="space-y-4">
                <Input 
                    label="Full Name" 
                    name="name"
                    autoComplete="name"
                    placeholder="John Doe" 
                    value={name} onChange={e => setName(e.target.value)} 
                    required 
                />
                <Input 
                    label="Company Name" 
                    name="companyName"
                    autoComplete="organization"
                    placeholder="Your Logistics Co." 
                    value={companyName} onChange={e => setCompanyName(e.target.value)} 
                    required 
                />
                <Select 
                    label="I am a..." 
                    options={roleOptions}
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                />
                <Input 
                    label="Email Address" 
                    type="email" 
                    name="email"
                    autoComplete="email"
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                />
                <Button type="submit" className="w-full mt-4" isLoading={loading}>
                    Create Account
                </Button>
            </form>
        )}

        {isLogin && loginMethod === 'PASSWORD' && (
          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-800">
            <strong>Demo Logins:</strong><br/>
            shipper@roadhive.com (Shipper)<br/>
            transporter@roadhive.com (Transporter)<br/>
            admin@roadhive.com (Admin)
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setOtpSent(false); }}
            className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </Card>
    </div>
  );
};