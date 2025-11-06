import {
  User,
  Role,
  Status,
  Wallet,
  Plan,
  UserPlan,
  Transaction,
  TransactionType,
  Commission,
  DepositRequest,
  WithdrawalRequest,
  GenealogyNode,
} from '../types';

// --- MOCK DATA STORE ---

const users: User[] = [
  {
    id: 'user_admin',
    fullName: 'Admin User',
    username: 'admin',
    email: 'admin@example.com',
    password: 'password',
    mobile: '1234567890',
    referralCode: 'ADMINREF',
    role: Role.ADMIN,
    status: Status.ACTIVE,
    createdAt: new Date('2023-01-01').toISOString(),
    wallet: { userId: 'user_admin', available: 10000, pending: 0, held: 0 },
  },
  {
    id: 'user_john',
    fullName: 'John Doe',
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password',
    mobile: '1112223333',
    sponsorId: null,
    referralCode: 'JOHN123',
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date('2023-02-15').toISOString(),
    wallet: { userId: 'user_john', available: 500, pending: 50, held: 25 },
  },
  {
    id: 'user_jane',
    fullName: 'Jane Smith',
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'password',
    mobile: '4445556666',
    sponsorId: 'user_john',
    referralCode: 'JANE456',
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date('2023-03-20').toISOString(),
    wallet: { userId: 'user_jane', available: 150, pending: 0, held: 0 },
  },
  {
    id: 'user_mike',
    fullName: 'Mike Johnson',
    username: 'mike_j',
    email: 'mike@example.com',
    password: 'password',
    mobile: '7778889999',
    sponsorId: 'user_jane',
    referralCode: 'MIKE789',
    role: Role.USER,
    status: Status.BLOCKED,
    createdAt: new Date('2023-04-01').toISOString(),
    wallet: { userId: 'user_mike', available: 20, pending: 0, held: 10 },
  },
];

const plans: Plan[] = [
  { id: 'plan_starter', title: 'Starter Plan', price: 50, duration: 30, commissionStructure: { "1": 10, "2": 5 }, status: Status.ACTIVE },
  { id: 'plan_pro', title: 'Pro Plan', price: 150, duration: 60, commissionStructure: { "1": 12, "2": 6, "3": 3 }, status: Status.ACTIVE },
  { id: 'plan_elite', title: 'Elite Plan', price: 300, duration: 90, commissionStructure: { "1": 15, "2": 8, "3": 4, "4": 2 }, status: Status.ACTIVE },
  { id: 'plan_inactive', title: 'Old Plan', price: 25, duration: 15, commissionStructure: { "1": 5 }, status: Status.INACTIVE },
];

let userPlans: UserPlan[] = [
    { id: 'up_1', userId: 'user_john', planId: 'plan_pro', purchasedAt: new Date('2023-05-01').toISOString(), expiresAt: new Date('2023-07-01').toISOString() },
    { id: 'up_2', userId: 'user_jane', planId: 'plan_starter', purchasedAt: new Date('2023-05-10').toISOString(), expiresAt: new Date('2023-06-10').toISOString() }
];

let transactions: Transaction[] = [
    { id: 't_1', userId: 'user_john', type: TransactionType.DEPOSIT, amount: 200, status: Status.APPROVED, description: 'Initial deposit', createdAt: new Date('2023-02-15').toISOString() },
    { id: 't_2', userId: 'user_john', type: TransactionType.PLAN_PURCHASE, amount: -150, status: Status.APPROVED, description: 'Purchased Pro Plan', createdAt: new Date('2023-05-01').toISOString() },
    { id: 't_3', userId: 'user_john', type: TransactionType.COMMISSION, amount: 5, status: Status.APPROVED, description: 'Commission from jane_smith', createdAt: new Date('2023-05-10').toISOString() },
    { id: 't_4', userId: 'user_jane', type: TransactionType.DEPOSIT, amount: 100, status: Status.APPROVED, description: 'Initial deposit', createdAt: new Date('2023-03-20').toISOString() },
    { id: 't_5', userId: 'user_jane', type: TransactionType.PLAN_PURCHASE, amount: -50, status: Status.APPROVED, description: 'Purchased Starter Plan', createdAt: new Date('2023-05-10').toISOString() },
];

let commissions: Commission[] = [
    { id: 'c_1', userId: 'user_john', fromUserId: 'user_jane', level: 1, amount: 5, planId: 'plan_starter', status: Status.PAID, createdAt: new Date('2023-05-10').toISOString() }
];

