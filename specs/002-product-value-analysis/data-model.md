# Data Model: 价值定位分析文档结构

**Feature**: 002-product-value-analysis
**Date**: 2025-10-27
**Purpose**: 定义价值定位分析文档的模块结构、信息架构和内容组织

## Document Structure Overview

价值定位分析文档采用模块化结构,每个模块独立交付价值,同时形成完整的价值论证体系。

```
value-analysis.md (主文档)
├── 1. Executive Summary (执行摘要)
├── 2. Value Proposition Framework (价值主张框架)
├── 3. Competitive Analysis (竞品对比分析)
├── 4. Value Quantification (价值量化)
├── 5. Market Positioning (市场定位)
└── 6. Customer Value Mapping (客户价值映射)
```

## Module 1: Executive Summary (执行摘要)

### Purpose
一页纸快速概览,支持投资人和高层决策者在3-5分钟内理解核心价值。

### Key Entities

**ExecutiveSummary**:
- `product_name`: string - 产品名称
- `tagline`: string - 一句话价值主张
- `target_customers`: string[] - 目标客户列表
- `core_differentiators`: string[] - 三大核心差异化优势
- `key_metrics`: ValueMetric[] - 关键价值指标
- `market_opportunity`: string - 市场机会描述

**ValueMetric**:
- `metric_name`: string - 指标名称(如"开发周期缩短")
- `baseline`: string - 基线值(如"6-12个月")
- `target`: string - 目标值(如"1-1.5个月")
- `improvement`: string - 改进幅度(如"缩短至20%")

### Content Requirements
- 长度: 不超过1页(A4纸)
- 语言: 非技术语言,业务价值导向
- 视觉: 包含关键指标的对比图表

### Validation Rules
- `tagline` 不超过30字
- `core_differentiators` 必须恰好3个
- `key_metrics` 至少3个,不超过5个
- 所有量化指标必须有明确来源(research.md)

---

## Module 2: Value Proposition Framework (价值主张框架)

### Purpose
系统性阐述产品为谁解决什么问题,如何解决,为什么独特。

### Key Entities

**ValueProposition**:
- `target_segment`: CustomerSegment - 目标客户细分
- `customer_jobs`: string[] - 客户要完成的任务
- `pains`: Pain[] - 客户痛点列表
- `gains`: Gain[] - 客户期望收益
- `pain_relievers`: string[] - 痛点解决方案
- `gain_creators`: string[] - 收益创造方式
- `products_services`: string[] - 产品和服务

**CustomerSegment**:
- `segment_name`: string - 客户细分名称
- `organization_size`: string - 组织规模(如"500人以上企业")
- `roles`: string[] - 关键角色(如"CIO/CTO/IT总监")
- `key_characteristics`: string[] - 关键特征
- `budget_range`: string - 预算范围

**Pain**:
- `pain_description`: string - 痛点描述
- `severity`: enum["critical", "major", "moderate"] - 严重程度
- `frequency`: enum["always", "often", "sometimes"] - 发生频率
- `current_solution`: string - 当前解决方案及其不足

**Gain**:
- `gain_description`: string - 期望收益描述
- `importance`: enum["must-have", "nice-to-have"] - 重要性
- `measurability`: string - 如何衡量

### Content Requirements
- 使用Value Proposition Canvas框架
- 针对两类客户(企业IT部门/系统集成商)分别阐述
- 每个痛点都有对应的pain_reliever
- 每个收益都有对应的gain_creator

### Validation Rules
- 至少定义2个CustomerSegment(企业IT/系统集成商)
- 每个CustomerSegment至少3个Pain
- Pain的severity必须有合理分布(不能全是critical)
- 所有Pain必须基于真实客户访谈或合理推断

---

## Module 3: Competitive Analysis (竞品对比分析)

### Purpose
系统性对比竞争对手,凸显差异化优势,支撑"为什么选择我们"的论述。

### Key Entities

