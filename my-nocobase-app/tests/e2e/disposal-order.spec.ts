/**
 * Disposal Order E2E Tests - 处置单端到端测试
 * 
 * 测试完整的处置单流程：
 * 1. 构建态：通过自然语言创建处置单数据模型
 * 2. 运行态：CRUD、状态流转、门禁检查
 */

import { test, expect } from '@playwright/test';

test.describe('Disposal Order E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录（需要根据实际配置调整）
    await page.goto('/');
    // TODO: 添加登录逻辑
  });

  test('构建态：通过自然语言创建处置单模型', async ({ page, request }) => {
    // 1. 输入意图
    const intentResponse = await request.post('/api/ale_intent:parse', {
      data: {
        input: {
          type: 'text',
          content: '创建一个延迟订单处置单，包含订单号、延迟天数、风险等级、处置状态、处置人、处置时间、处置原因',
        },
      },
    });

    expect(intentResponse.ok()).toBeTruthy();
    const intentResult = await intentResponse.json();
    expect(intentResult.success).toBe(true);
    expect(intentResult.intent).toBeDefined();

    const intentId = intentResult.intent.id;

    // 2. 生成方案
    const proposalResponse = await request.post('/api/ale_intent:generateProposal', {
      data: { intentId },
    });

    expect(proposalResponse.ok()).toBeTruthy();
    const proposalResult = await proposalResponse.json();
    expect(proposalResult.success).toBe(true);
    expect(proposalResult.proposal).toBeDefined();

    const proposalId = proposalResult.proposal.id;

    // 3. 确认方案
    const confirmResponse = await request.post('/api/ale_intent:confirmProposal', {
      data: { proposalId },
    });

    expect(confirmResponse.ok()).toBeTruthy();

    // 4. 创建变更集
    const changesetResponse = await request.post('/api/ale_changeset:createFromProposal', {
      data: { proposalId },
    });

    expect(changesetResponse.ok()).toBeTruthy();
    const changesetResult = await changesetResponse.json();
    expect(changesetResult.success).toBe(true);
    expect(changesetResult.changeSet).toBeDefined();

    const changesetId = changesetResult.changeSet.id;

    // 5. 提交变更集
    const submitResponse = await request.post('/api/ale_changeset:submit', {
      data: { id: changesetId },
    });

    expect(submitResponse.ok()).toBeTruthy();

    // 6. 批准变更集
    const approveResponse = await request.post('/api/ale_changeset:approve', {
      data: { id: changesetId },
    });

    expect(approveResponse.ok()).toBeTruthy();

    // 7. 发布变更集
    const publishResponse = await request.post('/api/ale_changeset:publish', {
      data: { id: changesetId },
    });

    expect(publishResponse.ok()).toBeTruthy();
  });

  test('运行态：创建处置单', async ({ request }) => {
    const response = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-001',
        customerName: '测试客户',
        delayReason: '物流延迟',
        delayDays: 5,
        orderAmount: 1000.00,
        riskLevel: 'low',
        status: 'pending',
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.data).toBeDefined();
    expect(result.data.status).toBe('pending');
  });

  test('运行态：分配处置单', async ({ request }) => {
    // 先创建处置单
    const createResponse = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-002',
        customerName: '测试客户2',
        delayDays: 7,
        orderAmount: 2000.00,
        riskLevel: 'medium',
      },
    });

    const order = (await createResponse.json()).data;
    const orderId = order.id;

    // 分配处置单
    const assignResponse = await request.post(`/api/disposal_orders:assign`, {
      params: { filterByTk: orderId },
      data: {
        assigneeId: 1, // 假设用户ID为1
      },
    });

    expect(assignResponse.ok()).toBeTruthy();
    const assignResult = await assignResponse.json();
    expect(assignResult.success).toBe(true);
    expect(assignResult.gateReport).toBeDefined();

    // 验证状态已更新
    const getResponse = await request.get(`/api/disposal_orders:get`, {
      params: { filterByTk: orderId },
    });
    const updatedOrder = (await getResponse.json()).data;
    expect(updatedOrder.status).toBe('assigned');
  });

  test('运行态：提交处置方案', async ({ request }) => {
    // 创建并分配处置单
    const createResponse = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-003',
        customerName: '测试客户3',
        delayDays: 10,
        orderAmount: 3000.00,
        riskLevel: 'high',
      },
    });

    const order = (await createResponse.json()).data;
    const orderId = order.id;

    // 先分配
    await request.post(`/api/disposal_orders:assign`, {
      params: { filterByTk: orderId },
      data: { assigneeId: 1 },
    });

    // 提交方案
    const submitResponse = await request.post(`/api/disposal_orders:submitProposal`, {
      params: { filterByTk: orderId },
      data: {
        proposedAction: '联系客户协商延期',
        evidence: [
          {
            type: 'risk_assessment',
            content: {
              level: 'high',
              reason: '延迟超过7天，客户满意度可能受影响',
            },
            source: 'system',
            confidence: 0.9,
          },
        ],
      },
    });

    expect(submitResponse.ok()).toBeTruthy();
    const submitResult = await submitResponse.json();
    expect(submitResult.success).toBe(true);
    expect(submitResult.gateReport.passed).toBe(true);

    // 验证状态已更新
    const getResponse = await request.get(`/api/disposal_orders:get`, {
      params: { filterByTk: orderId },
    });
    const updatedOrder = (await getResponse.json()).data;
    expect(updatedOrder.status).toBe('proposal_submitted');
    expect(updatedOrder.proposedAction).toBe('联系客户协商延期');
  });

  test('运行态：审批并执行处置', async ({ request }) => {
    // 创建、分配、提交方案
    const createResponse = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-004',
        customerName: '测试客户4',
        delayDays: 8,
        orderAmount: 4000.00,
        riskLevel: 'high',
      },
    });

    const order = (await createResponse.json()).data;
    const orderId = order.id;

    await request.post(`/api/disposal_orders:assign`, {
      params: { filterByTk: orderId },
      data: { assigneeId: 1 },
    });

    await request.post(`/api/disposal_orders:submitProposal`, {
      params: { filterByTk: orderId },
      data: {
        proposedAction: '提供补偿方案',
        evidence: [
          {
            type: 'risk_assessment',
            content: { level: 'high', reason: '高价值订单' },
            source: 'system',
          },
        ],
      },
    });

    // 审批
    const approveResponse = await request.post(`/api/disposal_orders:approve`, {
      params: { filterByTk: orderId },
      data: {
        approvalNotes: '方案合理，批准执行',
      },
    });

    expect(approveResponse.ok()).toBeTruthy();
    const approveResult = await approveResponse.json();
    expect(approveResult.success).toBe(true);

    // 验证状态
    const getResponse1 = await request.get(`/api/disposal_orders:get`, {
      params: { filterByTk: orderId },
    });
    const approvedOrder = (await getResponse1.json()).data;
    expect(approvedOrder.status).toBe('approved');

    // 执行
    const executeResponse = await request.post(`/api/disposal_orders:execute`, {
      params: { filterByTk: orderId },
    });

    expect(executeResponse.ok()).toBeTruthy();
    const executeResult = await executeResponse.json();
    expect(executeResult.success).toBe(true);

    // 验证最终状态
    const getResponse2 = await request.get(`/api/disposal_orders:get`, {
      params: { filterByTk: orderId },
    });
    const resolvedOrder = (await getResponse2.json()).data;
    expect(resolvedOrder.status).toBe('resolved');
    expect(resolvedOrder.finalAction).toBeDefined();
    expect(resolvedOrder.resolvedAt).toBeDefined();
  });

  test('运行态：门禁阻断非法操作', async ({ request }) => {
    // 创建处置单
    const createResponse = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-005',
        customerName: '测试客户5',
        delayDays: 3,
        orderAmount: 500.00,
        riskLevel: 'low',
        status: 'pending',
      },
    });

    const order = (await createResponse.json()).data;
    const orderId = order.id;

    // 尝试直接执行（应该被门禁阻止，因为状态不是 approved）
    const executeResponse = await request.post(`/api/disposal_orders:execute`, {
      params: { filterByTk: orderId },
    });

    // 应该返回错误
    expect(executeResponse.status()).toBeGreaterThanOrEqual(400);
  });

  test('运行态：审计日志记录', async ({ request }) => {
    // 创建处置单
    const createResponse = await request.post('/api/disposal_orders:create', {
      data: {
        orderNo: `DO-${Date.now()}`,
        sourceOrderId: 'ORD-006',
        customerName: '测试客户6',
        delayDays: 5,
        orderAmount: 1500.00,
        riskLevel: 'medium',
      },
    });

    const order = (await createResponse.json()).data;
    const orderId = order.id;

    // 执行分配操作
    await request.post(`/api/disposal_orders:assign`, {
      params: { filterByTk: orderId },
      data: { assigneeId: 1 },
    });

    // 查询事件记录
    const eventsResponse = await request.get('/api/disposal_events:list', {
      params: {
        filter: { disposalOrderId: orderId },
      },
    });

    expect(eventsResponse.ok()).toBeTruthy();
    const events = (await eventsResponse.json()).data;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e: any) => e.type === 'assigned')).toBe(true);
  });
});
