# ALE 双态架构：构建态与运行态

> **核心理念**：构建态 AI 原生交互，运行态本体驱动执行  
> **版本**: 1.0 | 日期：2025年12月

---

## 1. 双态架构概述

### 1.1 核心区分

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ALE 双态架构                                          │
├─────────────────────────────────────┬───────────────────────────────────────┤
│           构建态 (Design Time)       │           运行态 (Runtime)             │
│         「AI 原生交互」               │         「本体驱动执行」                │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     │                                       │
│  ┌─────────────────────────────┐   │   ┌─────────────────────────────┐     │
│  │     自然语言意图表达         │   │   │     结构化 API 调用          │     │
│  └──────────────┬──────────────┘   │   └──────────────┬──────────────┘     │
│                 ▼                   │                  ▼                    │
│  ┌─────────────────────────────┐   │   ┌─────────────────────────────┐     │
│  │     意图理解引擎             │   │   │     门禁引擎 (G1-G7)         │     │
│  │  Intent Understanding       │   │   │     Gate Engine              │     │
│  └──────────────┬──────────────┘   │   └──────────────┬──────────────┘     │
│                 ▼                   │                  ▼                    │
│  ┌─────────────────────────────┐   │   ┌─────────────────────────────┐     │
│  │     响应式动态视图           │   │   │     动作执行器               │     │
│  │  Reactive Dynamic View      │   │   │     Action Executor          │     │
│  └──────────────┬──────────────┘   │   └──────────────┬──────────────┘     │
│                 ▼                   │                  ▼                    │
│  ┌─────────────────────────────┐   │   ┌─────────────────────────────┐     │
│  │     ChangeSet 生成           │   │   │     事件记录 + 证据           │     │
│  │     (待确认的变更)            │   │   │     Event + Evidence         │     │
│  └─────────────────────────────┘   │   └─────────────────────────────┘     │
│                                     │                                       │
├─────────────────────────────────────┼───────────────────────────────────────┤
│  用户：业务分析师、设计者            │  用户：操作员、系统、智能体            │
│  目标：定义「是什么」「能做什么」     │  目标：执行「做什么」「做了什么」       │
│  产物：本体、规则、视图、工作流       │  产物：数据变更、事件、证据            │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

### 1.2 关键区别

| 维度 | 构建态 (Design Time) | 运行态 (Runtime) |
|-----|---------------------|-----------------|
| **交互模式** | 自然语言 + 动态视图 | 结构化 API + 固定 UI |
| **核心引擎** | 意图理解引擎 | 门禁引擎 + 执行引擎 |
| **输出产物** | ChangeSet（待确认） | Event + Evidence |
| **确认机制** | 人工确认 + 门禁 | 自动执行（已过门禁） |
| **回滚粒度** | ChangeSet 级别 | 事务级别 |
| **用户画像** | 设计者、分析师 | 操作员、系统 |

### 1.3 为什么必须区分？

```
传统 NocoBase 模式的问题:
┌─────────────────────────────────────────────────────────────┐
│  用户 → 点击菜单 → 填写表单 → 配置选项 → 保存 → 生效        │
│                                                             │
│  问题:                                                      │
│  1. 需要理解技术概念（Collection、Field、Schema）            │
│  2. 操作路径长，认知负担重                                   │
│  3. 无法表达复杂意图（需要拆解成多步操作）                    │
│  4. 变更即时生效，缺乏审核机制                               │
│  5. 无法预览变更影响                                        │
└─────────────────────────────────────────────────────────────┘

ALE AI 原生模式:
┌─────────────────────────────────────────────────────────────┐
│  用户 → 表达意图 → AI 理解 → 动态展示 → 确认 → 生效          │
│                                                             │
│  优势:                                                      │
│  1. 自然语言表达，无需理解技术细节                           │
│  2. AI 自动拆解意图，生成变更方案                            │
│  3. 响应式视图实时展示变更预览                               │
│  4. 变更需确认，有审核机制                                   │
│  5. 可预览影响范围                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 构建态：AI 原生交互架构

### 2.1 核心理念

**彻底颠覆传统低代码的配置式交互，实现：**

1. **意图驱动**：用户表达「想要什么」，而非「如何配置」
2. **响应式动态**：界面根据意图实时生成和调整
3. **渐进式确认**：从意图到方案到变更，逐步确认
4. **可解释可逆**：每个变更都有解释，可撤回

### 2.2 构建态交互流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        构建态交互流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │  1. 意图表达     │  用户："我需要一个延迟订单的处置流程"                    │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  2. 意图理解     │  AI 解析：                                             │
│  │                 │  - 主体：延迟订单                                       │
│  │                 │  - 目标：处置流程                                       │
│  │                 │  - 隐含：状态机、审批、动作                              │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  3. 方案生成     │  AI 生成方案：                                         │
│  │                 │  - 对象定义（处置单）                                   │
│  │                 │  - 状态机（6状态8转换）                                 │
│  │                 │  - 动作定义（分配/审批/执行）                            │
│  │                 │  - UI 视图（列表/详情/表单）                            │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  4. 动态视图     │  实时展示：                                            │
│  │   (响应式渲染)   │  - 对象结构预览                                        │
│  │                 │  - 状态机可视化                                        │
│  │                 │  - UI 效果预览                                         │
│  │                 │  - 影响分析                                            │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  5. 迭代调整     │  用户："风险等级需要分4级，高风险需要主管审批"          │
│  │                 │  AI 调整方案，视图实时更新                              │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  6. 确认生成     │  生成 ChangeSet：                                      │
│  │   ChangeSet     │  - 变更内容                                            │
│  │                 │  - 门禁预检结果                                        │
│  │                 │  - 影响分析                                            │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  7. 审批发布     │  走审批流程 → 门禁检查 → 发布生效                       │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 意图理解引擎

```typescript
/**
 * 意图理解引擎 - 构建态核心
 * 负责将自然语言意图转换为结构化的变更方案
 */
