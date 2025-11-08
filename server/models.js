
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  whatsApp: String,
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCode: { type: String, required: true, unique: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  wallet: {
    available: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    held: { type: Number, default: 0 }
  }
}, { timestamps: true });

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // in days
  commissionStructure: { type: Map, of: Number }, // e.g., { "1": 10, "2": 5 }
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
});

const userPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: { createdAt: 'purchasedAt', updatedAt: false } });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'PLAN_PURCHASE', 'ADJUSTMENT'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'HELD'], default: 'PENDING' },
  description: String
}, { timestamps: true });

const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Beneficiary
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Source of commission
  level: { type: Number, required: true },
  amount: { type: Number, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  status: { type: String, enum: ['HELD', 'APPROVED', 'PAID', 'REJECTED'], default: 'HELD' }
}, { timestamps: true });

const depositRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  referenceId: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

const withdrawalRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  accountDetails: { type: Map, of: String },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Plan: mongoose.model('Plan', planSchema),
  UserPlan: mongoose.model('UserPlan', userPlanSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Commission: mongoose.model('Commission', commissionSchema),
  DepositRequest: mongoose.model('DepositRequest', depositRequestSchema),
  WithdrawalRequest: mongoose.model('WithdrawalRequest', withdrawalRequestSchema)
};
