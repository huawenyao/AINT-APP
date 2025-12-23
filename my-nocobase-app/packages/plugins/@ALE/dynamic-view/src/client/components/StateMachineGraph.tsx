/**
 * StateMachineGraph - 状态机图组件
 * 
 * 使用 ReactFlow 展示状态机图
 */

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Tag } from 'antd';
import type { StateMachinePreview, StatePreviewNode, TransitionPreviewEdge } from '@ALE/core';

export interface StateMachineGraphProps {
  /** 状态机预览数据 */
  preview?: StateMachinePreview;
  /** 是否可编辑 */
  editable?: boolean;
  /** 节点点击回调 */
  onNodeClick?: (nodeId: string) => void;
}

const nodeWidth = 150;
const nodeHeight = 80;

/**
 * 状态机布局算法
 */
function getStateMachineLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export const StateMachineGraph: React.FC<StateMachineGraphProps> = ({
  preview,
  editable = false,
  onNodeClick,
}) => {
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!preview) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = preview.states.map((state) => {
      const nodeType =
        state.type === 'initial'
          ? 'input'
          : state.type === 'final'
          ? 'output'
          : 'default';

      return {
        id: state.id,
        type: nodeType,
        data: {
          label: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{state.name}</div>
              {state.isNew && (
                <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                  新建
                </Tag>
              )}
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          backgroundColor: state.type === 'final' ? '#f0f0f0' : '#fff',
          border: state.type === 'initial' ? '2px solid #52c41a' : '1px solid #d9d9d9',
        },
      };
    });

    const edges: Edge[] = preview.transitions.map((trans) => ({
      id: trans.id,
      source: trans.from,
      target: trans.to,
      label: trans.label || trans.trigger,
      type: 'smoothstep',
      animated: trans.isNew,
      style: trans.isNew ? { stroke: '#52c41a', strokeWidth: 2 } : {},
    }));

    const layouted = getStateMachineLayout(nodes, edges);
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [preview]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  if (!preview) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>暂无状态机数据</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #d9d9d9', borderRadius: 4 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={editable ? onConnect : undefined}
        onNodeClick={onNodeClickHandler}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

import { Tag } from 'antd';

export default StateMachineGraph;
