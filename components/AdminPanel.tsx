import { useState, useEffect, type FC, type ChangeEvent, type FormEvent } from 'react';
import { api } from '../services/api';
import { User, Plan, Commission, DepositRequest, WithdrawalRequest, Status, Transaction } from '../types';
import { Card, Spinner, Table, Tabs, Button, Input } from './ui';
import { exportToCsv } from '../utils/export';

// User Management
const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAllUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Spinner />;

    return (
        <Card title="Manage Users">
            {/* FIX: Explicitly provide the generic type to the Table component */}
            <Table<User>
                columns={[
                    { header: 'Username', accessor: 'username' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Wallet Balance', accessor: (user) => `$${user.wallet.available.toFixed(2)}` },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Joined Date', accessor: (user) => new Date(user.createdAt).toLocaleDateString() },
                    { header: 'Actions', accessor: () => <Button size="sm">Edit</Button> }
                ]}
                data={users}
            />
        </Card>
    );
};


// PlanForm Component for creating/editing plans
interface PlanFormProps {
    plan: Plan | null;
    onSave: () => void;
    onCancel: () => void;
}

const PlanForm: FC<PlanFormProps> = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: plan?.title || '',
        price: plan?.price || 0,
        duration: plan?.duration || 0,
        status: plan?.status || Status.ACTIVE,
    });
    const [commissions, setCommissions] = useState<{ level: string; percentage: number }[]>(
        plan ? Object.entries(plan.commissionStructure).map(([level, percentage]) => ({ level, percentage })) : [{ level: '1', percentage: 0 }]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'duration' ? Number(value) : value }));
    };

    const handleCommissionChange = (index: number, field: 'level' | 'percentage', value: string) => {
        const newCommissions = [...commissions];
        newCommissions[index] = { ...newCommissions[index], [field]: field === 'percentage' ? Number(value) : value };
        setCommissions(newCommissions);
    };

    const addCommissionLevel = () => {
        setCommissions([...commissions, { level: (commissions.length + 1).toString(), percentage: 0 }]);
    };
    
    const removeCommissionLevel = (index: number) => {
        if (commissions.length > 1) {
            const newCommissions = commissions.filter((_, i) => i !== index);
            setCommissions(newCommissions);
        }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const commissionStructure = commissions.reduce((acc, curr) => {
            if (curr.level && curr.percentage > 0) {
                acc[curr.level] = curr.percentage;
            }
            return acc;
        }, {} as { [key: string]: number });
        
        const planData = { ...formData, commissionStructure };

        try {
            if (plan) {
                await api.updatePlan(plan.id, planData);
            } else {
                await api.createPlan(planData as Omit<Plan, 'id'>);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save plan.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card title={plan ? 'Edit Plan' : 'Create New Plan'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Plan Title" name="title" value={formData.title} onChange={handleChange} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Price ($)" name="price" type="number" value={formData.price} onChange={handleChange} required />
                    <Input label="Duration (days)" name="duration" type="number" value={formData.duration} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                        <option value={Status.ACTIVE}>Active</option>
                        <option value={Status.INACTIVE}>Inactive</option>
                    </select>
                </div>

                <div>
                     <h4 className="font-semibold mb-2">Commission Structure</h4>
                     {commissions.map((comm, index) => (
                         <div key={index} className="flex items-center space-x-2 mb-2">
                            <div className="w-1/3">
                                <Input label={`Level`} type="text" value={comm.level} onChange={e => handleCommissionChange(index, 'level', e.target.value)} placeholder="e.g., 1" />
                            </div>
                            <div className="w-2/3">
                                <Input label="Percentage (%)" type="number" value={comm.percentage} onChange={e => handleCommissionChange(index, 'percentage', e.target.value)} placeholder="e.g., 10" />
                            </div>
                             <Button type="button" variant="danger" size="sm" onClick={() => removeCommissionLevel(index)} className="mt-6 !px-3 !py-2">X</Button>
                         </div>
                     ))}
                     <Button type="button" variant="ghost" size="sm" onClick={addCommissionLevel}>+ Add Level</Button>
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Save Plan'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

// Plan Management
const PlanManagement = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | 'new' | null>(null);

    const fetchPlans = () => {
        setLoading(true);
        api.getAllPlans().then(data => {
            setPlans(data);
            setLoading(false);
        });
    };

    useEffect(fetchPlans, []);

    const handleSavePlan = () => {
        fetchPlans();
        setEditingPlan(null);
    };

    if (loading) return <Spinner />;

    if(editingPlan) {
        return <PlanForm plan={editingPlan === 'new' ? null : editingPlan} onSave={handleSavePlan} onCancel={() => setEditingPlan(null)} />;
    }
    
    return (
        <Card title="Manage Plans">
             <div className="flex justify-end mb-4">
                <Button onClick={() => setEditingPlan('new')}>Add New Plan</Button>
            </div>
            {/* FIX: Explicitly provide the generic type to the Table component */}
            <Table<Plan>
                columns={[
                    { header: 'Title', accessor: 'title' },
                    { header: 'Price', accessor: (plan) => `$${plan.price.toFixed(2)}` },
                    { header: 'Duration (days)', accessor: 'duration' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Actions', accessor: (plan) => <Button size="sm" onClick={() => setEditingPlan(plan)}>Edit</Button> }
                ]}
                data={plans}
            />
        </Card>
    );
};

// Commission Management
const CommissionManagement = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchCommissions = () => {
        setLoading(true);
        api.getAllCommissions().then(data => {
            setCommissions(data);
            setLoading(false);
        });
    };

    useEffect(fetchCommissions, []);

    const handleUpdateStatus = async (id: string, status: Status.APPROVED | Status.REJECTED) => {
        await api.updateCommissionStatus(id, status);
        fetchCommissions();
    };


    if (loading) return <Spinner />;

    return (
        <Card title="Manage Commissions">
            {/* FIX: Explicitly provide the generic type to the Table component */}
            <Table<Commission>
                columns={[
                    { header: 'User ID', accessor: 'userId' },
                    { header: 'From User ID', accessor: 'fromUserId' },
                    { header: 'Amount', accessor: (c) => `$${c.amount.toFixed(2)}` },
                    { header: 'Level', accessor: 'level' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Date', accessor: (c) => new Date(c.createdAt).toLocaleDateString() },
                    { header: 'Actions', accessor: (c) => (
                        <div className="space-x-2">
                            {c.status === Status.HELD && (
                                <>
                                    <Button size="sm" onClick={() => handleUpdateStatus(c.id, Status.APPROVED)}>Approve</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(c.id, Status.REJECTED)}>Reject</Button>
                                </>
                            )}
                        </div>
                    )}
                ]}
                data={commissions}
            />
        </Card>
    );
};


// Deposit Management
const DepositManagement = () => {
    const [deposits, setDeposits] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDeposits = () => {
        setLoading(true);
        api.getAllDeposits().then(data => {
            setDeposits(data);
            setLoading(false);
        });
    };

    useEffect(fetchDeposits, []);

    const handleUpdate = async (id: string, status: Status.APPROVED | Status.REJECTED) => {
        await api.updateDepositStatus(id, status);
        fetchDeposits();
    };

    if (loading) return <Spinner />;

    return (
        <Card title="Manage Deposits">
            {/* FIX: Explicitly provide the generic type to the Table component */}
            <Table<DepositRequest>
                columns={[
                    { header: 'User ID', accessor: 'userId' },
                    { header: 'Amount', accessor: (d) => `$${d.amount.toFixed(2)}` },
                    { header: 'Method', accessor: 'method' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Date', accessor: (d) => new Date(d.createdAt).toLocaleDateString() },
                    { header: 'Actions', accessor: (d) => (
                        d.status === Status.PENDING ? (
                            <div className="space-x-2">
                                <Button size="sm" onClick={() => handleUpdate(d.id, Status.APPROVED)}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => handleUpdate(d.id, Status.REJECTED)}>Reject</Button>
                            </div>
                        ) : null
                    )}
                ]}
                data={deposits}
            />
        </Card>
    );
};

// Withdrawal Management
const WithdrawalManagement = () => {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchWithdrawals = () => {
        setLoading(true);
        api.getAllWithdrawals().then(data => {
            setWithdrawals(data);
            setLoading(false);
        });
    };

    useEffect(fetchWithdrawals, []);
    
    const handleUpdate = async (id: string, status: Status.APPROVED | Status.REJECTED) => {
        await api.updateWithdrawalStatus(id, status);
        fetchWithdrawals();
    };

    if (loading) return <Spinner />;

    return (
        <Card title="Manage Withdrawals">
            {/* FIX: Explicitly provide the generic type to the Table component */}
            <Table<WithdrawalRequest>
                columns={[
                    { header: 'User ID', accessor: 'userId' },
                    { header: 'Amount', accessor: (w) => `$${w.amount.toFixed(2)}` },
                    { header: 'Method', accessor: 'method' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Date', accessor: (w) => new Date(w.createdAt).toLocaleDateString() },
                    { header: 'Actions', accessor: (w) => (
                        w.status === Status.PENDING ? (
                            <div className="space-x-2">
                                <Button size="sm" onClick={() => handleUpdate(w.id, Status.APPROVED)}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => handleUpdate(w.id, Status.REJECTED)}>Reject</Button>
                            </div>
                        ) : null
                    )}
                ]}
                data={withdrawals}
            />
        </Card>
    );
};

// Reports Management
const ReportsManagement = () => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'ALL'
    });
    const [loading, setLoading] = useState(false);

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleExport = async (reportType: 'users' | 'transactions' | 'commissions') => {
        setLoading(true);
        try {
            const { startDate, endDate, status } = filters;
            let data: any[] = [];
            let filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;

            switch (reportType) {
                case 'users':
                    data = await api.getAllUsers();
                    // Exclude password and wallet objects for cleaner export
                    data = data.map(({ password, wallet, ...user }) => user);
                    break;
                case 'transactions':
                    data = await api.getAllTransactions();
                    break;
                case 'commissions':
                    data = await api.getAllCommissions();
                    break;
            }

            const filteredData = data.filter(item => {
                const itemDate = new Date(item.createdAt);
                const isAfterStartDate = !startDate || itemDate >= new Date(startDate);
                const isBeforeEndDate = !endDate || itemDate <= new Date(endDate);
                const hasCorrectStatus = status === 'ALL' || !item.status || item.status === status;
                return isAfterStartDate && isBeforeEndDate && hasCorrectStatus;
            });
            
            exportToCsv(filteredData, filename);

        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card title="Generate Reports">
            <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Report Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Start Date" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                    <Input label="End Date" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            <option value="ALL">All</option>
                            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => handleExport('users')} disabled={loading} className="w-full justify-center">
                    {loading ? <Spinner size="sm" /> : 'Export Users CSV'}
                </Button>
                <Button onClick={() => handleExport('transactions')} disabled={loading} className="w-full justify-center">
                    {loading ? <Spinner size="sm" /> : 'Export Transactions CSV'}
                </Button>
                <Button onClick={() => handleExport('commissions')} disabled={loading} className="w-full justify-center">
                    {loading ? <Spinner size="sm" /> : 'Export Commissions CSV'}
                </Button>
            </div>
             <p className="text-sm text-gray-500 mt-4">Note: The status filter applies to Transactions and Commissions reports.</p>
        </Card>
    );
};


// Main Admin Panel
const AdminPanel: FC = () => {
    const tabs = [
        { name: 'Dashboard', content: <p>Admin Dashboard Content</p> },
        { name: 'Users', content: <UserManagement /> },
        { name: 'Plans', content: <PlanManagement /> },
        { name: 'Commissions', content: <CommissionManagement /> },
        { name: 'Deposits', content: <DepositManagement /> },
        { name: 'Withdrawals', content: <WithdrawalManagement /> },
        { name: 'Reports', content: <ReportsManagement /> },
        { name: 'Settings', content: <p>System Settings Content</p> },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">Admin Panel</h1>
            <Tabs tabs={tabs} />
        </div>
    );
};

export default AdminPanel;