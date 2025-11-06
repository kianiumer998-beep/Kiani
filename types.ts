
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  HELD = 'HELD',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  mobile: string;
  whatsApp?: string;
  sponsorId?: string | null;
  referralCode: string;
  role: Role;
  status: Status.ACTIVE | Status.BLOCKED;
  createdAt: string;
  wallet: Wallet;
}

export interface Wallet {
  userId: string;
  available: number;
  pending: number;
  held: number;
}

export interface Plan {
  id: string;
  title: string;
  price: number;
  duration: number; // in days
  commissionStructure: { [key: string]: number }; // e.g., { "level_1": 10, "level_2": 5 }
  status: Status.ACTIVE | Status.INACTIVE;
}

export interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  purchasedAt: string;
  expiresAt: string;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION = 'COMMISSION',
  PLAN_PURCHASE = 'PLAN_PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  // FIX: Added Status.HELD to allow for commission-related transactions.
  status: Status.PENDING | Status.APPROVED | Status.REJECTED | Status.HELD;
  description: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  userId: string;
  fromUserId: string;
  level: number;
  amount: number;
  planId: string;
  status: Status.HELD | Status.APPROVED | Status.PAID | Status.REJECTED;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  referenceId?: string;
  receiptUrl?: string;
  status: Status.PENDING | Status.APPROVED | Status.REJECTED;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  accountDetails: { [key: string]: string };
  status: Status.PENDING | Status.APPROVED | Status.REJECTED;
  createdAt: string;
}

export interface GenealogyNode {
  user: {
    id: string;
    username: string;
    fullName: string;
    createdAt: string;
  };
  level: number;
  children: GenealogyNode[];
}