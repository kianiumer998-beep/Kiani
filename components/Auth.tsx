import { useState, FC, FormEvent, useEffect, ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import { Button, Card, Input, Spinner } from './ui';
import { EyeIcon, EyeOffIcon } from './Icons';

const AuthPage: FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Card>
                    <h2 className="text-2xl font-bold text-center text-neutral-dark mb-6">
                        {isLogin ? 'Welcome Back!' : 'Create an Account'}
                    </h2>
                    {isLogin ? <LoginForm /> : <RegisterForm />}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </Card>
            </div>
        </div>
    );
};

const LoginForm: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await api.login(email, password);
            login(user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="relative">
                <Input label="Password" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                    {showPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Sign In'}
            </Button>
        </form>
    );
};

const RegisterForm: FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobile: '',
        sponsorId: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const refCode = new URLSearchParams(location.search).get('ref');
        if (refCode) {
            setFormData(prev => ({ ...prev, sponsorId: refCode }));
        }
    }, [location]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const newUser = await api.register({
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                mobile: formData.mobile,
                sponsorId: formData.sponsorId || null,
            });
            login(newUser);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
            <Input label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <div className="relative">
                <Input label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                    {showPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                </button>
            </div>
            <Input label="Confirm Password" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required />
            <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} required />
            <Input label="Referral Code (Optional)" name="sponsorId" value={formData.sponsorId} onChange={handleChange} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Sign Up'}
            </Button>
        </form>
    );
};

export default AuthPage;