**CompetitiveMatrix**:
- `competitors`: Competitor[] - 竞争对手列表
- `comparison_dimensions`: Dimension[] - 对比维度列表
- `matrix_data`: ComparisonCell[][] - 对比矩阵数据

**Competitor**:
- `competitor_id`: string - 竞争对手ID
- `name`: string - 名称
- `category`: enum["traditional-lowcode", "chinese-lowcode", "ai-coding", "custom-dev", "reference"] - 类别
- `representative_products`: string[] - 代表性产品
- `core_interaction_model`: string - 核心交互模式
- `key_limitations`: string[] - 关键局限性
- `target_customers`: string - 目标客户群体
- `pricing_range`: string - 大致定价范围(如可获取)

**Dimension**:
- `dimension_id`: string - 维度ID
- `name`: string - 维度名称(如"开发效率")
- `description`: string - 维度描述
- `measurement`: string - 如何衡量

**ComparisonCell**:
- `competitor_id`: string - 竞争对手ID
- `dimension_id`: string - 维度ID
- `score`: enum["excellent", "good", "fair", "poor"] - 评分
- `rationale`: string - 评分理由
- `evidence`: string - 支撑证据(来源)

**WhyChooseUs**:
- `competitor_category`: string - 竞争对手类别
- `key_differences`: string[] - 关键差异点(至少3个)
- `scenarios`: Scenario[] - 实际场景示例

**Scenario**:
- `scenario_description`: string - 场景描述
- `competitor_approach`: string - 竞争对手方法及不足
- `our_approach`: string - 我们的方法及优势
- `outcome_difference`: string - 结果差异

### Content Requirements
- 5个竞争对手类别,每类至少1个代表性竞争对手
- 7个对比维度(开发效率、学习成本、灵活性、可维护性、适用场景、技术门槛、AI能力深度)
- 每个类别都有WhyChooseUs论述
- 至少2个Scenario示例

### Validation Rules
- Competitor.category 必须来自预定义枚举
- 每个Competitor至少有2个key_limitations
- ComparisonCell.rationale 不能为空
- ComparisonCell.evidence 必须注明来源(research.md或公开资料)

---

## Module 4: Value Quantification (价值量化)

### Purpose
通过量化指标和实际案例计算,证明价值主张的真实性和可信度。

### Key Entities

**ValueMetrics**:
- `metrics`: QuantifiableMetric[] - 可量化指标列表
- `calculation_cases`: CalculationCase[] - 价值计算案例

**QuantifiableMetric**:
- `metric_id`: string - 指标ID
- `metric_name`: string - 指标名称(如"开发时间缩短比例")
- `baseline_value`: string - 基线值(传统方式)
- `target_value`: string - 目标值(AI原生平台)
- `improvement`: string - 改进幅度
- `unit`: string - 单位(如"月"、"万元"、"小时")
- `calculation_method`: string - 计算方法描述
- `data_source`: string - 数据来源
- `confidence_level`: enum["high", "medium", "estimated"] - 置信度
- `assumptions`: string[] - 关键假设

**CalculationCase**:
- `case_id`: string - 案例ID
- `case_name`: string - 案例名称(如"中型CRM系统开发")
- `scope_description`: string - 范围描述
- `traditional_approach`: ApproachBreakdown - 传统方式详细分解
- `ai_platform_approach`: ApproachBreakdown - AI平台方式详细分解
- `comparison_summary`: ComparisonSummary - 对比总结

**ApproachBreakdown**:
- `phases`: Phase[] - 阶段列表
- `total_duration`: string - 总时长
- `total_cost`: number - 总成本(元)
- `team_composition`: TeamMember[] - 团队组成

**Phase**:
- `phase_name`: string - 阶段名称
- `duration`: string - 时长
- `activities`: string[] - 主要活动
- `cost`: number - 成本(元)

**TeamMember**:
- `role`: string - 角色(如"项目经理"、"开发工程师")
- `count`: number - 人数
- `duration`: string - 参与时长
- `monthly_cost`: number - 月成本(元/月)

