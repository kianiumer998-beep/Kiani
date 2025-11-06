import { Role, Status, User, Plan, Commission, Transaction, DepositRequest, WithdrawalRequest, TransactionType, GenealogyNode, UserPlan } from '../types';

// In-memory database
let users: User[] = [];
let plans: Plan[] = [];
let userPlans: UserPlan[] = [];
let commissions: Commission[] = [];
let transactions: Transaction[] = [];
let depositRequests: DepositRequest[] = [];
let withdrawalRequests: WithdrawalRequest[] = [];

const createInitialData = () => {
  // Admin user
  const adminId = 'user-admin-001';
  const admin: User = {
    id: adminId,
    fullName: 'Admin User',
    username: 'admin',
    email: 'admin@smartearning.com',
    password: 'password123',
    mobile: '1234567890',
    referralCode: 'ADMINREF',
    role: Role.ADMIN,
    status: Status.ACTIVE,
    createdAt: new Date().toISOString(),
    wallet: { userId: adminId, available: 100000, pending: 0, held: 0 },
  };
  users.push(admin);

  // Sponsor user
  const sponsorId = 'user-sponsor-002';
  const sponsor: User = {
    id: sponsorId,
    fullName: 'Sponsor One',
    username: 'sponsor1',
    email: 'sponsor1@smartearning.com',
    password: 'password123',
    mobile: '1234567891',
    referralCode: 'SPONSOR1',
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date().toISOString(),
    wallet: { userId: sponsorId, available: 1000, pending: 0, held: 0 },
  };
  users.push(sponsor);

  // Regular user referred by sponsor
  const userId = 'user-regular-003';
  const user: User = {
    id: userId,
    fullName: 'Regular User',
    username: 'user1',
    email: 'user1@smartearning.com',
    password: 'password123',
    mobile: '1234567892',
    referralCode: 'USER1',
    sponsorId: sponsorId,
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date().toISOString(),
    wallet: { userId: userId, available: 50, pending: 100, held: 20 },
  };
  users.push(user);
    
  // Another user referred by user1
  const user2Id = 'user-regular-004';
  const user2: User = {
    id: user2Id,
    fullName: 'Second User',
    username: 'user2',
    email: 'user2@smartearning.com',
    password: 'password123',
    mobile: '1234567893',
    referralCode: 'USER2',
    sponsorId: userId,
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date().toISOString(),
    wallet: { userId: user2Id, available: 10, pending: 0, held: 0 },
  };
  users.push(user2);

  // Plans
  plans = [
    { id: 'plan-1', title: 'Bronze Plan', price: 100, duration: 30, commissionStructure: { '1': 10, '2': 5 }, status: Status.ACTIVE },
    { id: 'plan-2', title: 'Silver Plan', price: 500, duration: 90, commissionStructure: { '1': 15, '2': 7, '3': 3 }, status: Status.ACTIVE },
    { id: 'plan-3', title: 'Gold Plan', price: 1000, duration: 180, commissionStructure: { '1': 20, '2': 10, '3': 5, '4': 2 }, status: Status.ACTIVE },
  ];

  // Initial Data
  depositRequests.push({id: 'dep-1', userId, amount: 100, method: 'Bank Transfer', status: Status.PENDING, createdAt: new Date().toISOString(), referenceId: 'TXN123' });
  withdrawalRequests.push({id: 'wd-1', userId, amount: 25, method: 'PayPal', accountDetails: { email: 'user1@test.com' }, status: Status.PENDING, createdAt: new Date().toISOString()});
  commissions.push({ id: 'com-1', userId: sponsorId, fromUserId: userId, level: 1, amount: 10, planId: 'plan-1', status: Status.HELD, createdAt: new Date().toISOString() });
  transactions.push({ id: 'txn-1', userId, type: TransactionType.DEPOSIT, amount: 100, status: Status.PENDING, description: 'Bank deposit', createdAt: new Date().toISOString() });
  // Add more transactions for reporting
  transactions.push({ id: 'txn-2', userId: sponsorId, type: TransactionType.COMMISSION, amount: 10, status: Status.HELD, description: 'Commission from user1', createdAt: new Date().toISOString() });
  transactions.push({ id: 'txn-3', userId: user2Id, type: TransactionType.DEPOSIT, amount: 50, status: Status.APPROVED, description: 'Initial deposit', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }); // 2 days ago
  transactions.push({ id: 'txn-4', userId: sponsorId, type: TransactionType.WITHDRAWAL, amount: -200, status: Status.APPROVED, description: 'PayPal withdrawal', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }); // 5 days ago
};

createInitialData();

// Helper for simulating API calls
const simulateApiCall = <T,>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));
};

const findUser = (usernameOrEmail: string) => users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);