interface IntentUnderstandingEngine {
  // 解析用户意图
  parseIntent(input: IntentInput): Promise<ParsedIntent>;
  
  // 生成变更方案
  generateProposal(intent: ParsedIntent, context: DesignContext): Promise<ChangeProposal>;
  
  // 根据反馈调整方案
  refineProposal(proposal: ChangeProposal, feedback: UserFeedback): Promise<ChangeProposal>;
  
  // 生成 ChangeSet
  toChangeSet(proposal: ChangeProposal): Promise<ChangeSet>;
}

// 意图输入
interface IntentInput {
  type: 'text' | 'voice' | 'multimodal';
  content: string;
  attachments?: Attachment[];  // 截图、文档等
  context?: {
    currentSpace: string;
    currentView: string;
    selectedObjects: string[];
  };
}

// 解析后的意图
interface ParsedIntent {
  // 意图分类
  category: 'create' | 'modify' | 'query' | 'analyze' | 'automate';
  
  // 意图主体
  subjects: IntentSubject[];
  
  // 意图动作
  actions: IntentAction[];
  
  // 约束条件
  constraints: IntentConstraint[];
  
  // 置信度
  confidence: number;
  
  // 需要澄清的点
  clarifications?: ClarificationRequest[];
}

interface IntentSubject {
  type: 'object' | 'relation' | 'flow' | 'view' | 'rule';
  name: string;
  inferred: boolean;  // 是否是推断出来的
  properties?: Record<string, any>;
}

interface IntentAction {
  verb: string;  // create, add, modify, remove, connect...
  target: string;
  parameters?: Record<string, any>;
}

// 变更方案
interface ChangeProposal {
  id: string;
  summary: string;
  
  // 方案组成部分
  components: {
    objects?: ObjectDefinition[];
    relations?: RelationDefinition[];
    flows?: FlowDefinition[];
    views?: ViewDefinition[];
    rules?: RuleDefinition[];
    actions?: ActionDefinition[];
  };
  
  // 可视化预览
  previews: {
    schema?: SchemaPreview;
    stateMachine?: StateMachinePreview;
    ui?: UIPreview;
    dataFlow?: DataFlowPreview;
  };
  
  // 影响分析
  impact: {
    affectedObjects: string[];
    affectedViews: string[];
    affectedFlows: string[];
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
  };
  
  // 门禁预检
  gatePreCheck: {
    G1: GatePreCheckResult;
    G3: GatePreCheckResult;
    G7: GatePreCheckResult;
  };
}
```

### 2.4 响应式动态视图引擎

```typescript
/**
 * 响应式动态视图引擎
 * 根据意图和方案实时生成、更新界面
 */
interface DynamicViewEngine {
  // 根据意图生成视图
  generateView(intent: ParsedIntent): Promise<DynamicView>;
  
  // 根据方案更新视图
  updateView(proposal: ChangeProposal): Promise<DynamicView>;
  
  // 处理用户交互
  handleInteraction(interaction: ViewInteraction): Promise<IntentFeedback>;
}

// 动态视图定义
interface DynamicView {
  id: string;
  type: 'canvas' | 'form' | 'preview' | 'comparison' | 'impact';
  
  // 视图组件（响应式）
  components: ReactiveComponent[];
  
  // 数据绑定
  bindings: DataBinding[];
  
  // 交互处理器
  interactions: InteractionHandler[];
}

// 响应式组件
interface ReactiveComponent {
  id: string;
  type: string;
  
  // 响应式属性（随 proposal 变化而变化）
  props: {
    [key: string]: ReactiveValue;
  };
  
  // 子组件
  children?: ReactiveComponent[];
  
  // 条件渲染
  when?: ReactiveCondition;
}

