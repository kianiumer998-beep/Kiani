import { useState, useEffect, type FC } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Plan } from '../types';
import { Card, Button, Spinner, Modal } from './ui';
import { PlanIcon } from './Icons';

const PlansPage: FC = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmingPlan, setConfirmingPlan] = useState<Plan | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState('');

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const availablePlans = await api.getAvailablePlans();
                setPlans(availablePlans);
            } catch (err: any) {
                setError(err.message || "Failed to load plans.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleBuyClick = (plan: Plan) => {
        setError('');
        setPurchaseSuccess('');
        setConfirmingPlan(plan);
    };

    const handleConfirmPurchase = async () => {
        if (!confirmingPlan || !user) return;

        setIsBuying(true);
        setError('');
        try {
            await api.buyPlan(user.id, confirmingPlan.id);
            setPurchaseSuccess(`Successfully purchased ${confirmingPlan.title}!`);
            setConfirmingPlan(null);
        } catch (err: any) {
            setError(err.message || "Purchase failed.");
        } finally {
            setIsBuying(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">Buy an Earning Plan</h1>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            {purchaseSuccess && <p className="text-green-600 bg-green-100 p-3 rounded-md">{purchaseSuccess}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <Card key={plan.id} className="flex flex-col">
                        <div className="flex items-center text-secondary mb-4">
                            <PlanIcon className="h-8 w-8" />
                            <h3 className="text-2xl font-bold ml-3">{plan.title}</h3>
                        </div>
                        <div className="flex-grow space-y-4">
                            <p className="text-4xl font-bold text-center text-primary">${plan.price.toFixed(2)}</p>
                            <p className="text-center text-gray-500">Duration: {plan.duration} days</p>
                            <div className="text-sm">
                                <h4 className="font-semibold mb-2">Commission Levels:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(plan.commissionStructure).map(([level, percent]) => (
                                        <li key={level}>Level {level}: {percent}%</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <Button className="w-full mt-6" onClick={() => handleBuyClick(plan)}>Buy Now</Button>
                    </Card>
                ))}
            </div>

            {confirmingPlan && (
                <Modal
                    isOpen={!!confirmingPlan}
                    onClose={() => setConfirmingPlan(null)}
                    title="Confirm Purchase"
                >
                    <p>Are you sure you want to purchase the <strong>{confirmingPlan.title}</strong> for <strong>${confirmingPlan.price.toFixed(2)}</strong>?</p>
                    <p className="text-sm text-gray-500 mt-2">This amount will be deducted from your available wallet balance.</p>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    <div className="flex justify-end space-x-4 mt-6">
                        <Button variant="ghost" onClick={() => setConfirmingPlan(null)}>Cancel</Button>
                        <Button onClick={handleConfirmPurchase} disabled={isBuying}>
                            {isBuying ? <Spinner size="sm" /> : 'Confirm'}
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PlansPage;