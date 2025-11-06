import { useState, useEffect, type FC, type ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Transaction, TransactionType } from '../types';
import { Card, Spinner, Table } from './ui';

const TransactionsPage: FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<TransactionType | 'ALL'>('ALL');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (user) {
                try {
                    const data = await api.getUserData(user.id);
                    setTransactions(data.transactions);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch transactions.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchTransactions();
    }, [user]);

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    const filteredTransactions = transactions.filter(t => filter === 'ALL' || t.type === filter);

    // FIX: Add explicit type annotation to 'columns' to match Table component props.
    const columns: { header: string; accessor: keyof Transaction | ((item: Transaction) => ReactNode) }[] = [
        { header: 'Date', accessor: (t: Transaction) => new Date(t.createdAt).toLocaleString() },
        { header: 'Type', accessor: 'type' },
        { header: 'Amount', accessor: (t: Transaction) => <span className={`${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toFixed(2)}</span> },
        { header: 'Status', accessor: 'status' },
        { header: 'Description', accessor: 'description' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">My Transactions</h1>
            <Card>
                <div className="mb-4">
                    <label htmlFor="filter" className="mr-2 font-semibold">Filter by type:</label>
                    <select
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as TransactionType | 'ALL')}
                        className="p-2 border rounded-md"
                    >
                        <option value="ALL">All</option>
                        {Object.values(TransactionType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {filteredTransactions.length > 0 ? (
                    <Table<Transaction> columns={columns} data={filteredTransactions} />
                ) : (
                    <p className="text-center text-gray-500 py-8">No transactions found for the selected filter.</p>
                )}
            </Card>
        </div>
    );
};

export default TransactionsPage;