// 响应式值
interface ReactiveValue<T = any> {
  // 当前值
  value: T;
  
  // 来源（可追溯）
  source: 'intent' | 'proposal' | 'context' | 'computed';
  
  // 依赖
  dependencies?: string[];
  
  // 变更历史
  history?: T[];
}
```

### 2.5 构建态 UI 设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ALE Studio - 构建态工作台                                    [Space: 订单域] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💬 对话区                                                           │   │
│  │                                                                     │   │
│  │  You: 我需要一个延迟订单的处置流程，包含风险评估和审批环节            │   │
│  │                                                                     │   │
│  │  AI: 我理解您需要：                                                 │   │
│  │      ✓ 创建「处置单」对象                                           │   │
│  │      ✓ 设计处置状态机（待处理→已分配→待审批→已审批→执行中→已完成）   │   │
│  │      ✓ 配置风险评估规则                                             │   │
│  │      ✓ 设置审批流程（高风险需主管审批）                              │   │
│  │                                                                     │   │
│  │      请确认或补充需求...                                            │   │
│  │                                                                     │   │
│  │  You: 对，另外需要记录处置证据，方便后续追溯                          │   │
│  │                                                                     │   │
│  │  AI: 已添加「处置证据」对象，关联到处置单。                          │   │
│  │      右侧预览已更新，请查看。                                        │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 输入您的需求...                                    [发送] 🎤 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📐 动态预览区                                          [切换视图 ▼] │   │
│  │                                                                     │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐         │   │
│  │  │ 对象结构    │ 状态机      │ UI 预览     │ 影响分析    │         │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘         │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │   ┌─────────────┐         ┌─────────────┐                  │   │   │
│  │  │   │  处置单     │────────▶│  处置证据   │                  │   │   │
│  │  │   │  ─────────  │ hasMany │  ─────────  │                  │   │   │
│  │  │   │  id         │         │  id         │                  │   │   │
│  │  │   │  order_no   │         │  type       │                  │   │   │
│  │  │   │  status     │         │  content    │                  │   │   │
│  │  │   │  risk_level │         │  source     │                  │   │   │
│  │  │   │  ...        │         │  ...        │                  │   │   │
│  │  │   └─────────────┘         └─────────────┘                  │   │   │
│  │  │                                                             │   │   │
│  │  │   [+ 新增字段]  [+ 新增关系]  [编辑属性]                     │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─ 变更摘要 ──────────────────────────────────────────────────┐   │   │
│  │  │ • 新增对象: 处置单, 处置证据                                 │   │   │
│  │  │ • 新增关系: 处置单 → 处置证据 (hasMany)                      │   │   │
│  │  │ • 门禁预检: G1 ✓  G3 ⚠ (需补充证据模板)  G7 ✓               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                        │   │
│  │  │   继续完善...    │  │  生成 ChangeSet  │                        │   │
│  │  └──────────────────┘  └──────────────────┘                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 运行态：本体驱动执行架构

### 3.1 运行态定位

运行态是**已发布的本体**在实际业务场景中的执行。此时：
- 本体定义已固化（来自已发布的 ChangeSet）
- UI 是确定性的（根据本体生成）
- 操作受门禁约束
- 所有执行产生证据

### 3.2 运行态架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           运行态架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         接入层                                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Web UI  │  │ Mobile  │  │   API   │  │  Agent  │  │ Webhook │   │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼─────────┘   │
│          └────────────┴────────────┼────────────┴────────────┘             │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      运行时控制层                                     │   │
│  │                                                                     │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │  本体解析器  │   │  权限检查   │   │  上下文注入  │               │   │
│  │  │  Ontology   │   │  ACL Check  │   │  Context    │               │   │
│  │  │  Resolver   │   │             │   │  Injection  │               │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │   │
│  │         └─────────────────┼─────────────────┘                       │   │
│  │                           ▼                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    门禁引擎 (Gate Engine)                     │   │   │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │   │   │
│  │  │  │ G1  │ │ G2  │ │ G3  │ │ G4  │ │ G5  │ │ G6  │ │ G7  │   │   │   │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         执行层                                       │   │
│  │                                                                     │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │  动作执行器  │   │  工作流引擎  │   │  写回网关   │               │   │
│  │  │  Action     │   │  Workflow   │   │  Writeback  │               │   │
│  │  │  Executor   │   │  Engine     │   │  Gateway    │               │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │   │
│  │         └─────────────────┼─────────────────┘                       │   │
│  │                           ▼                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    记录层                                     │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │   │
│  │  │  │  事件记录   │  │  证据存储   │  │  审计日志   │          │   │   │
│  │  │  │  Events     │  │  Evidence   │  │  Audit Log  │          │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 运行态 UI 特点

运行态 UI 是**本体驱动的确定性 UI**：

```typescript
// 运行态 UI 生成器
interface RuntimeUIGenerator {
  // 从本体生成列表视图
  generateListView(objectMeta: OntologyObject): ListView;
  
