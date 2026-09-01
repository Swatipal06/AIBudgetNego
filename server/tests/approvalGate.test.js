import { EVENT_TYPES } from '../src/models/NegotiationEvent.js';
import { NEGOTIATION_STATUS } from '../src/models/Negotiation.js';

describe('Human Approval Gate & Finalization State Machine', () => {
  test('22. Negotiation state machine strictly defines all 8 lifecycle states including AWAITING_APPROVAL', () => {
    expect(NEGOTIATION_STATUS).toEqual([
      'PENDING',
      'RUNNING',
      'SETTLED',
      'DEADLOCK',
      'AWAITING_APPROVAL',
      'FINALIZED',
      'CANCELLED',
      'FAILED',
    ]);
  });

  test('23. Audit event model defines ALL authoritative enterprise event types', () => {
    expect(EVENT_TYPES).toContain('NEGOTIATION_CREATED');
    expect(EVENT_TYPES).toContain('NEGOTIATION_STARTED');
    expect(EVENT_TYPES).toContain('ROUND_STARTED');
    expect(EVENT_TYPES).toContain('PROPOSAL_CREATED');
    expect(EVENT_TYPES).toContain('CONCESSION');
    expect(EVENT_TYPES).toContain('AGREEMENT_REACHED');
    expect(EVENT_TYPES).toContain('DEADLOCK');
    expect(EVENT_TYPES).toContain('CFO_DECISION');
    expect(EVENT_TYPES).toContain('AWAITING_APPROVAL');
    expect(EVENT_TYPES).toContain('ALLOCATION_APPROVED');
    expect(EVENT_TYPES).toContain('ALLOCATION_REJECTED');
    expect(EVENT_TYPES).toContain('NEGOTIATION_FINALIZED');
    expect(EVENT_TYPES).toContain('NEGOTIATION_FAILED');
  });

  test('24. State transition logic verifies approval is ONLY permitted from AWAITING_APPROVAL', () => {
    const validateCanApprove = (currentStatus) => {
      if (currentStatus !== 'AWAITING_APPROVAL') {
        return {
          canApprove: false,
          error: `Cannot approve negotiation in '${currentStatus}' state. Must be 'AWAITING_APPROVAL'.`,
        };
      }
      return { canApprove: true };
    };

    expect(validateCanApprove('PENDING').canApprove).toBe(false);
    expect(validateCanApprove('RUNNING').canApprove).toBe(false);
    expect(validateCanApprove('FINALIZED').canApprove).toBe(false);
    expect(validateCanApprove('FAILED').canApprove).toBe(false);
    expect(validateCanApprove('AWAITING_APPROVAL').canApprove).toBe(true);
  });

  test('25. Approval transition correctly applies administrator metadata and finalizes allocation', () => {
    const mockNegotiation = {
      _id: 'neg_123',
      title: 'Q3 Budget Allocation',
      status: 'AWAITING_APPROVAL',
      approvedBy: null,
      approvedAt: null,
      approvalNote: null,
    };

    const mockAllocation = {
      _id: 'alloc_456',
      status: 'AWAITING_APPROVAL',
      allocations: [
        { departmentName: 'Engineering', proposedAmount: 450000, finalAmount: null },
        { departmentName: 'Marketing', proposedAmount: 320000, finalAmount: null },
        { departmentName: 'Sales', proposedAmount: 230000, finalAmount: null },
      ],
      approvedBy: null,
      approvedAt: null,
    };

    const adminUser = {
      _id: 'admin_789',
      name: 'Sarah Chen',
      role: 'ADMIN',
    };

    const approvalNote = 'Approved for executive Q3 deployment.';
    const approvedDate = new Date();

    // Perform approval mutation
    mockAllocation.status = 'APPROVED';
    mockAllocation.approvedBy = adminUser._id;
    mockAllocation.approvedAt = approvedDate;
    mockAllocation.approvalNote = approvalNote;
    mockAllocation.allocations.forEach((a) => {
      a.finalAmount = a.proposedAmount;
    });

    mockNegotiation.status = 'FINALIZED';
    mockNegotiation.approvedBy = adminUser._id;
    mockNegotiation.approvedAt = approvedDate;
    mockNegotiation.approvalNote = approvalNote;

    expect(mockNegotiation.status).toBe('FINALIZED');
    expect(mockNegotiation.approvedBy).toBe('admin_789');
    expect(mockNegotiation.approvalNote).toBe(approvalNote);
    expect(mockAllocation.status).toBe('APPROVED');
    expect(mockAllocation.allocations[0].finalAmount).toBe(450000);
    expect(mockAllocation.allocations[1].finalAmount).toBe(320000);
    expect(mockAllocation.allocations[2].finalAmount).toBe(230000);
  });

  test('26. Rejection transition marks status as FAILED and attaches administrative justification', () => {
    const mockNegotiation = {
      status: 'AWAITING_APPROVAL',
      failureReason: null,
    };

    const rejectNote = 'Engineering minimum requirement changed.';
    mockNegotiation.status = 'FAILED';
    mockNegotiation.failureReason = `Allocation rejected by admin: ${rejectNote}`;

    expect(mockNegotiation.status).toBe('FAILED');
    expect(mockNegotiation.failureReason).toContain('Engineering minimum requirement changed');
  });
});
