/**
 * ProposalPreview - 方案预览组件
 * 
 * 展示 AI 生成的变更方案，包括摘要、组件、影响分析等
 */

import React from 'react';
import { Card, Descriptions, Tag, Alert, Divider } from 'antd';
import type { ChangeProposal, ImpactAnalysis, GatePreCheckResults } from '@ALE/core';

export interface ProposalPreviewProps {
  /** 方案数据 */
  proposal?: ChangeProposal;
  /** 是否加载中 */
  loading?: boolean;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  proposal,
  loading = false,
}) => {
  if (!proposal) {
    return (
      <Card title="方案预览" loading={loading}>
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          暂无方案数据
        </div>
      </Card>
    );
  }

  const { summary, components, impact, gatePreCheck } = proposal;

  return (
    <Card title="方案预览" loading={loading}>
      {/* 方案摘要 */}
      <Descriptions title="方案摘要" bordered column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="摘要">{summary}</Descriptions.Item>
        <Descriptions.Item label="版本">v{proposal.version}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={proposal.status === 'confirmed' ? 'green' : 'orange'}>
            {proposal.status === 'confirmed' ? '已确认' : '草稿'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 方案组件 */}
      <Divider orientation="left">方案组件</Divider>
      <div style={{ marginBottom: 16 }}>
        {components.objects && components.objects.length > 0 && (
          <Tag color="blue">对象: {components.objects.length} 个</Tag>
        )}
        {components.relations && components.relations.length > 0 && (
          <Tag color="green">关系: {components.relations.length} 个</Tag>
        )}
        {components.flows && components.flows.length > 0 && (
          <Tag color="purple">流程: {components.flows.length} 个</Tag>
        )}
        {components.views && components.views.length > 0 && (
          <Tag color="orange">视图: {components.views.length} 个</Tag>
        )}
        {components.rules && components.rules.length > 0 && (
          <Tag color="red">规则: {components.rules.length} 个</Tag>
        )}
        {components.actions && components.actions.length > 0 && (
          <Tag color="cyan">动作: {components.actions.length} 个</Tag>
        )}
      </div>

      {/* 影响分析 */}
      {impact && (
        <>
          <Divider orientation="left">影响分析</Divider>
          <Alert
            message={`风险等级: ${impact.riskLevel}`}
            type={
              impact.riskLevel === 'critical' || impact.riskLevel === 'high'
                ? 'warning'
                : 'info'
            }
            description={
              <div>
                {impact.affectedObjects.length > 0 && (
                  <div>受影响对象: {impact.affectedObjects.join(', ')}</div>
                )}
                {impact.warnings.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>警告:</strong>
                    <ul>
                      {impact.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {impact.suggestions.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>建议:</strong>
                    <ul>
                      {impact.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {/* 门禁预检 */}
      {gatePreCheck && (
        <>
          <Divider orientation="left">门禁预检</Divider>
          <div>
            {Object.entries(gatePreCheck).map(([gate, result]) => (
              <Alert
                key={gate}
                message={`${gate}: ${result.passed ? '通过' : '未通过'}`}
                type={result.passed ? 'success' : 'error'}
                description={result.message}
                style={{ marginBottom: 8 }}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default ProposalPreview;