  // 从本体生成详情视图
  generateDetailView(objectMeta: OntologyObject): DetailView;
  
  // 从本体生成表单视图
  generateFormView(objectMeta: OntologyObject, action: 'create' | 'edit'): FormView;
  
  // 从状态机生成工作流视图
  generateFlowView(stateMachine: StateMachine): FlowView;
}

// 运行态视图是静态的（相对于构建态的动态）
interface RuntimeView {
  // 视图定义（来自本体）
  definition: ViewDefinition;
  
  // 数据绑定（来自数据源）
  dataSource: DataSource;
  
  // 动作按钮（来自本体的动作定义）
  actions: ActionButton[];
  
  // 权限控制（来自 ACL）
  permissions: ViewPermissions;
}
```

---

## 4. 双态交互示例

### 4.1 场景：创建延迟订单处置流程

#### 构建态交互

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        构建态交互记录                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [轮次 1] 意图表达                                                          │
│  ────────────────────────────────────────────────────────────────────────  │
│  用户: "我需要管理延迟订单的处置，包括分配给客服、提交方案、主管审批、       │
│         执行处置这些环节"                                                   │
│                                                                             │
│  AI 理解:                                                                   │
│  {                                                                          │
│    "category": "create",                                                    │
│    "subjects": [                                                            │
│      { "type": "object", "name": "处置单", "inferred": false },            │
│      { "type": "flow", "name": "处置流程", "inferred": true }              │
│    ],                                                                       │
│    "actions": [                                                             │
│      { "verb": "assign", "target": "客服" },                               │
│      { "verb": "submit", "target": "方案" },                               │
│      { "verb": "approve", "target": "主管" },                              │
│      { "verb": "execute", "target": "处置" }                               │
│    ],                                                                       │
│    "confidence": 0.92                                                       │
│  }                                                                          │
│                                                                             │
│  AI 响应:                                                                   │
│  "我理解您需要创建一个延迟订单处置流程，包含以下环节：                        │
│   1. 分配给客服处理                                                         │
│   2. 客服提交处置方案                                                       │
│   3. 主管审批方案                                                           │
│   4. 执行处置                                                               │
│                                                                             │
│   我已生成初步方案，请查看右侧预览。您还需要：                                │
│   - 确认处置单需要哪些字段？                                                 │
│   - 是否需要记录处置证据？                                                   │
│   - 审批规则是什么（所有都需要主管审批，还是只有高风险的）？"                  │
│                                                                             │
│  [动态视图更新：显示处置单对象结构、状态机草图]                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [轮次 2] 补充细节                                                          │
│  ────────────────────────────────────────────────────────────────────────  │
│  用户: "处置单要有订单号、延迟原因、延迟天数、风险等级、处置方案这些字段。     │
│         需要记录证据。高风险的需要主管审批，低风险客服可以直接处理。"          │
│                                                                             │
│  AI 理解:                                                                   │
│  - 新增字段定义                                                             │
│  - 新增证据关联                                                             │
│  - 新增审批规则（基于风险等级）                                              │
│                                                                             │
│  AI 响应:                                                                   │
│  "已更新方案：                                                              │
│   ✓ 处置单字段：订单号、延迟原因、延迟天数、风险等级(低/中/高/严重)、         │
│     处置方案、处置结果                                                      │
│   ✓ 新增处置证据对象，与处置单关联                                          │
│   ✓ 审批规则：                                                              │
│     - 低风险：客服直接执行                                                  │
│     - 中/高/严重风险：需主管审批                                            │
│                                                                             │
│   预览已更新。还有什么需要调整的吗？"                                        │
│                                                                             │
│  [动态视图更新：字段列表、状态机增加条件分支、审批规则可视化]                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [轮次 3] 确认生成 ChangeSet                                                │
│  ────────────────────────────────────────────────────────────────────────  │
│  用户: "可以了，生成变更"                                                    │
│                                                                             │
│  AI 响应:                                                                   │
│  "已生成 ChangeSet #CS-2025-001，包含：                                     │
│                                                                             │
│   📦 变更内容：                                                             │
│   • 新增对象：disposal_orders (处置单)                                      │
│   • 新增对象：disposal_evidences (处置证据)                                 │
│   • 新增关系：disposal_orders → disposal_evidences (hasMany)               │
│   • 新增状态机：disposal_state_machine (6状态、10转换)                      │
│   • 新增动作：assign, submitProposal, approve, execute (4个)               │
│   • 新增规则：approval_rule_by_risk (审批规则)                              │
│                                                                             │
│   🔍 门禁预检：                                                             │
│   • G1 结构校验：✓ 通过                                                    │
│   • G3 证据校验：✓ 通过                                                    │
│   • G7 评测校验：✓ 通过                                                    │
│                                                                             │
│   📊 影响分析：                                                             │
│   • 新增 2 个数据表                                                         │
│   • 新增 4 个 API 端点                                                      │
│   • 预计生成 3 个 UI 视图                                                   │
│   • 风险等级：低                                                            │
│                                                                             │
│   [查看详情] [提交审批] [继续编辑]"                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 运行态使用

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  延迟订单处置 - 工作台                              [操作员: 张三] [登出]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 待处理列表                                              [筛选] [刷新] │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 订单号      │ 延迟原因    │ 延迟天数 │ 风险等级 │ 状态     │ 操作   │   │
│  ├─────────────┼─────────────┼──────────┼──────────┼──────────┼────────┤   │
│  │ DO-2025-001 │ 物流延迟    │ 3天      │ 🟡 中    │ 待分配   │ [处理] │   │
│  │ DO-2025-002 │ 缺货        │ 7天      │ 🔴 高    │ 待分配   │ [处理] │   │
│  │ DO-2025-003 │ 支付问题    │ 1天      │ 🟢 低    │ 待分配   │ [处理] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 处置单详情 - DO-2025-002                                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  基本信息                                                           │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │  订单号: DO-2025-002          延迟原因: 缺货                        │   │
│  │  延迟天数: 7天                 风险等级: 🔴 高                       │   │
│  │  当前状态: 待分配              创建时间: 2025-12-22 10:00           │   │
│  │                                                                     │   │
│  │  处置方案                                                           │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │  建议方案: [请选择 ▼]                                               │   │
│  │    • 延期发货                                                       │   │
│  │    • 部分发货                                                       │   │
│  │    • 全额退款                                                       │   │
│  │    • 换货处理                                                       │   │
│  │                                                                     │   │
│  │  处置说明: [                                          ]             │   │
│  │                                                                     │   │
│  │  证据上传                                                           │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │  [+ 上传客户沟通记录]  [+ 上传库存截图]                              │   │
│  │                                                                     │   │
│  │  ⚠️ 门禁提示: 高风险订单，提交后需要主管审批                         │   │
│  │                                                                     │   │
│  │  ┌────────────────┐  ┌────────────────┐                            │   │
│  │  │    取 消       │  │   提交方案 →   │                            │   │
│  │  └────────────────┘  └────────────────┘                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 技术实现要点

### 5.1 构建态核心组件

```typescript
// 1. 意图理解服务
@Service()
class IntentUnderstandingService {
  constructor(
    private llm: LLMProvider,
    private ontologyRegistry: OntologyRegistry,
    private contextManager: ContextManager,
  ) {}

