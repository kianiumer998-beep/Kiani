import { useState, useEffect, FC, ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Commission } from '../types';
import { Card, Spinner, Table } from './ui';

const CommissionsPage: FC = () => {
    const { user } = useAuth();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCommissions = async () => {
            if (user) {
                try {
                    const data = await api.getUserData(user.id);
                    // Sort by most recent first
                    const sortedCommissions = data.commissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setCommissions(sortedCommissions);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch commissions.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchCommissions();
    }, [user]);

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    const columns: { header: string; accessor: keyof Commission | ((item: Commission) => ReactNode) }[] = [
        { header: 'Date', accessor: (c: Commission) => new Date(c.createdAt).toLocaleString() },
        { header: 'From User ID', accessor: 'fromUserId' },
        { header: 'Level', accessor: 'level' },
        { header: 'Plan ID', accessor: 'planId' },
        { header: 'Amount', accessor: (c: Commission) => <span className="font-bold text-green-600">${c.amount.toFixed(2)}</span> },
        { header: 'Status', accessor: 'status' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">My Commissions</h1>
            <Card>
                {commissions.length > 0 ? (
                    <Table<Commission> columns={columns} data={commissions} />
                ) : (
                    <p className="text-center text-gray-500">You have not earned any commissions yet.</p>
                )}
            </Card>
        </div>
    );
};

export default CommissionsPage;