import { useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { User } from '../types';
import { Card, Spinner, Button, Input, Tabs } from './ui';

const ProfileInformation: FC<{ user: User }> = ({ user }) => {
    const [formData, setFormData] = useState({
        fullName: user.fullName || '',
        mobile: user.mobile || '',
        whatsApp: user.whatsApp || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.updateProfile(user.id, formData);
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
                <Input label="WhatsApp (Optional)" name="whatsApp" value={formData.whatsApp} onChange={handleChange} />

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-600 text-sm">{success}</p>}

                <div className="pt-2">
                    <Button type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm"/> : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

const ChangePassword: FC<{ userId: string }> = ({ userId }) => {
    const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.changePassword(userId, formData.oldPassword, formData.newPassword);
            setSuccess('Password changed successfully!');
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Clear form
        } catch (err: any) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Old Password" name="oldPassword" type="password" value={formData.oldPassword} onChange={handleChange} required />
                <Input label="New Password" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} required />
                <Input label="Confirm New Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-600 text-sm">{success}</p>}

                <div className="pt-2">
                    <Button type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm"/> : 'Change Password'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};


const ProfilePage: FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }
    
    const tabs = [
        { name: 'Profile Information', content: <ProfileInformation user={user} /> },
        { name: 'Change Password', content: <ChangePassword userId={user.id} /> },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">My Profile</h1>
            <Tabs tabs={tabs} />
        </div>
    );
};

export default ProfilePage;