**ComparisonSummary**:
- `time_saved`: string - 节省时间
- `cost_saved`: number - 节省成本(元)
- `cost_reduction_percentage`: string - 成本降低比例
- `roi`: string - 投资回报率(如适用)

**ValueRealizationConditions**:
- `conditions`: Condition[] - 价值实现前提条件

**Condition**:
- `condition_description`: string - 条件描述
- `importance`: enum["critical", "important", "helpful"] - 重要性
- `mitigation`: string - 如何确保该条件满足

### Content Requirements
- 至少4个QuantifiableMetric
- 至少1个完整的CalculationCase(推荐中型CRM系统)
- 所有指标的confidence_level和assumptions必须明确
- ValueRealizationConditions必须诚实说明

### Validation Rules
- 所有量化指标误差范围±30%以内
- CalculationCase的成本计算必须有详细分解(Phase和TeamMember)
- 不得虚构数据,所有数据必须可追溯到research.md或合理估算
- assumptions不能为空

---

## Module 5: Market Positioning (市场定位)

### Purpose
明确产品在市场中的独特位置,定义新市场类别,建立品牌叙事。

### Key Entities

**MarketCategory**:
- `category_name`: string - 类别名称(如"AI原生应用平台")
- `category_definition`: string - 类别定义
- `evolution_path`: EvolutionStage[] - 演进路径
- `why_new_category`: string - 为什么定义新类别

**EvolutionStage**:
- `stage_name`: string - 阶段名称(如"传统开发"、"低代码平台")
- `time_period`: string - 时间段
- `characteristics`: string[] - 特征
- `efficiency`: string - 效率指标(相对基线)

**PositioningStatement**:
- `target_audience`: string - 目标受众(For...)
- `need`: string - 需求描述(Who...)
- `product_type`: string - 产品类型(Our product is...)
- `key_benefit`: string - 关键收益(That...)
- `competitive_alternative`: string - 竞争替代品(Unlike...)
- `unique_differentiator`: string - 独特差异(Our product...)

**BrandNarrative**:
- `core_narrative`: string - 核心叙事
- `problem_statement`: string - 问题识别
- `solution`: string - 解决方案
- `innovation`: string - 技术创新
- `vision`: string - 未来愿景
- `vs_competitors`: VsCompetitor[] - 区别于竞争对手的叙事重点

**VsCompetitor**:
- `competitor_type`: string - 竞争对手类型
- `their_narrative`: string - 他们的叙事
- `our_narrative`: string - 我们的叙事
- `key_contrast`: string - 关键对比

### Content Requirements
- 清晰的MarketCategory定义
- 完整的PositioningStatement(覆盖所有6个要素)
- BrandNarrative包含完整故事线
- 至少3个VsCompetitor(传统低代码/AI辅助工具/定制开发)

### Validation Rules
- PositioningStatement不能有空字段
- BrandNarrative避免技术术语,使用业务语言
- category_name必须简洁有力(不超过10字)

---

## Module 6: Customer Value Mapping (客户价值映射)

### Purpose
针对不同客户类型,定制化阐述价值主张、决策因素和价值实现路径。

### Key Entities

**CustomerTypeValueMap**:
- `customer_type`: CustomerType - 客户类型
- `value_proposition_customized`: string - 定制化价值主张
- `decision_factors`: DecisionFactor[] - 决策因素列表(排序)
- `value_realization_path`: ValueRealizationMilestone[] - 价值实现路径

**CustomerType**:
- `type_id`: string - 类型ID(如"enterprise-it"、"system-integrator")
- `type_name`: string - 类型名称
- `persona`: PersonaProfile - 客户画像
- `core_kpis`: string[] - 核心KPI
- `pain_priorities`: string[] - 痛点优先级排序

**PersonaProfile**:
- `organization_size`: string - 组织规模
- `roles`: string[] - 关键角色
- `technical_maturity`: enum["low", "medium", "high"] - 技术成熟度
- `budget_authority`: string - 预算权限
- `decision_timeline`: string - 决策周期