  async parseIntent(input: IntentInput): Promise<ParsedIntent> {
    // 1. 获取上下文
    const context = await this.contextManager.getDesignContext(input.context);
    
    // 2. 构建 Prompt
    const prompt = this.buildIntentPrompt(input, context);
    
    // 3. 调用 LLM
    const response = await this.llm.complete(prompt, {
      responseFormat: 'json',
      schema: ParsedIntentSchema,
    });
    
    // 4. 验证和补充
    return this.validateAndEnrich(response, context);
  }

  async generateProposal(intent: ParsedIntent): Promise<ChangeProposal> {
    // 1. 根据意图生成对象定义
    const objects = await this.generateObjects(intent.subjects);
    
    // 2. 生成关系
    const relations = await this.inferRelations(objects);
    
    // 3. 生成状态机（如果需要）
    const flows = await this.generateFlows(intent.actions);
    
    // 4. 生成视图定义
    const views = await this.generateViews(objects, flows);
    
    // 5. 生成预览
    const previews = await this.generatePreviews({ objects, relations, flows, views });
    
    // 6. 影响分析
    const impact = await this.analyzeImpact({ objects, relations, flows, views });
    
    // 7. 门禁预检
    const gatePreCheck = await this.preCheckGates({ objects, relations, flows, views });
    
    return {
      id: generateId(),
      summary: this.summarizeProposal(intent),
      components: { objects, relations, flows, views },
      previews,
      impact,
      gatePreCheck,
    };
  }
}

// 2. 响应式视图管理器
@Service()
class ReactiveViewManager {
  private viewState: Map<string, ReactiveViewState> = new Map();
  private subscriptions: Map<string, Set<ViewSubscriber>> = new Map();

  // 创建响应式视图
  createReactiveView(proposal: ChangeProposal): ReactiveView {
    const viewId = generateId();
    const state = this.initializeViewState(proposal);
    
    this.viewState.set(viewId, state);
    
    return {
      id: viewId,
      subscribe: (subscriber) => this.subscribe(viewId, subscriber),
      update: (changes) => this.updateView(viewId, changes),
      getSnapshot: () => this.getSnapshot(viewId),
    };
  }

