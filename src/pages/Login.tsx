import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import schoolLogo from '@/assets/school-logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsLoggedIn, setUserRole, setUserName, setAuthToken, setUserId, setUserEmail } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);

    const baseUrl = `${import.meta.env.VITE_API_URL}/auth`;

    try {
      // Try admin login first
      let response = await fetch(`${baseUrl}/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const token =
          (data && (data.token || data.accessToken || data.jwt || data.authToken)) ||
          (data?.data && (data.data.token || data.data.accessToken));

        const user = data?.user ?? data?.data?.user ?? null;
        setIsLoggedIn(true);
        setUserRole('admin');
        setUserName(user?.full_name || user?.fullName || user?.name || email);
        setUserEmail(String(user?.email ?? email));
        setUserId(user?.id ? String(user.id) : user?._id ? String(user._id) : null);
        if (token && typeof token === 'string') {
          setAuthToken(token);
        }
        navigate('/admission');
        return;
      }

      // If admin login fails, try teacher login
      response = await fetch(`${baseUrl}/teacher-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const token =
          (data && (data.token || data.accessToken || data.jwt || data.authToken)) ||
          (data?.data && (data.data.token || data.data.accessToken));

        const user = data?.user ?? data?.data?.user ?? null;
        setIsLoggedIn(true);
        setUserRole('teacher');
        setUserName(user?.full_name || user?.fullName || user?.name || email);
        setUserEmail(String(user?.email ?? email));
        setUserId(user?.id ? String(user.id) : user?._id ? String(user._id) : null);
        if (token && typeof token === 'string') {
          setAuthToken(token);
        }
        navigate('/students');
        return;
      }

      let errorMessage = 'Invalid email or password';
      try {
        const errorData = await response.json();
        if (typeof errorData?.error === 'string') errorMessage = errorData.error;
        else if (typeof errorData?.message === 'string') errorMessage = errorData.message;
      } catch {
        // ignore JSON parse errors
      }
      setError(errorMessage);
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'teacher') => {
    if (role === 'admin') {
      setEmail('admin@hassan.edu');
      setPassword('admin123');
    } else {
      setEmail('teacher@hassan.edu');
      setPassword('teacher123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg w-full max-w-[420px] p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={schoolLogo} alt="Hassan Public School Logo" className="w-[120px] h-[120px] rounded-full mb-4" />
          <h1 className="text-xl font-bold text-navy">Hassan Public School</h1>
          <p className="text-muted-foreground text-sm">Butmong — Management System</p>
          <p className="text-primary text-xs italic mt-1">"I Shall Rise and Shine"</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full mt-1 px-3 py-2.5 border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10 bg-card"
                placeholder="Enter password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">Quick Login</span></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => fillCredentials('admin')} className="px-3 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
              Login as Admin
            </button>
            <button onClick={() => fillCredentials('teacher')} className="px-3 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
              Login as Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
