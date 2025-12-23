/**
 * ALE Studio - 构建态 Studio 主界面
 * 
 * 整合对话界面、预览面板、图表等组件
 */

import React, { useState, useCallback } from 'react';
import { Layout, Tabs, Card } from 'antd';
import { ChatInterface } from './ChatInterface';
import { ProposalPreview } from './ProposalPreview';
import { SchemaGraph } from './SchemaGraph';
import { StateMachineGraph } from './StateMachineGraph';
import { ImpactAnalysis } from './ImpactAnalysis';
import { GatePreCheck } from './GatePreCheck';
import type { IntentInput, ChangeProposal, ConversationMessage } from '@ALE/core';

const { Content, Sider } = Layout;
const { TabPane } = Tabs;

export interface ALEStudioProps {
  /** 会话 ID */
  sessionId?: string;
  /** 当前方案 */
  currentProposal?: ChangeProposal;
  /** 消息历史 */
  messages?: ConversationMessage[];
  /** 发送意图回调 */
  onSendIntent?: (input: IntentInput) => Promise<void>;
  /** 确认方案回调 */
  onConfirmProposal?: (proposalId: string) => Promise<void>;
  /** 生成变更集回调 */
  onCreateChangeSet?: (proposalId: string) => Promise<void>;
}

export const ALEStudio: React.FC<ALEStudioProps> = ({
  sessionId,
  currentProposal,
  messages = [],
  onSendIntent,
  onConfirmProposal,
  onCreateChangeSet,
}) => {
  const [activeTab, setActiveTab] = useState('chat');

  const handleSend = useCallback(
    async (input: IntentInput) => {
      if (onSendIntent) {
        await onSendIntent(input);
      }
    },
    [onSendIntent],
  );

  const handleConfirm = useCallback(async () => {
    if (currentProposal && onConfirmProposal) {
      await onConfirmProposal(currentProposal.id);
    }
  }, [currentProposal, onConfirmProposal]);

  const handleCreateChangeSet = useCallback(async () => {
    if (currentProposal && onCreateChangeSet) {
      await onCreateChangeSet(currentProposal.id);
    }
  }, [currentProposal, onCreateChangeSet]);

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧对话面板 */}
      <Sider width={400} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <ChatInterface
          sessionId={sessionId}
          messages={messages}
          onSend={handleSend}
          placeholder="输入您的需求，例如：创建一个延迟订单处置单..."
        />
      </Sider>

      {/* 右侧预览面板 */}
      <Content style={{ padding: 16, overflow: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 方案预览 */}
          <TabPane tab="方案预览" key="proposal">
            <ProposalPreview proposal={currentProposal} />
            {currentProposal && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  disabled={currentProposal.status === 'confirmed'}
                  style={{ marginRight: 8 }}
                >
                  确认方案
                </Button>
                <Button
                  onClick={handleCreateChangeSet}
                  disabled={currentProposal.status !== 'confirmed'}
                >
                  生成变更集
                </Button>
              </div>
            )}
          </TabPane>

          {/* Schema 图 */}
          <TabPane tab="Schema 图" key="schema">
            <Card title="对象关系图">
              <SchemaGraph preview={currentProposal?.previews?.schema} />
            </Card>
          </TabPane>

          {/* 状态机图 */}
          <TabPane tab="状态机图" key="stateMachine">
            <Card title="状态机图">
              <StateMachineGraph preview={currentProposal?.previews?.stateMachine} />
            </Card>
          </TabPane>

          {/* 影响分析 */}
          <TabPane tab="影响分析" key="impact">
            <ImpactAnalysis impact={currentProposal?.impact} />
          </TabPane>

          {/* 门禁预检 */}
          <TabPane tab="门禁预检" key="gates">
            <GatePreCheck results={currentProposal?.gatePreCheck} />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

import { Button } from 'antd';

export default ALEStudio;
