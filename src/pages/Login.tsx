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
  const { setIsLoggedIn, setUserRole, setUserName } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@hassan.edu' && password === 'admin123') {
      setIsLoggedIn(true);
      setUserRole('admin');
      setUserName('Muhammad Hassan');
      navigate('/admission');
    } else if (email === 'teacher@hassan.edu' && password === 'teacher123') {
      setIsLoggedIn(true);
      setUserRole('teacher');
      setUserName('Ayesha Siddiq');
      navigate('/students');
    } else {
      setError('Invalid email or password');
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
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <img src={schoolLogo} alt="Logo" className="w-16 h-16 rounded-full" />
          </div>
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
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Login
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
