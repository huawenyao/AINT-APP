/**
 * GatePreCheck - 门禁预检组件
 * 
 * 展示门禁预检结果
 */

import React from 'react';
import { Card, List, Tag, Alert, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { GatePreCheckResults, GatePreCheckResult } from '@ALE/core';

export interface GatePreCheckProps {
  /** 门禁预检结果 */
  results?: GatePreCheckResults;
  /** 是否加载中 */
  loading?: boolean;
}

export const GatePreCheck: React.FC<GatePreCheckProps> = ({
  results,
  loading = false,
}) => {
  if (!results || Object.keys(results).length === 0) {
    return (
      <Card title="门禁预检" loading={loading}>
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          暂无门禁预检数据
        </div>
      </Card>
    );
  }

  const gateResults = Object.entries(results);

  const allPassed = gateResults.every(([_, result]) => result.passed);
  const hasWarnings = gateResults.some(
    ([_, result]) => !result.passed && result.details?.severity === 'warning',
  );

  return (
    <Card title="门禁预检" loading={loading}>
      {/* 总体状态 */}
      <Alert
        message={allPassed ? '所有门禁预检通过' : '部分门禁预检未通过'}
        type={allPassed ? 'success' : hasWarnings ? 'warning' : 'error'}
        icon={allPassed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* 详细结果 */}
      <List
        dataSource={gateResults}
        renderItem={([gate, result]) => (
          <List.Item>
            <Card
              size="small"
              style={{ width: '100%' }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{gate}</span>
                  <Tag color={result.passed ? 'green' : 'red'}>
                    {result.passed ? '通过' : '未通过'}
                  </Tag>
                </div>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <strong>消息:</strong> {result.message}
              </div>
              {result.details && (
                <div>
                  <strong>详情:</strong>
                  <pre style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default GatePreCheck;
