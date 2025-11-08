
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Plan, UserPlan, Transaction, Commission, DepositRequest, WithdrawalRequest } = require('./models');

const router = express.Router();

// --- Middleware ---
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, status: 'ACTIVE' });
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).send({ error: 'Access denied.' });
    }
};

// --- Helpers ---
const formatUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    whatsApp: user.whatsApp,
    referralCode: user.referralCode,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    wallet: { userId: user._id, ...user.wallet }
});

// --- Auth Routes ---
router.post('/auth/register', async (req, res) => {
  try {
    const { password, sponsorId: referralCode, ...userData } = req.body;
    
    let sponsor = null;
    if (referralCode) {
        sponsor = await User.findOne({ referralCode });
        if (!sponsor) return res.status(400).send({ message: 'Invalid referral code' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({
        ...userData,
        password: hashedPassword,
        sponsorId: sponsor ? sponsor._id : null,
        referralCode: `${userData.username.toUpperCase()}${Date.now().toString().slice(-4)}`
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);
    res.status(201).send({ user: formatUser(user), token });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new Error('Invalid login credentials');
    
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) throw new Error('Invalid login credentials');
    
    if (user.status === 'BLOCKED') throw new Error('Account is blocked');

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);
    res.send({ user: formatUser(user), token });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

// --- User Data Routes ---
router.get('/users/me/dashboard', auth, async (req, res) => {
    try {
        const user = req.user;
        const activePlans = await UserPlan.find({ 
            userId: user._id, 
            expiresAt: { $gt: new Date() } 
        }).populate('planId');
        
        const formattedPlans = activePlans.map(up => ({
            id: up._id,
            userId: up.userId,
            planId: up.planId._id,
            purchasedAt: up.purchasedAt,
            expiresAt: up.expiresAt,
            ...up.planId.toObject({virtuals: true}),
             id: up.planId._id // Ensure Plan ID is accessible
        }));

        const commissions = await Commission.find({ userId: user._id });
        const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });

        res.send({
            user: formatUser(user),
            wallet: { userId: user._id, ...user.wallet },
            plans: formattedPlans,
            commissions,
            transactions
        });
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});

router.get('/users/genealogy', auth, async (req, res) => {
    try {
        const buildTree = async (rootUser, level) => {
             const children = await User.find({ sponsorId: rootUser._id }).select('username fullName createdAt');
             const childrenNodes = await Promise.all(children.map(child => buildTree(child, level + 1)));
             return {
                 user: { id: rootUser._id, username: rootUser.username, fullName: rootUser.fullName, createdAt: rootUser.createdAt },
                 level,
                 children: childrenNodes
             };
        };
        const tree = await buildTree(req.user, 0);
        res.send(tree);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});

router.put('/users/me', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['fullName', 'mobile', 'whatsApp'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' });

        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(formatUser(req.user));
    } catch (e) {
        res.status(400).send(e);
    }
});

router.put('/users/me/password', auth, async (req, res) => {
    try {
        const isMatch = await bcrypt.compare(req.body.oldPass, req.user.password);
        if (!isMatch) throw new Error('Incorrect old password');
        
        req.user.password = await bcrypt.hash(req.body.newPass, 8);
        await req.user.save();
        res.send({ message: 'Password updated' });
    } catch (e) {
        res.status(400).send({ message: e.message });
    }
});


// --- Plan Routes ---
router.get('/plans', auth, async (req, res) => {
    const plans = await Plan.find({ status: 'ACTIVE' });
    res.send(plans.map(p => ({...p.toObject(), id: p._id})));
});

router.post('/plans/buy', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const plan = await Plan.findById(req.body.planId).session(session);
        if (!plan || plan.status !== 'ACTIVE') throw new Error('Invalid plan');

        const user = await User.findById(req.user._id).session(session);
        if (user.wallet.available < plan.price) throw new Error('Insufficient funds');

        // 1. Deduct balance
        user.wallet.available -= plan.price;
        await user.save();

        // 2. Record Transaction
        await new Transaction({
            userId: user._id,
            type: 'PLAN_PURCHASE',
            amount: -plan.price,
            status: 'APPROVED',
            description: `Purchased ${plan.title}`
        }).save({ session });

        // 3. Create User Plan
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration);
        await new UserPlan({
            userId: user._id,
            planId: plan._id,
            expiresAt
        }).save({ session });

        // 4. Distribute Commissions
        let currentSponsorId = user.sponsorId;
        for (let level = 1; level <= 10; level++) { // Max 10 levels for safety
             if (!currentSponsorId) break;
             const commissionPercent = plan.commissionStructure.get(level.toString());
             
             if (commissionPercent) {
                 const sponsor = await User.findById(currentSponsorId).session(session);
                 if (sponsor && sponsor.status === 'ACTIVE') {
                      const commissionAmount = (plan.price * commissionPercent) / 100;
                      sponsor.wallet.available += commissionAmount;
                      await sponsor.save();

                      await new Commission({
                          userId: sponsor._id,
                          fromUserId: user._id,
                          level,
                          amount: commissionAmount,
                          planId: plan._id,
                          status: 'PAID'
                      }).save({ session });

                       await new Transaction({
                          userId: sponsor._id,
                          type: 'COMMISSION',
                          amount: commissionAmount,
                          status: 'APPROVED',
                          description: `Level ${level} commission from ${user.username}`
                      }).save({ session });
                 }
                 if (sponsor) currentSponsorId = sponsor.sponsorId;
                 else break;
             } else {
                 // If no commission defined for this level, still move up? Usually yes.
                 const sponsor = await User.findById(currentSponsorId).session(session);
                 if (!sponsor) break;
                 currentSponsorId = sponsor.sponsorId;
             }
        }

        await session.commitTransaction();
        res.send({ message: 'Plan purchased successfully' });
    } catch (e) {
        await session.abortTransaction();
        res.status(400).send({ message: e.message });
    } finally {
        session.endSession();
    }
});

// --- Transaction Routes ---
router.post('/deposit', auth, async (req, res) => {
    try {
        const dr = new DepositRequest({
            userId: req.user._id,
            amount: req.body.amount,
            method: req.body.method
        });
        await dr.save();
        res.status(201).send(dr);
    } catch (e) {
        res.status(400).send({ message: e.message });
    }
});

router.post('/withdraw', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.findById(req.user._id).session(session);
        if (user.wallet.available < req.body.amount) throw new Error('Insufficient funds');

        user.wallet.available -= req.body.amount;
        user.wallet.pending += req.body.amount;
        await user.save();

        const wr = new WithdrawalRequest({
            userId: user._id,
            amount: req.body.amount,
            method: req.body.method,
            accountDetails: req.body.accountDetails
        });
        await wr.save({ session });

        await session.commitTransaction();
        res.status(201).send(wr);
    } catch (e) {
        await session.abortTransaction();
        res.status(400).send({ message: e.message });
    } finally {
         session.endSession();
    }
});