  // 当 Proposal 变化时更新视图
  onProposalChange(viewId: string, proposal: ChangeProposal): void {
    const state = this.viewState.get(viewId);
    if (!state) return;

    // 计算差异
    const diff = this.computeDiff(state.proposal, proposal);
    
    // 更新状态
    state.proposal = proposal;
    state.version++;
    
    // 通知订阅者
    const subscribers = this.subscriptions.get(viewId);
    subscribers?.forEach(sub => sub.onUpdate(diff));
  }
}

// 3. ChangeSet 生成器
@Service()
class ChangeSetGenerator {
  async fromProposal(proposal: ChangeProposal, actor: User): Promise<ChangeSet> {
    // 1. 转换为结构化变更
    const changes = this.convertToChanges(proposal);
    
    // 2. 创建 ChangeSet
    const changeset = await this.changeSetService.create({
      title: proposal.summary,
      type: 'design',
      changes,
      riskLevel: proposal.impact.riskLevel,
      createdBy: actor.id,
      metadata: {
        proposalId: proposal.id,
        generatedFrom: 'intent_understanding',
      },
    });
    
    return changeset;
  }

  private convertToChanges(proposal: ChangeProposal): ChangeSetChanges {
    return {
      objects: proposal.components.objects?.map(o => ({
        action: 'create',
        type: 'object',
        payload: o,
      })),
      relations: proposal.components.relations?.map(r => ({
        action: 'create',
        type: 'relation',
        payload: r,
      })),
      flows: proposal.components.flows?.map(f => ({
        action: 'create',
        type: 'flow',
        payload: f,
      })),
      views: proposal.components.views?.map(v => ({
        action: 'create',
        type: 'view',
        payload: v,
      })),
    };
  }
}
```

### 5.2 构建态前端架构

```typescript
// React 组件架构

// 1. 构建态工作台
const DesignStudio: React.FC = () => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [proposal, setProposal] = useState<ChangeProposal | null>(null);
  const [activePreview, setActivePreview] = useState<PreviewType>('schema');

  // 意图提交处理
  const handleIntentSubmit = async (input: string) => {
    const response = await intentService.parseAndPropose(input);
    setProposal(response.proposal);
    setConversation([...conversation, 
      { role: 'user', content: input },
      { role: 'ai', content: response.message, proposal: response.proposal }
    ]);
  };

  return (
    <DesignStudioLayout>
      {/* 对话区 */}
      <ConversationPanel 
        messages={conversation}
        onSubmit={handleIntentSubmit}
      />
      
      {/* 动态预览区 */}
      <DynamicPreviewPanel
        proposal={proposal}
        activeView={activePreview}
        onViewChange={setActivePreview}
        onProposalEdit={(changes) => handleProposalEdit(changes)}
      />
      
      {/* 变更摘要 */}
      <ChangeSummaryPanel
        proposal={proposal}
        onConfirm={() => handleGenerateChangeSet()}
      />
    </DesignStudioLayout>
  );
};

// 2. 动态预览面板（响应式）
const DynamicPreviewPanel: React.FC<{
  proposal: ChangeProposal | null;
  activeView: PreviewType;
  onProposalEdit: (changes: ProposalChanges) => void;
}> = ({ proposal, activeView, onProposalEdit }) => {
  // 当 proposal 变化时自动更新
  useEffect(() => {
    if (proposal) {
      // 触发预览更新动画
      animatePreviewUpdate();
    }
  }, [proposal]);

  const renderPreview = () => {
    if (!proposal) return <EmptyState />;
    
    switch (activeView) {
      case 'schema':
        return (
          <SchemaPreview 
            objects={proposal.components.objects}
            relations={proposal.components.relations}
            onEdit={onProposalEdit}
            highlightChanges
          />
        );
      case 'stateMachine':
        return (
          <StateMachinePreview
            flows={proposal.components.flows}
            onEdit={onProposalEdit}
            interactive
          />
        );
      case 'ui':
        return (
          <UIPreview
            views={proposal.components.views}
            mockData={generateMockData(proposal)}
          />
        );
      case 'impact':
        return (
          <ImpactAnalysisView
            impact={proposal.impact}
            gatePreCheck={proposal.gatePreCheck}
          />
        );
    }
  };

  return (
    <PreviewContainer>
      <PreviewTabs value={activeView} onChange={setActiveView}>
        <Tab value="schema" label="对象结构" />
        <Tab value="stateMachine" label="状态机" />
        <Tab value="ui" label="UI 预览" />
        <Tab value="impact" label="影响分析" />
      </PreviewTabs>
      
      <PreviewContent>
        {renderPreview()}
      </PreviewContent>
    </PreviewContainer>
  );
};

