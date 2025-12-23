/**
 * GateStatusBadge - 门禁状态徽章
 * 
 * 运行态组件，展示门禁检查状态
 */

import React from 'react';
import { Badge, Tag, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { GateResult } from '@ALE/core';

export interface GateStatusBadgeProps {
  /** 门禁结果 */
  result?: GateResult;
  /** 显示详细信息 */
  showDetails?: boolean;
}

export const GateStatusBadge: React.FC<GateStatusBadgeProps> = ({
  result,
  showDetails = false,
}) => {
  if (!result) {
    return <Badge status="default" text="未检查" />;
  }

  const statusConfig = {
    passed: {
      status: 'success' as const,
      icon: <CheckCircleOutlined />,
      color: 'green',
      text: '通过',
    },
    failed: {
      status: result.severity === 'critical' ? 'error' : 'warning' as const,
      icon:
        result.severity === 'critical' ? (
          <CloseCircleOutlined />
        ) : (
          <ExclamationCircleOutlined />
        ),
      color: result.severity === 'critical' ? 'red' : 'orange',
      text: '未通过',
    },
  };

  const config = statusConfig[result.passed ? 'passed' : 'failed'];

  const badge = (
    <Badge
      status={config.status}
      text={
        <span>
          {config.icon} {result.gate}: {config.text}
        </span>
      }
    />
  );

  if (showDetails && result.details) {
    return (
      <Tooltip
        title={
          <div>
            <div>{result.message}</div>
            {result.details && (
              <pre style={{ marginTop: 8, fontSize: 12 }}>
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        }
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default GateStatusBadge;
