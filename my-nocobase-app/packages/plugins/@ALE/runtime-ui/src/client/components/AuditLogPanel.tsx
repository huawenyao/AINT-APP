/**
 * AuditLogPanel - 审计日志面板
 * 
 * 运行态组件，展示操作审计日志
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Descriptions, DatePicker, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { AuditLog } from '@ALE/core';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface AuditLogPanelProps {
  /** 主体类型 */
  subjectType?: string;
  /** 主体 ID */
  subjectId?: string;
  /** 是否自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔（秒） */
  refreshInterval?: number;
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  subjectType,
  subjectId,
  autoRefresh = false,
  refreshInterval = 30,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    action?: string;
    startTime?: Date;
    endTime?: Date;
  }>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      // TODO: 调用 API 获取日志
      // const response = await api.get('/api/ale_audit:query', { params: { filter: { subjectType, subjectId, ...filter } } });
      // setLogs(response.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [subjectType, subjectId, filter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => new Date(timestamp).toLocaleString(),
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag>{action}</Tag>,
    },
    {
      title: '操作者',
      dataIndex: 'actorId',
      key: 'actorId',
      render: (actorId: number, record: AuditLog) => (
        <span>
          {record.actorType === 'user' ? '👤' : record.actorType === 'system' ? '⚙️' : '🤖'}{' '}
          {actorId}
        </span>
      ),
    },
    {
      title: '主体',
      key: 'subject',
      render: (_: unknown, record: AuditLog) => (
        <span>
          {record.subjectType}:{record.subjectId}
        </span>
      ),
    },
    {
      title: '关联 ID',
      dataIndex: 'correlationId',
      key: 'correlationId',
      render: (id: string) => <Tag color="blue">{id.substring(0, 8)}...</Tag>,
    },
  ];

  return (
    <Card
      title="审计日志"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索操作"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilter({
                  ...filter,
                  startTime: dates[0]?.toDate(),
                  endTime: dates[1]?.toDate(),
                });
              }
            }}
          />
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => (
            <Descriptions column={2} size="small">
              <Descriptions.Item label="数据">
                <pre style={{ fontSize: 12 }}>
                  {JSON.stringify(record.data, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="结果">
                <pre style={{ fontSize: 12 }}>
                  {JSON.stringify(record.result, null, 2)}
                </pre>
              </Descriptions.Item>
            </Descriptions>
          ),
        }}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
};

export default AuditLogPanel;
