import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import Negotiation from './models/Negotiation.js';
import Department from './models/Department.js';
import Round from './models/Round.js';
import Allocation from './models/Allocation.js';
import NegotiationEvent from './models/NegotiationEvent.js';
import NegotiationEngine from './engine/negotiationEngine.js';
import logger from './config/logger.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    logger.info('Connecting to database for seeding...');
    await connectDB();

    // 1. Clear existing demo collections
    logger.info('Clearing old records...');
    await User.deleteMany({});
    await Negotiation.deleteMany({});
    await Department.deleteMany({});
    await Round.deleteMany({});
    await Allocation.deleteMany({});
    await NegotiationEvent.deleteMany({});

    // 2. Create Users
    logger.info('Creating demo users...');
    const adminUser = await User.create({
      name: 'Sarah Chen (Admin)',
      email: 'admin@enterprise.ai',
      password: 'Admin@12345',
      role: 'ADMIN',
    });

    const viewerUser = await User.create({
      name: 'Alex Rivera (Auditor / Viewer)',
      email: 'viewer@enterprise.ai',
      password: 'Viewer@12345',
      role: 'VIEWER',
    });

    logger.info(`Users created: Admin (${adminUser.email}), Viewer (${viewerUser.email})`);

    // 3. Create Seed Negotiation Scenario 1: Ready to Run (Live Interactive Demo)
    logger.info('Creating primary live demo negotiation...');
    const demoNegotiation = await Negotiation.create({
      title: 'FY2026 Q3 Enterprise Operating Budget Allocation',
      description: 'Strategic allocation of shared company budget across core revenue, infrastructure, and growth departments.',
      companyBudget: 1000000, // ₹10,00,000
      currency: 'INR',
      maxRounds: 5,
      currentRound: 0,
      status: 'PENDING',
      createdBy: adminUser._id,
      departments: [],
    });

    const dept1 = await Department.create({
      negotiationId: demoNegotiation._id,
      name: 'Engineering',
      requestedBudget: 500000, // ₹5,00,000
      minAcceptableBudget: 400000, // ₹4,00,000
      priority: 'HIGH',
      strategy: 'COMPROMISING',
      hardConstraints: [
        'Mandatory Cloud Infrastructure & 99.99% SLA Uptime (₹3,00,000)',
        'Security Compliance & SOC-2 Auditing (₹1,00,000)',
      ],
      softPreferences: [
        'Experimental LLM R&D Cluster (₹60,000)',
        'Developer Tooling & CI/CD Accelerated Runners (₹40,000)',
      ],
      color: '#3b82f6',
      description: 'Core platform engineering, site reliability, AI infrastructure, and cloud security.',
    });

    const dept2 = await Department.create({
      negotiationId: demoNegotiation._id,
      name: 'Marketing',
      requestedBudget: 400000, // ₹4,00,000
      minAcceptableBudget: 250000, // ₹2,50,000
      priority: 'MEDIUM',
      strategy: 'COLLABORATIVE',
      hardConstraints: [
        'Q3 Global Product Launch Ad Campaigns (₹1,80,000)',
        'Mandatory Marketing Analytics Software Subscriptions (₹70,000)',
      ],
      softPreferences: [
        'Keynote Industry Tech Sponsorships (₹90,000)',
        'Influencer and Thought Leadership Outreach (₹60,000)',
      ],
      color: '#10b981',
      description: 'Global brand awareness, performance marketing, content, and lead acquisition.',
    });

    const dept3 = await Department.create({
      negotiationId: demoNegotiation._id,
      name: 'Sales',
      requestedBudget: 300000, // ₹3,00,000
      minAcceptableBudget: 200000, // ₹2,00,000
      priority: 'MEDIUM',
      strategy: 'ASSERTIVE',
      hardConstraints: [
        'Enterprise CRM Licenses & Quota Commission Pool (₹1,50,000)',
        'Critical Customer Success Retention Programs (₹50,000)',
      ],
      softPreferences: [
        'International Sales Roadshow & Executive Travel (₹60,000)',
        'High-value Client Hospitality Suite (₹40,000)',
      ],
      color: '#f59e0b',
      description: 'Enterprise revenue generation, account executive commissions, and customer onboarding.',
    });

    demoNegotiation.departments = [dept1._id, dept2._id, dept3._id];
    await demoNegotiation.save();

    await NegotiationEngine.logEvent(demoNegotiation._id, {
      eventType: 'NEGOTIATION_CREATED',
      message: `Negotiation '${demoNegotiation.title}' created with company budget ₹10,00,000 and total demand ₹12,00,000.`,
      details: {
        companyBudget: 1000000,
        totalDemand: 1200000,
        departmentCount: 3,
      },
      actor: 'ADMIN',
    });

    logger.info('Primary interactive demo scenario seeded successfully.');
    logger.info('----------------------------------------------------');
    logger.info('Credentials for login:');
    logger.info('ADMIN:  admin@enterprise.ai  /  Admin@12345');
    logger.info('VIEWER: viewer@enterprise.ai /  Viewer@12345');
    logger.info('----------------------------------------------------');

    return { adminUser, viewerUser, demoNegotiation };
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    throw error;
  }
};

// If run directly via `npm run seed`
if (process.argv[1]?.includes('seed.js')) {
  seedDatabase()
    .then(async () => {
      logger.info('Seeding finished. Exiting...');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error(`Seed script error: ${err.message}`);
      await disconnectDB();
      process.exit(1);
    });
}
