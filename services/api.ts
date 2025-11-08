
import {
  User,
  Plan,
  DepositRequest,
  WithdrawalRequest,
  GenealogyNode,
  Status,
} from '../types';

const BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private getHeaders() {
      const token = sessionStorage.getItem('token');
      return {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers: { ...this.getHeaders(), ...options.headers },
      });
      const data = await res.json();
      if (!res.ok) {
          throw new Error(data.message || data.error || 'API request failed');
      }
      return data;
  }

  async login(email: string, password_param: string): Promise<User> {
    const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: password_param })
    });
    sessionStorage.setItem('token', data.token);
    return data.user;
  }

  async register(data: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'wallet' | 'referralCode'>): Promise<User> {
    const resData = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    sessionStorage.setItem('token', resData.token);
    return resData.user;
  }

  async getUserData(userId: string) {
      // userId param is ignored as the token determines "me", kept for signature compatibility if needed
      return this.request('/users/me/dashboard');
  }

  async getAvailablePlans(): Promise<Plan[]> {
      return this.request('/plans');
  }

  async buyPlan(userId: string, planId: string): Promise<void> {
      await this.request('/plans/buy', {
          method: 'POST',
          body: JSON.stringify({ planId })
      });
  }

  async getGenealogy(userId: string): Promise<GenealogyNode> {
      return this.request('/users/genealogy');
  }

  async updateProfile(userId: string, data: { fullName: string; mobile: string; whatsApp?: string }): Promise<User> {
      return this.request('/users/me', {
          method: 'PUT',
          body: JSON.stringify(data)
      });
  }

  async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
       await this.request('/users/me/password', {
          method: 'PUT',
          body: JSON.stringify({ oldPass, newPass })
      });
  }

  async deposit(userId: string, amount: number, method: string): Promise<void> {
      await this.request('/deposit', {
          method: 'POST',
          body: JSON.stringify({ amount, method })
      });
  }

  async withdraw(userId: string, amount: number, method: string, accountDetails: object): Promise<void> {
      await this.request('/withdraw', {
          method: 'POST',
          body: JSON.stringify({ amount, method, accountDetails })
      });
  }

  // --- ADMIN METHODS ---
  async getAllUsers(): Promise<User[]> {
      return this.request('/admin/users');
  }
  async getAllPlans(): Promise<Plan[]> {
      return this.request('/admin/plans');
  }
  async getAllDepositRequests(): Promise<DepositRequest[]> {
      return this.request('/admin/deposits');
  }
  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
      return this.request('/admin/withdrawals');
  }

  async updateUserStatus(userId: string, status: Status.ACTIVE | Status.BLOCKED): Promise<User> {
      return this.request(`/admin/users/${userId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status })
      });
  }
  
  async updatePlan(planId: string, data: Partial<Plan>): Promise<Plan> {
      // Not implemented on backend yet based on prompt brevity, but signature kept.
       throw new Error("Update plan not implemented on server.");
  }

  async approveRequest(type: 'deposit' | 'withdrawal', reqId: string): Promise<void> {
       await this.request(`/admin/requests/${type}/${reqId}/approve`, { method: 'POST' });
  }
  
   async rejectRequest(type: 'deposit' | 'withdrawal', reqId: string): Promise<void> {
       await this.request(`/admin/requests/${type}/${reqId}/reject`, { method: 'POST' });
  }
}

export const api = new ApiService();