// API Functions
export const api = {
  login: async (usernameOrEmail: string, password_param: string) => {
    const user = findUser(usernameOrEmail);
    if (user && user.password === password_param) {
      return simulateApiCall({ user, token: `fake-jwt-token-for-${user.id}` });
    }
    throw new Error('Invalid credentials');
  },

  register: async (data: Omit<User, 'id' | 'referralCode' | 'role' | 'status' | 'createdAt' | 'wallet'> & { referralCode?: string }) => {
    if (findUser(data.username) || findUser(data.email)) {
      throw new Error('Username or email already exists');
    }
    const sponsor = users.find(u => u.referralCode === data.referralCode);
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...data,
      id: newId,
      referralCode: `REF${Date.now()}`,
      role: Role.USER,
      status: Status.ACTIVE,
      createdAt: new Date().toISOString(),
      sponsorId: sponsor?.id,
      wallet: { userId: newId, available: 0, pending: 0, held: 0 },
    };
    users.push(newUser);
    return simulateApiCall({ user: newUser, token: `fake-jwt-token-for-${newUser.id}` });
  },

  getUserData: async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    
    const userWallet = user.wallet;
    const userPlansData = userPlans.filter(up => up.userId === userId);
    const userCommissions = commissions.filter(c => c.userId === userId);
    const userTransactions = transactions.filter(t => t.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return simulateApiCall({
      user,
      wallet: userWallet,
      plans: userPlansData.map(up => ({ ...up, ...plans.find(p => p.id === up.planId) })),
      commissions: userCommissions,
      transactions: userTransactions,
    });
  },

  getAvailablePlans: async () => simulateApiCall(plans.filter(p => p.status === Status.ACTIVE)),
  
  buyPlan: async (userId: string, planId: string) => {
    const user = users.find(u => u.id === userId);
    const plan = plans.find(p => p.id === planId);
    if (!user || !plan) throw new Error("User or Plan not found");

    if (user.wallet.available < plan.price) throw new Error("Insufficient balance");
    
    // Deduct from wallet
    user.wallet.available -= plan.price;
    transactions.push({ id: `txn-${Date.now()}`, userId, type: TransactionType.PLAN_PURCHASE, amount: -plan.price, status: Status.APPROVED, description: `Purchased ${plan.title}`, createdAt: new Date().toISOString() });
    
    // Add plan to user
    userPlans.push({id: `up-${Date.now()}`, userId, planId, purchasedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString()});

    // Generate commissions
    let currentSponsorId = user.sponsorId;
    let level = 1;
    while(currentSponsorId && plan.commissionStructure[level]){
      const sponsor = users.find(u => u.id === currentSponsorId);
      if(!sponsor) break;
      
      const commissionAmount = (plan.price * plan.commissionStructure[level]) / 100;
      sponsor.wallet.held += commissionAmount;
      const newCommission: Commission = { id: `com-${Date.now()}`, userId: sponsor.id, fromUserId: userId, level, amount: commissionAmount, planId, status: Status.HELD, createdAt: new Date().toISOString() };
      commissions.push(newCommission);
      transactions.push({ id: `txn-${Date.now()}`, userId: sponsor.id, type: TransactionType.COMMISSION, amount: commissionAmount, status: Status.HELD, description: `Level ${level} commission from ${user.username}`, createdAt: new Date().toISOString() });
      
      currentSponsorId = sponsor.sponsorId;
      level++;
    }
    
    return simulateApiCall({ success: true, message: 'Plan purchased successfully' });
  },
  
  getGenealogy: async(userId: string) => {
    const buildTree = (currentUserId: string, level: number): GenealogyNode => {
      const user = users.find(u => u.id === currentUserId)!;
      const referrals = users.filter(u => u.sponsorId === currentUserId);
      return {
        user: { id: user.id, username: user.username, fullName: user.fullName, createdAt: user.createdAt },
        level,
        children: referrals.map(ref => buildTree(ref.id, level + 1)),
      };
    };
    return simulateApiCall(buildTree(userId, 0));
  },
  
  deposit: async(userId: string, amount: number, method: string, referenceId?: string) => {
    const newDeposit: DepositRequest = { id: `dep-${Date.now()}`, userId, amount, method, referenceId, status: Status.PENDING, createdAt: new Date().toISOString() };
    depositRequests.push(newDeposit);
    transactions.push({ id: `txn-${Date.now()}`, userId, type: TransactionType.DEPOSIT, amount, status: Status.PENDING, description: `Deposit via ${method}`, createdAt: new Date().toISOString() });
    const user = users.find(u => u.id === userId);
    if(user) user.wallet.pending += amount;
    return simulateApiCall({ success: true });
  },

  withdraw: async(userId: string, amount: number, method: string, accountDetails: object) => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.wallet.available < amount) throw new Error("Insufficient balance");
    
    user.wallet.available -= amount;
    user.wallet.pending += amount;
    
    const newWithdrawal: WithdrawalRequest = { id: `wd-${Date.now()}`, userId, amount, method, accountDetails: accountDetails as {[key: string]: string}, status: Status.PENDING, createdAt: new Date().toISOString() };
    withdrawalRequests.push(newWithdrawal);
    transactions.push({ id: `txn-${Date.now()}`, userId, type: TransactionType.WITHDRAWAL, amount: -amount, status: Status.PENDING, description: `Withdrawal to ${method}`, createdAt: new Date().toISOString() });
    
    return simulateApiCall({ success: true });
  },

  updateProfile: async (userId: string, data: Partial<Pick<User, 'fullName' | 'mobile' | 'whatsApp'>>) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex] = { ...users[userIndex], ...data };
    return simulateApiCall(users[userIndex]);
  },

  changePassword: async (userId: string, oldPassword: string, newPassword: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.password !== oldPassword) throw new Error("Incorrect old password");
    user.password = newPassword;
    return simulateApiCall({ success: true });
  },

  // Admin APIs
  getAdminDashboard: async () => {
    return simulateApiCall({
      totalUsers: users.length,
      totalDeposits: depositRequests.filter(d => d.status === Status.APPROVED).reduce((sum, d) => sum + d.amount, 0),
      totalCommissions: commissions.filter(c => c.status === Status.PAID).reduce((sum, c) => sum + c.amount, 0),
      pendingWithdrawals: withdrawalRequests.filter(w => w.status === Status.PENDING).length,
    });
  },
  
  getAllUsers: async () => simulateApiCall(users),
  getAllPlans: async () => simulateApiCall(plans),
  getAllCommissions: async () => simulateApiCall(commissions),
  getAllDeposits: async () => simulateApiCall(depositRequests),
  getAllWithdrawals: async () => simulateApiCall(withdrawalRequests),
  getAllTransactions: async () => simulateApiCall(transactions),

  updateDepositStatus: async(depositId: string, status: Status.APPROVED | Status.REJECTED) => {
      const deposit = depositRequests.find(d => d.id === depositId);
      if(!deposit) throw new Error("Deposit not found");
      const user = users.find(u => u.id === deposit.userId);
      if(!user) throw new Error("User not found");

      deposit.status = status;
      user.wallet.pending -= deposit.amount;

      const transaction = transactions.find(t => t.type === TransactionType.DEPOSIT && t.userId === deposit.userId && t.amount === deposit.amount && t.status === Status.PENDING);
      if(transaction) transaction.status = status;

      if(status === Status.APPROVED) {
        user.wallet.available += deposit.amount;
      }
      return simulateApiCall({ success: true });
  },

  updateWithdrawalStatus: async(withdrawalId: string, status: Status.APPROVED | Status.REJECTED) => {
    const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
    if(!withdrawal) throw new Error("Withdrawal not found");
    const user = users.find(u => u.id === withdrawal.userId);
    if(!user) throw new Error("User not found");

    withdrawal.status = status;
    user.wallet.pending -= withdrawal.amount;
    
    const transaction = transactions.find(t => t.type === TransactionType.WITHDRAWAL && t.userId === withdrawal.userId && t.amount === -withdrawal.amount && t.status === Status.PENDING);
    if(transaction) transaction.status = status;

    if(status === Status.REJECTED) {
      user.wallet.available += withdrawal.amount;
    }
    return simulateApiCall({ success: true });
  },

  updateCommissionStatus: async(commissionId: string, status: Status.APPROVED | Status.REJECTED) => {
    const commission = commissions.find(c => c.id === commissionId);
    if (!commission) throw new Error("Commission not found");
    const user = users.find(u => u.id === commission.userId);
    if (!user) throw new Error("User not found");

    if (commission.status === Status.HELD) {
        commission.status = status;
        user.wallet.held -= commission.amount;
        if(status === Status.APPROVED) {
            user.wallet.available += commission.amount;
            const transaction = transactions.find(t => t.type === TransactionType.COMMISSION && t.userId === commission.userId && t.amount === commission.amount && t.status === Status.HELD);
            if(transaction) transaction.status = Status.APPROVED;
        }
    }
    return simulateApiCall({ success: true });
  },
  
  createPlan: async(planData: Omit<Plan, 'id'>) => {
    const newPlan: Plan = { ...planData, id: `plan-${Date.now()}`};
    plans.push(newPlan);
    return simulateApiCall(newPlan);
  },

  updatePlan: async(planId: string, planData: Partial<Plan>) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    if(planIndex === -1) throw new Error("Plan not found");
    plans[planIndex] = { ...plans[planIndex], ...planData };
    return simulateApiCall(plans[planIndex]);
  },
};