let depositRequests: DepositRequest[] = [
    { id: 'dr_1', userId: 'user_john', amount: 50, method: 'PayPal', status: Status.PENDING, createdAt: new Date().toISOString() }
];
let withdrawalRequests: WithdrawalRequest[] = [
    { id: 'wr_1', userId: 'user_jane', amount: 20, method: 'Bank Transfer', accountDetails: { info: 'ACC 12345' }, status: Status.PENDING, createdAt: new Date().toISOString() }
];


// --- API SERVICE ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  private users = users;
  private plans = plans;
  private userPlans = userPlans;
  private transactions = transactions;
  private commissions = commissions;
  private depositRequests = depositRequests;
  private withdrawalRequests = withdrawalRequests;

  async login(email: string, password_param: string): Promise<User> {
    await delay(500);
    const user = this.users.find(u => u.email === email);
    if (!user || user.password !== password_param) {
      throw new Error('Invalid credentials');
    }
    if (user.status === Status.BLOCKED) {
        throw new Error('Your account is blocked. Please contact support.');
    }
    return user;
  }

  async register(data: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'wallet' | 'referralCode'>): Promise<User> {
    await delay(700);
    if (this.users.some(u => u.email === data.email || u.username === data.username)) {
      throw new Error('User with this email or username already exists.');
    }
    if (data.sponsorId) {
        const sponsor = this.users.find(u => u.referralCode === data.sponsorId);
        if (!sponsor) throw new Error('Invalid referral code.');
        data.sponsorId = sponsor.id;
    } else {
        data.sponsorId = null;
    }
    const newUser: User = {
      ...data,
      id: `user_${Date.now()}`,
      referralCode: `${data.username.toUpperCase()}${Date.now() % 1000}`,
      role: Role.USER,
      status: Status.ACTIVE,
      createdAt: new Date().toISOString(),
      wallet: { userId: '', available: 0, pending: 0, held: 0 },
    };
    newUser.wallet.userId = newUser.id;
    this.users.push(newUser);
    return newUser;
  }

  async getUserData(userId: string) {
    await delay(300);
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    const userActivePlans = this.userPlans
        .filter(up => up.userId === userId && new Date(up.expiresAt) > new Date())
        .map(up => {
            const planDetails = this.plans.find(p => p.id === up.planId);
            return { ...up, ...planDetails! };
        });

    return {
        user,
        wallet: user.wallet,
        plans: userActivePlans,
        commissions: this.commissions.filter(c => c.userId === userId),
        transactions: this.transactions.filter(t => t.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }
  }

  async getAvailablePlans(): Promise<Plan[]> {
    await delay(300);
    return this.plans.filter(p => p.status === Status.ACTIVE);
  }

  async buyPlan(userId: string, planId: string): Promise<void> {
    await delay(1000);
    const user = this.users.find(u => u.id === userId);
    const plan = this.plans.find(p => p.id === planId);
    if (!user || !plan) throw new Error('User or Plan not found.');
    if (user.wallet.available < plan.price) throw new Error('Insufficient funds.');

    user.wallet.available -= plan.price;
    this.userPlans.push({
        id: `up_${Date.now()}`,
        userId,
        planId,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString(),
    });
    this.transactions.push({
        id: `t_${Date.now()}`,
        userId,
        type: TransactionType.PLAN_PURCHASE,
        amount: -plan.price,
        status: Status.APPROVED,
        description: `Purchased ${plan.title}`,
        createdAt: new Date().toISOString(),
    });

    // Commission logic
    let currentUser = user;
    for (let level = 1; level <= Object.keys(plan.commissionStructure).length; level++) {
        const sponsorId = currentUser?.sponsorId;
        if (!sponsorId) break;
        
        const sponsor = this.users.find(u => u.id === sponsorId);
        if (!sponsor) break;

        const commissionPercent = plan.commissionStructure[level];
        if (commissionPercent) {
            const commissionAmount = plan.price * (commissionPercent / 100);
            sponsor.wallet.available += commissionAmount; // Simplified: directly to available
            const commissionRecord: Commission = {
                id: `c_${Date.now()}_${level}`,
                userId: sponsor.id,
                fromUserId: user.id,
                level,
                amount: commissionAmount,
                planId: plan.id,
                status: Status.PAID,
                createdAt: new Date().toISOString(),
            };
            this.commissions.push(commissionRecord);
            this.transactions.push({
                id: `t_${Date.now()}_${level}`,
                userId: sponsor.id,
                type: TransactionType.COMMISSION,
                amount: commissionAmount,
                status: Status.APPROVED,
                description: `Level ${level} commission from ${user.username}`,
                createdAt: new Date().toISOString(),
            });
        }
        currentUser = sponsor;
    }
  }

  async getGenealogy(userId: string): Promise<GenealogyNode> {
    await delay(800);
    const rootUser = this.users.find(u => u.id === userId);
    if (!rootUser) throw new Error("User not found");

    const buildTree = (user: User, level: number): GenealogyNode => {
      const childrenUsers = this.users.filter(u => u.sponsorId === user.id);
      return {
        user: { id: user.id, username: user.username, fullName: user.fullName, createdAt: user.createdAt },
        level,
        children: childrenUsers.map(child => buildTree(child, level + 1))
      };
    };
    return buildTree(rootUser, 0);
  }

  async updateProfile(userId: string, data: { fullName: string; mobile: string; whatsApp?: string }): Promise<User> {
    await delay(600);
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }

  async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    await delay(600);
    const user = this.users.find(u => u.id === userId);
    if (!user || user.password !== oldPass) throw new Error('Incorrect old password');
    user.password = newPass;
  }

  async deposit(userId: string, amount: number, method: string): Promise<void> {
      await delay(500);
      const user = this.users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      this.depositRequests.push({
        id: `dr_${Date.now()}`,
        userId,
        amount,
        method,
        status: Status.PENDING,
        createdAt: new Date().toISOString(),
      });
  }

  async withdraw(userId: string, amount: number, method: string, accountDetails: object): Promise<void> {
    await delay(500);
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.wallet.available < amount) throw new Error("Insufficient funds for withdrawal.");
    
    user.wallet.available -= amount;
    user.wallet.pending += amount;
    
    this.withdrawalRequests.push({
        id: `wr_${Date.now()}`,
        userId,
        amount,
        method,
        accountDetails: accountDetails as {[key: string]: string},
        status: Status.PENDING,
        createdAt: new Date().toISOString()
    })
  }

  // --- ADMIN METHODS ---
  async getAllUsers(): Promise<User[]> {
      await delay(200);
      return this.users;
  }
  async getAllPlans(): Promise<Plan[]> {
      await delay(200);
      return this.plans;
  }
  async getAllDepositRequests(): Promise<DepositRequest[]> {
      await delay(200);
      return this.depositRequests;
  }
  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
      await delay(200);
      return this.withdrawalRequests;
  }

  async updateUserStatus(userId: string, status: Status.ACTIVE | Status.BLOCKED): Promise<User> {
      await delay(400);
      const user = this.users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      user.status = status;
      return user;
  }
  
  async updatePlan(planId: string, data: Partial<Plan>): Promise<Plan> {
      await delay(400);
      const plan = this.plans.find(p => p.id === planId);
      if (!plan) throw new Error("Plan not found");
      Object.assign(plan, data);
      return plan;
  }

  async approveRequest(type: 'deposit' | 'withdrawal', reqId: string): Promise<void> {
      await delay(400);
      if (type === 'deposit') {
          const req = this.depositRequests.find(r => r.id === reqId);
          if (!req || req.status !== Status.PENDING) throw new Error("Request not found or already processed.");
          const user = this.users.find(u => u.id === req.userId);
          if(user) {
              user.wallet.available += req.amount;
              this.transactions.push({
                  id: `t_${Date.now()}`,
                  userId: user.id,
                  type: TransactionType.DEPOSIT,
                  amount: req.amount,
                  status: Status.APPROVED,
                  description: `Deposit via ${req.method}`,
                  createdAt: new Date().toISOString(),
              })
          }
          req.status = Status.APPROVED;
      } else {
          const req = this.withdrawalRequests.find(r => r.id === reqId);
          if (!req || req.status !== Status.PENDING) throw new Error("Request not found or already processed.");
          const user = this.users.find(u => u.id === req.userId);
           if(user) {
              user.wallet.pending -= req.amount;
               this.transactions.push({
                  id: `t_${Date.now()}`,
                  userId: user.id,
                  type: TransactionType.WITHDRAWAL,
                  amount: -req.amount,
                  status: Status.APPROVED,
                  description: `Withdrawal via ${req.method}`,
                  createdAt: new Date().toISOString(),
              })
          }
          req.status = Status.APPROVED;
      }
  }
  
   async rejectRequest(type: 'deposit' | 'withdrawal', reqId: string): Promise<void> {
      await delay(400);
      if (type === 'deposit') {
          const req = this.depositRequests.find(r => r.id === reqId);
          if (!req || req.status !== Status.PENDING) throw new Error("Request not found or already processed.");
          req.status = Status.REJECTED;
      } else {
          const req = this.withdrawalRequests.find(r => r.id === reqId);
          if (!req || req.status !== Status.PENDING) throw new Error("Request not found or already processed.");
          const user = this.users.find(u => u.id === req.userId);
           if(user) {
              user.wallet.pending -= req.amount;
              user.wallet.available += req.amount; // Refund
          }
          req.status = Status.REJECTED;
      }
  }
}

export const api = new ApiService();
