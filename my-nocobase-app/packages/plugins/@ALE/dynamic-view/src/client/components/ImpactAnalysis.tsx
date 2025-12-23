/**
 * ImpactAnalysis - 影响分析组件
 * 
 * 展示变更的影响范围和建议
 */

import React from 'react';
import { Card, List, Tag, Alert, Descriptions } from 'antd';
import { WarningOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ImpactAnalysis } from '@ALE/core';

export interface ImpactAnalysisProps {
  /** 影响分析数据 */
  impact?: ImpactAnalysis;
  /** 是否加载中 */
  loading?: boolean;
}

export const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({
  impact,
  loading = false,
}) => {
  if (!impact) {
    return (
      <Card title="影响分析" loading={loading}>
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          暂无影响分析数据
        </div>
      </Card>
    );
  }

  const riskColorMap: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'magenta',
  };

  return (
    <Card title="影响分析" loading={loading}>
      {/* 风险等级 */}
      <Alert
        message={`风险等级: ${impact.riskLevel}`}
        type={impact.riskLevel === 'critical' || impact.riskLevel === 'high' ? 'warning' : 'info'}
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
        description={
          <Tag color={riskColorMap[impact.riskLevel] || 'default'}>
            {impact.riskLevel.toUpperCase()}
          </Tag>
        }
      />

      {/* 受影响对象 */}
      {impact.affectedObjects.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>
            <InfoCircleOutlined /> 受影响对象
          </h4>
          <List
            size="small"
            dataSource={impact.affectedObjects}
            renderItem={(item) => (
              <List.Item>
                <Tag>{item}</Tag>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 受影响视图 */}
      {impact.affectedViews.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>受影响视图</h4>
          <List
            size="small"
            dataSource={impact.affectedViews}
            renderItem={(item) => (
              <List.Item>
                <Tag color="orange">{item}</Tag>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 警告 */}
      {impact.warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>
            <WarningOutlined style={{ color: '#faad14' }} /> 警告
          </h4>
          <List
            size="small"
            dataSource={impact.warnings}
            renderItem={(warning) => (
              <List.Item>
                <Alert message={warning} type="warning" showIcon style={{ width: '100%' }} />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 建议 */}
      {impact.suggestions.length > 0 && (
        <div>
          <h4>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> 建议
          </h4>
          <List
            size="small"
            dataSource={impact.suggestions}
            renderItem={(suggestion) => (
              <List.Item>
                <Alert message={suggestion} type="success" showIcon style={{ width: '100%' }} />
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default ImpactAnalysis;
