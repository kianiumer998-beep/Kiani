import { useState, useEffect, type FC } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { GenealogyNode } from '../types';
import { Card, Spinner, Button } from './ui';

const TreeNode: FC<{ node: GenealogyNode }> = ({ node }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="ml-6 pl-4 border-l-2 border-primary-light">
            <div className="flex items-center">
                {node.children.length > 0 && (
                    <button onClick={() => setIsOpen(!isOpen)} className="mr-2 text-primary">
                        {isOpen ? '[-]' : '[+]'}
                    </button>
                )}
                <div className="flex-1 p-2 bg-white rounded shadow-sm">
                    <p className="font-semibold">{node.user.username} <span className="font-normal text-gray-500">({node.user.fullName})</span></p>
                    <p className="text-sm text-gray-500">Joined: {new Date(node.user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            {isOpen && node.children.length > 0 && (
                <div className="mt-2">
                    {node.children.map(child => (
                        <TreeNode key={child.user.id} node={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ReferralsPage: FC = () => {
    const { user } = useAuth();
    const [genealogy, setGenealogy] = useState<GenealogyNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    const referralLink = `${window.location.origin}/#/auth?ref=${user?.referralCode}`;

    useEffect(() => {
        const fetchGenealogy = async () => {
            if (user) {
                try {
                    const data = await api.getGenealogy(user.id);
                    setGenealogy(data);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch referral tree.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchGenealogy();
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-dark">Referrals & Genealogy</h1>
            
            <Card title="Your Referral Link">
                <p className="mb-4 text-gray-600">Share this link with others. When they sign up and purchase a plan, you'll earn a commission.</p>
                <div className="flex items-center space-x-2">
                    <input type="text" readOnly value={referralLink} className="flex-grow p-2 border rounded-md bg-gray-100" />
                    <Button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</Button>
                </div>
            </Card>

            <Card title="Genealogy Tree">
                {loading && <div className="flex justify-center"><Spinner /></div>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {genealogy && (
                    <div>
                        <div className="p-3 bg-primary-light rounded-lg">
                             <p className="font-bold text-lg text-primary-dark">{genealogy.user.username} (You)</p>
                             <p className="text-sm">Your Downline:</p>
                        </div>
                        <div className="mt-4">
                            {genealogy.children.length > 0 ? (
                                genealogy.children.map(child => <TreeNode key={child.user.id} node={child} />)
                            ) : (
                                <p className="text-center text-gray-500 py-4">You have not referred anyone yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ReferralsPage;