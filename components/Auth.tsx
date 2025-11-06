import { useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import { Button, Card, Input, Spinner } from './ui';
import { WalletIcon, EyeIcon, EyeOffIcon } from './Icons';
import { Role } from '../types';

const AuthPage: FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const refCode = searchParams.get('ref');
  const [isLogin, setIsLogin] = useState(!refCode);

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <WalletIcon className="mx-auto h-12 w-auto text-primary" />
        <h2 className="mt-6 text-3xl font-extrabold text-neutral-dark">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:text-primary-dark">
            {isLogin ? 'create a new account' : 'sign in to your account'}
          </button>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </Card>
      </div>
    </div>
  );
};

const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { user } = await api.login(formData.username, formData.password);
            login(user);
            if (user.role === 'ADMIN') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDemoLogin = async (role: Role) => {
        setLoading(true);
        setError('');
        const credentials = role === Role.ADMIN 
            ? { username: 'admin', password: 'password123' }
            : { username: 'user1', password: 'password123' };
        
        try {
            const { user } = await api.login(credentials.username, credentials.password);
            login(user);
            if (user.role === Role.ADMIN) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Demo login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Username or Email" id="username" name="username" type="text" value={formData.username} onChange={handleChange} required />
            <div className="relative">
                <Input label="Password" id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                    {showPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                </button>
            </div>
             <div className="flex items-center justify-end">
                <div className="text-sm">
                    <a href="#" className="font-medium text-primary hover:text-primary-hover">
                        Forgot your password?
                    </a>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full flex justify-center" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or try a demo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                 <Button type="button" variant="ghost" onClick={() => handleDemoLogin(Role.USER)} disabled={loading} className="w-full justify-center">
                    Login as User
                 </Button>
                 <Button type="button" variant="secondary" onClick={() => handleDemoLogin(Role.ADMIN)} disabled={loading} className="w-full justify-center">
                    Login as Admin
                 </Button>
            </div>
        </form>
    );
};

const RegisterForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref') || '';
    
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobile: '',
        whatsApp: '',
        referralCode: refCode,
        terms: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!formData.terms) {
            setError("You must accept the terms and conditions");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { user } = await api.register({ ...formData });
            login(user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
            <Input label="Username" id="username" name="username" value={formData.username} onChange={handleChange} required />
            <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            <Input label="Mobile Number" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
            <Input label="WhatsApp (Optional)" id="whatsApp" name="whatsApp" value={formData.whatsApp} onChange={handleChange} />
            <Input label="Referral Code (Optional)" id="referralCode" name="referralCode" value={formData.referralCode} onChange={handleChange} />
            <div className="flex items-center">
                <input id="terms" name="terms" type="checkbox" checked={formData.terms} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a></label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full flex justify-center" disabled={loading}>
                {loading ? <Spinner size="sm"/> : 'Register'}
            </Button>
        </form>
    );
};

export default AuthPage;