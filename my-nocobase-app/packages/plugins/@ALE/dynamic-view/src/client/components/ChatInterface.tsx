/**
 * ChatInterface - 对话界面组件
 * 
 * 构建态核心组件，提供自然语言输入和 AI 响应展示
 */

import React, { useState, useCallback } from 'react';
import { Input, Button, Card, List, Avatar, Spin } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { ConversationMessage, IntentInput } from '@ALE/core';

export interface ChatInterfaceProps {
  /** 会话 ID */
  sessionId?: string;
  /** 消息列表 */
  messages?: ConversationMessage[];
  /** 发送消息回调 */
  onSend?: (input: IntentInput) => Promise<void>;
  /** 是否加载中 */
  loading?: boolean;
  /** 占位符 */
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  messages = [],
  onSend,
  loading = false,
  placeholder = '输入您的需求，例如：创建一个延迟订单处置单...',
}) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(async () => {
    if (!input.trim() || !onSend) {
      return;
    }

    const intentInput: IntentInput = {
      type: 'text',
      content: input.trim(),
    };

    await onSend(intentInput);
    setInput('');
  }, [input, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Card
      title="ALE Studio - 对话式设计"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item
              style={{
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  maxWidth: '80%',
                }}
              >
                <Avatar
                  icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
                  }}
                />
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: message.role === 'user' ? '#1890ff' : '#f0f0f0',
                    color: message.role === 'user' ? '#fff' : '#000',
                  }}
                >
                  {message.content}
                </div>
              </div>
            </List.Item>
          )}
        />
        {loading && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin />
          </div>
        )}
      </div>

      <Input.Group compact style={{ display: 'flex' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          发送
        </Button>
      </Input.Group>
    </Card>
  );
};

export default ChatInterface;