// --- Admin Routes ---
router.get('/admin/users', auth, adminAuth, async (req, res) => {
    const users = await User.find({});
    res.send(users.map(formatUser));
});

router.put('/admin/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.send(formatUser(user));
    } catch (e) { res.status(400).send({message: e.message}) }
});

router.get('/admin/plans', auth, adminAuth, async (req, res) => {
    const plans = await Plan.find({});
    res.send(plans.map(p => ({...p.toObject(), id: p._id})));
});

router.get('/admin/deposits', auth, adminAuth, async (req, res) => {
    const requests = await DepositRequest.find({});
    res.send(requests.map(r => ({...r.toObject(), id: r._id})));
});

router.get('/admin/withdrawals', auth, adminAuth, async (req, res) => {
    const requests = await WithdrawalRequest.find({});
    res.send(requests.map(r => ({...r.toObject(), id: r._id})));
});

router.post('/admin/requests/:type/:id/:action', auth, adminAuth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { type, id, action } = req.params;
        const Model = type === 'deposit' ? DepositRequest : WithdrawalRequest;
        const reqDoc = await Model.findById(id).session(session);

        if (!reqDoc || reqDoc.status !== 'PENDING') throw new Error('Invalid request');

        if (action === 'reject') {
             reqDoc.status = 'REJECTED';
             if (type === 'withdrawal') {
                 // Refund
                 const user = await User.findById(reqDoc.userId).session(session);
                 user.wallet.pending -= reqDoc.amount;
                 user.wallet.available += reqDoc.amount;
                 await user.save();
             }
             await reqDoc.save({ session });
        } else if (action === 'approve') {
             reqDoc.status = 'APPROVED';
             const user = await User.findById(reqDoc.userId).session(session);
             
             if (type === 'deposit') {
                 user.wallet.available += reqDoc.amount;
                  await new Transaction({
                     userId: user._id, type: 'DEPOSIT', amount: reqDoc.amount,
                     status: 'APPROVED', description: `Deposit via ${reqDoc.method}`
                 }).save({ session });
             } else {
                  user.wallet.pending -= reqDoc.amount;
                   await new Transaction({
                     userId: user._id, type: 'WITHDRAWAL', amount: -reqDoc.amount,
                     status: 'APPROVED', description: `Withdrawal via ${reqDoc.method}`
                 }).save({ session });
             }
             await user.save();
             await reqDoc.save({ session });
        } else {
            throw new Error('Invalid action');
        }

        await session.commitTransaction();
        res.send({ message: 'Success' });
    } catch (e) {
        await session.abortTransaction();
        res.status(400).send({ message: e.message });
    } finally {
        session.endSession();
    }
});

module.exports = router;
