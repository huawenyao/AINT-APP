/**
 * SchemaGraph - Schema 图组件
 * 
 * 使用 ReactFlow 展示对象关系图
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
import type { SchemaPreview, ObjectPreviewNode, RelationPreviewEdge } from '@ALE/core';

export interface SchemaGraphProps {
  /** Schema 预览数据 */
  preview?: SchemaPreview;
  /** 是否可编辑 */
  editable?: boolean;
  /** 节点点击回调 */
  onNodeClick?: (nodeId: string) => void;
  /** 边点击回调 */
  onEdgeClick?: (edgeId: string) => void;
}

const nodeWidth = 200;
const nodeHeight = 100;

/**
 * 使用 dagre 进行自动布局
 */
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB',
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

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

export const SchemaGraph: React.FC<SchemaGraphProps> = ({
  preview,
  editable = false,
  onNodeClick,
  onEdgeClick,
}) => {
  // 转换预览数据为 ReactFlow 节点和边
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!preview) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = preview.objects.map((obj) => ({
      id: obj.id,
      type: 'default',
      data: {
        label: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{obj.displayName}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{obj.name}</div>
            {obj.isNew && <Tag color="green" style={{ marginTop: 4 }}>新建</Tag>}
            {obj.isModified && <Tag color="orange" style={{ marginTop: 4 }}>修改</Tag>}
          </div>
        ),
      },
      position: { x: 0, y: 0 }, // 将由布局算法计算
    }));

    const edges: Edge[] = preview.relations.map((rel) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: rel.label,
      type: 'smoothstep',
      animated: rel.isNew,
      style: rel.isNew ? { stroke: '#52c41a', strokeWidth: 2 } : {},
    }));

    // 应用布局
    const layouted = getLayoutedElements(nodes, edges);
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

  const onEdgeClickHandler = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      onEdgeClick?.(edge.id);
    },
    [onEdgeClick],
  );

  if (!preview) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>暂无 Schema 数据</div>
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
        onEdgeClick={onEdgeClickHandler}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

// 需要导入 Tag 组件
import { Tag } from 'antd';

export default SchemaGraph;
