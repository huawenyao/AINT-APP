/**
 * StateFlowIndicator - 状态流程指示器
 * 
 * 运行态组件，展示对象的状态流转历史
 */

import React from 'react';
import { Timeline, Tag, Card } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

export interface StateFlowIndicatorProps {
  /** 当前状态 */
  currentStatus?: string;
  /** 状态历史 */
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    actor?: string;
    note?: string;
  }>;
  /** 状态配置 */
  statusConfig?: Record<
    string,
    {
      label: string;
      color: string;
      icon?: React.ReactNode;
    }
  >;
}

export const StateFlowIndicator: React.FC<StateFlowIndicatorProps> = ({
  currentStatus,
  statusHistory = [],
  statusConfig = {},
}) => {
  const defaultStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'default' },
    assigned: { label: '已分配', color: 'processing' },
    proposal_submitted: { label: '方案已提交', color: 'warning' },
    approved: { label: '已批准', color: 'success' },
    executing: { label: '执行中', color: 'processing' },
    resolved: { label: '已解决', color: 'success' },
    failed: { label: '执行失败', color: 'error' },
    cancelled: { label: '已取消', color: 'default' },
  };

  const config = { ...defaultStatusConfig, ...statusConfig };

  return (
    <Card title="状态流转历史" size="small">
      <Timeline
        items={statusHistory.map((item, index) => {
          const isLast = index === statusHistory.length - 1;
          const statusInfo = config[item.status] || { label: item.status, color: 'default' };

          return {
            color: isLast ? 'green' : 'blue',
            dot: isLast ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
            children: (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  {isLast && currentStatus === item.status && (
                    <Tag color="green">当前状态</Tag>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {item.timestamp.toLocaleString()}
                  {item.actor && ` · ${item.actor}`}
                </div>
                {item.note && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>{item.note}</div>
                )}
              </div>
            ),
          };
        })}
      />
    </Card>
  );
};

export default StateFlowIndicator;
