import { useState, useEffect, FC, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import { User, Plan, DepositRequest, WithdrawalRequest, Status } from '../types';
import { Card, Spinner, Table, Tabs, Button, Modal, Input } from './ui';
import { exportToCsv } from '../utils/export';


// --- SUB-COMPONENTS FOR TABS ---

const UserManagement: FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusToggle = async (userId: string, currentStatus: Status.ACTIVE | Status.BLOCKED) => {
        const newStatus = currentStatus === Status.ACTIVE ? Status.BLOCKED : Status.ACTIVE;
        try {
            await api.updateUserStatus(userId, newStatus);
            await fetchUsers();
        } catch (err) {
            alert('Failed to update user status.');
        }
    };
    
    if (loading) return <Spinner />;
    if (error) return <p className="text-red-500">{error}</p>;

    const columns: { header: string; accessor: keyof User | ((item: User) => ReactNode) }[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Full Name', accessor: 'fullName' },
        { header: 'Email', accessor: 'email' },
        { header: 'Status', accessor: 'status' },
        { header: 'Joined', accessor: (u) => new Date(u.createdAt).toLocaleDateString() },
        { header: 'Actions', accessor: (u) => (
            <Button
                size="sm"
                variant={u.status === Status.ACTIVE ? 'danger' : 'primary'}
                onClick={() => handleStatusToggle(u.id, u.status)}
            >
                {u.status === Status.ACTIVE ? 'Block' : 'Unblock'}
            </Button>
        )},
    ];

    return (
        <div>
            <Button className="mb-4" onClick={() => exportToCsv(users, 'users.csv')}>Export Users</Button>
            <Table<User> columns={columns} data={users} />
        </div>
    );
};


const PlanManagement: FC = () => {
    // Similar structure to UserManagement...
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const fetchData = async () => {
          setLoading(true);
          const data = await api.getAllPlans();
          setPlans(data);
          setLoading(false);
      };
      fetchData();
    }, []);

    if (loading) return <Spinner />;

    const columns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Title', accessor: 'title' },
        { header: 'Price', accessor: (p: Plan) => `$${p.price.toFixed(2)}` },
        { header: 'Duration (Days)', accessor: 'duration' },
        { header: 'Status', accessor: 'status' },
        // Add actions column later if needed
    ];

    return (
        <div>
            <Button className="mb-4" onClick={() => exportToCsv(plans, 'plans.csv')}>Export Plans</Button>
            <Table<Plan> columns={columns} data={plans} />
        </div>
    )
};


const RequestManagement: FC<{ type: 'deposit' | 'withdrawal' }> = ({ type }) => {
    const [requests, setRequests] = useState<(DepositRequest | WithdrawalRequest)[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const data = type === 'deposit' 
            ? await api.getAllDepositRequests()
            : await api.getAllWithdrawalRequests();
        setRequests(data);
        setLoading(false);
    }, [type]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (action: 'approve' | 'reject', reqId: string) => {
        try {
            if (action === 'approve') {
                await api.approveRequest(type, reqId);
            } else {
                await api.rejectRequest(type, reqId);
            }
            await fetchRequests();
        } catch (err) {
            alert(`Failed to ${action} request.`);
        }
    };

    if (loading) return <Spinner />;

    const columns = [
        { header: 'ID', accessor: 'id' },
        { header: 'User ID', accessor: 'userId' },
        { header: 'Amount', accessor: (r: any) => `$${r.amount.toFixed(2)}` },
        { header: 'Method', accessor: 'method' },
        { header: 'Status', accessor: 'status' },
        { header: 'Date', accessor: (r: any) => new Date(r.createdAt).toLocaleString() },
        { header: 'Actions', accessor: (r: any) => r.status === Status.PENDING ? (
            <div className="space-x-2">
                <Button size="sm" variant="primary" onClick={() => handleAction('approve', r.id)}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => handleAction('reject', r.id)}>Reject</Button>
            </div>
        ) : null },
    ];

    return (
         <div>
            <Button className="mb-4" onClick={() => exportToCsv(requests, `${type}-requests.csv`)}>Export {type}s</Button>
            <Table columns={columns} data={requests} />
        </div>
    );
};


// --- MAIN ADMIN PANEL COMPONENT ---

const AdminPanel: FC = () => {

    const tabs = [
        { name: 'User Management', content: <UserManagement /> },
        { name: 'Plan Management', content: <PlanManagement /> },
        { name: 'Deposit Requests', content: <RequestManagement type="deposit" /> },
        { name: 'Withdrawal Requests', content: <RequestManagement type="withdrawal" /> },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">Admin Panel</h1>
            <Card>
                <Tabs tabs={tabs} />
            </Card>
        </div>
    );
};

export default AdminPanel;