// 3. 对象结构预览（可编辑）
const SchemaPreview: React.FC<{
  objects: ObjectDefinition[];
  relations: RelationDefinition[];
  onEdit: (changes: ProposalChanges) => void;
  highlightChanges?: boolean;
}> = ({ objects, relations, onEdit, highlightChanges }) => {
  return (
    <ERDiagram>
      {objects.map(obj => (
        <EntityNode 
          key={obj.name}
          entity={obj}
          highlight={highlightChanges && obj.isNew}
          onAddField={() => onEdit({ type: 'add_field', target: obj.name })}
          onEditField={(field) => onEdit({ type: 'edit_field', target: obj.name, field })}
        />
      ))}
      
      {relations.map(rel => (
        <RelationEdge
          key={rel.id}
          relation={rel}
          highlight={highlightChanges && rel.isNew}
        />
      ))}
    </ERDiagram>
  );
};
```

### 5.3 运行态 UI 生成

```typescript
// 运行态 UI 从本体自动生成

class RuntimeUIGenerator {
  // 从本体生成列表视图
  generateListView(objectMeta: OntologyObject): ListView {
    const columns = this.inferListColumns(objectMeta);
    const actions = this.getListActions(objectMeta);
    const filters = this.generateFilters(objectMeta);

    return {
      type: 'list',
      collection: objectMeta.collectionName,
      columns,
      actions,
      filters,
      pagination: { defaultPageSize: 20 },
    };
  }

  // 从本体生成表单视图
  generateFormView(objectMeta: OntologyObject, action: 'create' | 'edit'): FormView {
    const fields = this.inferFormFields(objectMeta, action);
    const validations = this.generateValidations(objectMeta);
    const layout = this.inferFormLayout(fields);

    return {
      type: 'form',
      collection: objectMeta.collectionName,
      action,
      fields,
      validations,
      layout,
    };
  }

  // 推断列表列
  private inferListColumns(objectMeta: OntologyObject): Column[] {
    return objectMeta.fields
      .filter(f => this.isListVisible(f))
      .map(f => ({
        name: f.name,
        title: f.displayName || f.name,
        type: this.mapFieldToColumnType(f.type),
        sortable: this.isSortable(f),
        width: this.inferColumnWidth(f),
      }));
  }