**DecisionFactor**:
- `factor_name`: string - 决策因素名称(如"成本节约ROI")
- `importance_rank`: number - 重要性排名(1=最重要)
- `how_we_address`: string - 我们如何满足
- `evidence`: string - 支撑证据

**ValueRealizationMilestone**:
- `milestone_name`: string - 里程碑名称
- `timeframe`: string - 时间框架(如"Month 1"、"Month 3")
- `key_activities`: string[] - 关键活动
- `expected_outcomes`: string[] - 预期成果
- `success_metrics`: string[] - 成功指标

**UnsuitableScenarios**:
- `scenarios`: UnsuitableScenario[] - 不适合场景列表

**UnsuitableScenario**:
- `scenario_description`: string - 场景描述
- `reason`: string - 不适合原因
- `recommendation`: string - 建议方案

### Content Requirements
- 针对2类客户(企业IT部门/系统集成商)完整映射
- 每类客户至少4个DecisionFactor(排序)
- 每类客户的ValueRealizationPath至少4个Milestone
- UnsuitableScenarios至少4个场景

### Validation Rules
- DecisionFactor.importance_rank必须连续且无重复
- ValueRealizationMilestone按时间顺序排列
- UnsuitableScenarios必须诚实说明,不能为空

---

## Information Architecture

### Document Flow
```
读者进入 → Executive Summary (3分钟快速理解)
         ↓
   感兴趣 → Value Proposition (理解为谁解决什么问题)
         ↓
   质疑"为什么不用现有方案" → Competitive Analysis (看竞品对比)
         ↓
   质疑"价值是否真实" → Value Quantification (看量化证明)
         ↓
   认同价值 → Market Positioning (理解市场定位和品牌)
         ↓
   决策评估 → Customer Value Mapping (找到适合自己的价值路径)
```

### Cross-Module References

**价值主张 → 竞品对比**:
- 价值主张中的差异化优势在竞品对比中详细展开

**竞品对比 → 价值量化**:
- 竞品对比中的效率对比在价值量化中用数据证明

**价值量化 → 客户价值映射**:
- 价值量化的指标在客户价值映射中按客户类型细分

**市场定位 → 价值主张**:
- 市场定位的PositioningStatement呼应价值主张

---

## Data Integrity Rules

### Source Traceability
所有技术能力描述必须可追溯到:
- `PROJECT_SUMMARY.md` (已实现功能)
- `AI_NATIVE_PLATFORM_DESIGN.md` (架构设计)

所有市场数据必须注明来源:
- `research.md` (研究发现)
- 公开资料(竞品官网、行业报告)
- 客户访谈(如已进行)
- 合理估算(标注confidence_level)

### Consistency Requirements

1. **指标一致性**: 同一指标(如"开发时间缩短20%")在所有模块中必须一致
2. **竞争对手一致性**: 竞争对手的描述在不同模块中必须一致
3. **客户类型一致性**: 客户类型定义和痛点描述在所有模块中必须一致

### Validation Checklist

- [ ] 所有QuantifiableMetric都有data_source和assumptions
- [ ] 所有ComparisonCell都有rationale和evidence
- [ ] ExecutiveSummary的key_metrics与ValueQuantification模块一致
- [ ] CustomerValueMapping的pain_priorities与ValueProposition的pains对应
- [ ] UnsuitableScenarios诚实说明,不回避局限性

---

## Implementation Notes

### Document Generation Workflow
1. 基于research.md填充各模块的核心实体
2. 确保跨模块引用的数据一致性
3. 为每个模块生成独立的contract验收标准
4. 最终生成完整的value-analysis.md文档

### Quality Gates
- **逻辑一致性检查**: 同一概念在不同模块的描述必须一致
- **数据可追溯性检查**: 所有量化指标和竞品信息必须有来源
- **真实性检查**: 技术能力描述不得超出PROJECT_SUMMARY.md/AI_NATIVE_PLATFORM_DESIGN.md的范围
- **可信度检查**: 价值量化的confidence_level和assumptions合理

---

**Data Model Definition Complete** - 准备生成Module Contracts
