import { useState, useEffect, type FC, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';
import { User, Wallet, UserPlan, Commission, Transaction, Plan } from '../types';
import { Card, Button, Spinner, Table, Modal, Input } from './ui';

type DashboardData = {
  user: User;
  wallet: Wallet;
  plans: (UserPlan & Plan)[];
  commissions: Commission[];
  transactions: Transaction[];
};

// Wallet Summary Card
const WalletSummary: FC<{ wallet: Wallet, onDeposit: () => void, onWithdraw: () => void }> = ({ wallet, onDeposit, onWithdraw }) => (
    <Card title="Wallet Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">${wallet.available.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600">${wallet.pending.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Held Balance</p>
                <p className="text-2xl font-bold text-red-600">${wallet.held.toFixed(2)}</p>
            </div>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
            <Button onClick={onDeposit}>Deposit Funds</Button>
            <Button onClick={onWithdraw} variant="secondary">Withdraw Funds</Button>
        </div>
    </Card>
);

// Commission Summary Card
const CommissionSummary: FC<{ commissions: Commission[] }> = ({ commissions }) => {
    const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pending = commissions.filter(c => c.status === 'HELD').reduce((sum, c) => sum + c.amount, 0);
    const paid = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    return (
        <Card title="Commissions">
            <div className="space-y-2">
                <div className="flex justify-between"><span>Total Earned:</span> <span className="font-bold">${totalEarned.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Pending Release:</span> <span className="font-bold">${pending.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Paid Out:</span> <span className="font-bold">${paid.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 text-center">
                <Link to="/dashboard/commissions"><Button variant="ghost" size="sm">View All Commissions</Button></Link>
            </div>
        </Card>
    );
};

// My Plans Card
const MyPlans: FC<{ plans: (UserPlan & Plan)[] }> = ({ plans }) => (
    <Card title="My Active Plans">
        {plans.length > 0 ? (
            <ul className="space-y-3">
                {plans.map(plan => (
                    <li key={plan.id} className="p-3 bg-neutral-light rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{plan.title}</span>
                            <span className="text-sm text-gray-500">Expires: {new Date(plan.expiresAt).toLocaleDateString()}</span>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-gray-500">You have no active plans.</p>
        )}
        <div className="mt-4 text-center">
            <Link to="/dashboard/plans"><Button size="sm">Buy More Plans</Button></Link>
        </div>
    </Card>
);

// Recent Transactions
const RecentTransactions: FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <Card title="Recent Transactions" className="col-span-1 lg:col-span-2">
        <Table<Transaction>
            columns={[
                { header: 'Date', accessor: (t) => new Date(t.createdAt).toLocaleString() },
                { header: 'Type', accessor: 'type' },
                { header: 'Amount', accessor: (t) => <span className={`${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toFixed(2)}</span> },
                { header: 'Status', accessor: 'status' },
                { header: 'Description', accessor: 'description' },
            ]}
            data={transactions.slice(0, 5)}
        />
        <div className="mt-4 text-center">
            <Link to="/dashboard/transactions"><Button variant="ghost" size="sm">View All Transactions</Button></Link>
        </div>
    </Card>
);

// Deposit Modal
const DepositModal: FC<{ isOpen: boolean; onClose: () => void; onDeposit: (amount: number, method: string) => Promise<void> }> = ({ isOpen, onClose, onDeposit }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bank Transfer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setLoading(true);
        try {
            await onDeposit(parseFloat(amount), method);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Deposit failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Deposit Funds">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                        <option>Bank Transfer</option>
                        <option>Crypto</option>
                        <option>PayPal</option>
                    </select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : 'Submit Deposit'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Withdrawal Modal
const WithdrawModal: FC<{ isOpen: boolean; onClose: () => void; onWithdraw: (amount: number, method: string, details: object) => Promise<void>; maxAmount: number }> = ({ isOpen, onClose, onWithdraw, maxAmount }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bank Transfer');
    const [accountDetails, setAccountDetails] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount) {
            setError(`Please enter a valid amount (up to $${maxAmount.toFixed(2)}).`);
            return;
        }
        setLoading(true);
        try {
            await onWithdraw(parseFloat(amount), method, accountDetails);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={`Amount (Max: $${maxAmount.toFixed(2)})`} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                 {/* Simplified details for example */}
                <Input label="Account Details (e.g., PayPal email, Bank Account)" type="text" onChange={(e) => setAccountDetails({ info: e.target.value })} required />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : 'Submit Withdrawal'}</Button>
                </div>
            </form>
        </Modal>
    );
};


const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);

    const fetchData = async () => {
        if (user) {
            try {
                setLoading(true);
                const dashboardData = await api.getUserData(user.id);
                setData(dashboardData as DashboardData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleDeposit = async (amount: number, method: string) => {
        if (!user) return;
        await api.deposit(user.id, amount, method);
        await fetchData(); // Refresh data
    };

    const handleWithdraw = async (amount: number, method: string, details: object) => {
        if (!user) return;
        await api.withdraw(user.id, amount, method, details);
        await fetchData(); // Refresh data
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (!data) return <div className="text-center">No data available.</div>;

    const { wallet, commissions, plans, transactions } = data;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3">
                    <WalletSummary wallet={wallet} onDeposit={() => setDepositOpen(true)} onWithdraw={() => setWithdrawOpen(true)} />
                </div>
                <CommissionSummary commissions={commissions} />
                <MyPlans plans={plans} />
                 <div className="text-center bg-primary-light p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-dark mb-2">Grow Your Network!</h3>
                    <p className="mb-4">Share your referral link to earn commissions:</p>
                    <div className="flex justify-center">
                         <input type="text" readOnly value={`${window.location.origin}/#/auth?ref=${user?.referralCode}`} className="w-full md:w-2/3 p-2 border rounded-l-md bg-white"/>
                         <Button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/auth?ref=${user?.referralCode}`)} className="rounded-l-none">Copy</Button>
                    </div>
                 </div>

                <div className="lg:col-span-3">
                    <RecentTransactions transactions={transactions} />
                </div>
            </div>

            <DepositModal isOpen={isDepositOpen} onClose={() => setDepositOpen(false)} onDeposit={handleDeposit} />
            <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setWithdrawOpen(false)} onWithdraw={handleWithdraw} maxAmount={wallet.available} />
        </div>
    );
};

export default DashboardPage;