  // 获取列表动作（从本体的动作定义）
  private getListActions(objectMeta: OntologyObject): ListAction[] {
    const actions = objectMeta.actions || [];
    
    return actions
      .filter(a => a.scope === 'record')
      .map(a => ({
        name: a.name,
        label: a.displayName,
        icon: a.icon,
        // 权限控制
        visible: `{{$acl.check('${objectMeta.collectionName}', '${a.name}')}}`,
        // 门禁检查
        beforeExecute: a.gateRequired ? 
          `{{$gates.check('${a.gateRequired.join(',')}')}}` : 
          undefined,
      }));
  }
}
```

---

## 6. 双态协作机制

### 6.1 从构建态到运行态

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    构建态 → 运行态 发布流程                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │ ChangeSet   │     │ 门禁检查    │     │   审批      │                   │
│  │ (构建态产物) │────▶│ G1-G7       │────▶│             │                   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                  │                          │
│                            ┌─────────────────────┘                          │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        发布处理器                                     │   │
│  │                                                                     │   │
│  │  1. 应用 Schema 变更                                                 │   │
│  │     └─ 创建/修改表结构                                               │   │
│  │     └─ 更新本体注册表                                                │   │
│  │                                                                     │   │
│  │  2. 注册动作和规则                                                   │   │
│  │     └─ 注册 Actions 到行为注册表                                     │   │
│  │     └─ 配置门禁规则                                                 │   │
│  │     └─ 绑定工作流                                                   │   │
│  │                                                                     │   │
│  │  3. 生成运行态 UI                                                   │   │
│  │     └─ 生成列表/详情/表单视图                                        │   │
│  │     └─ 配置菜单入口                                                 │   │
│  │     └─ 设置权限                                                     │   │
│  │                                                                     │   │
│  │  4. 版本标记                                                        │   │
│  │     └─ 记录版本号                                                   │   │
│  │     └─ 保存快照                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                            │                                                │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      运行态生效                                       │   │
│  │                                                                     │   │
│  │  • 新的对象/关系可用                                                 │   │
│  │  • 新的 API 端点可调用                                               │   │
│  │  • 新的 UI 视图可访问                                                │   │
│  │  • 门禁规则生效                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 从运行态到构建态

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    运行态 → 构建态 反馈机制                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  运行态数据                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • 门禁失败记录                                                      │   │
│  │  • 用户操作日志                                                      │   │
│  │  • 性能指标                                                          │   │
│  │  • 异常事件                                                          │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      分析引擎                                         │   │
│  │                                                                     │   │
│  │  • 门禁失败模式分析 → 规则优化建议                                    │   │
│  │  • 高频操作路径 → UI 优化建议                                        │   │
│  │  • 性能瓶颈 → 索引/缓存建议                                          │   │
│  │  • 异常模式 → 风险预警                                               │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    构建态改进提案                                      │   │
│  │                                                                     │   │
│  │  AI: "基于运行态数据分析，我建议：                                    │   │
│  │       1. G3 证据校验过严，建议放宽低风险订单的证据要求                 │   │
│  │       2. 审批环节平均耗时 4 小时，建议增加自动审批规则                 │   │
│  │       3. 90% 的处置选择'延期发货'，可考虑设为默认选项                 │   │
│  │                                                                     │   │
│  │       是否需要我生成改进方案？"                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 关键设计原则

### 7.1 构建态原则

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          构建态设计原则                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 意图优先 (Intent First)                                                 │
│     ────────────────────────────────────────────────────────────────────   │
│     • 用户表达「想要什么」，不是「怎么配置」                                  │
│     • AI 负责理解意图，转换为技术方案                                        │
│     • 用户可以用业务语言描述需求                                            │
│                                                                             │
│  2. 响应式反馈 (Reactive Feedback)                                          │
│     ────────────────────────────────────────────────────────────────────   │
│     • 每次意图表达后立即展示变更预览                                         │
│     • 视图实时反映方案变化                                                  │
│     • 提供多维度预览（结构/流程/UI/影响）                                   │
│                                                                             │
│  3. 渐进确认 (Progressive Confirmation)                                     │
│     ────────────────────────────────────────────────────────────────────   │
│     • 从意图 → 方案 → ChangeSet，逐步确认                                   │
│     • 允许在任何阶段修改和回退                                              │
│     • 最终确认前可无限次调整                                                │
│                                                                             │
│  4. 可解释性 (Explainability)                                               │
│     ────────────────────────────────────────────────────────────────────   │
│     • AI 的每个决策都可追溯                                                 │
│     • 展示为什么这样设计                                                    │
│     • 提供替代方案供选择                                                    │
│                                                                             │
│  5. 门禁前移 (Gate Left-Shift)                                              │
│     ────────────────────────────────────────────────────────────────────   │
│     • 在设计阶段就进行门禁预检                                              │
│     • 尽早发现问题，降低返工成本                                            │
│     • 提供修复建议                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 运行态原则

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          运行态设计原则                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 本体驱动 (Ontology-Driven)                                              │
│     ────────────────────────────────────────────────────────────────────   │
│     • 所有行为由本体定义约束                                                │
│     • UI/API/规则从本体派生                                                 │
│     • 运行时不允许绕过本体                                                  │
│                                                                             │
│  2. 门禁保障 (Gate-Guarded)                                                 │
│     ────────────────────────────────────────────────────────────────────   │
│     • 每个操作都经过门禁检查                                                │
│     • 门禁结果决定执行/拦截/审批                                            │
│     • 门禁不可绕过                                                          │
│                                                                             │
│  3. 证据完整 (Evidence Complete)                                            │
│     ────────────────────────────────────────────────────────────────────   │
│     • 每个操作产生证据                                                      │
│     • 证据可追溯、可引用                                                    │
│     • 支持事后审计                                                          │
│                                                                             │
│  4. 确定性执行 (Deterministic Execution)                                    │
│     ────────────────────────────────────────────────────────────────────   │
│     • 相同输入产生相同结果                                                  │
│     • 状态转换遵循状态机                                                    │
│     • 可重放、可回溯                                                        │
│                                                                             │
│  5. 性能优先 (Performance First)                                            │
│     ────────────────────────────────────────────────────────────────────   │
│     • 运行态不做复杂推理                                                    │
│     • 规则已编译为确定性逻辑                                                │
│     • 缓存已生成的 UI 和规则                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 实施路线更新

### 8.1 MVP 重新定义

```
MVP 必须交付的构建态能力:
├── 意图理解引擎 (基础版)
│   ├── 对象/字段意图识别
│   ├── 状态机意图识别
│   └── 基础动作意图识别
│
├── 响应式动态视图
│   ├── 对象结构预览
│   ├── 状态机预览
│   └── 变更摘要
│
└── ChangeSet 生成
    ├── 从方案生成 ChangeSet
    └── 门禁预检

MVP 必须交付的运行态能力:
├── 本体驱动 UI 生成
│   ├── 列表视图
│   ├── 表单视图
│   └── 详情视图
│
├── 门禁引擎 (G1/G3/G6/G7)
│
└── 动作执行 + 审计
```

### 8.2 调整后的排期

```
Week 1-2: 意图理解引擎
├── LLM 集成
├── 意图解析
├── 方案生成
└── 单元测试

Week 3-4: 响应式视图引擎
├── 动态视图框架
├── 预览组件
├── 实时更新机制
└── 前端集成

Week 5-6: 运行态生成
├── UI 生成器
├── API 生成器
├── 发布流程
└── 端到端测试
```

---

**文档状态**：核心设计  
**最后更新**：2025年12月  
**关键变更**：明确构建态/运行态分离，强调构建态 AI 原生交互
