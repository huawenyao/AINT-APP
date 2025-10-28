# AI Native Apps 项目配置

## 语言设置

**重要**: 所有与spec-kit工作流相关的交互必须使用中文（简体中文）进行。

### 适用范围

当执行以下slash命令时，必须使用中文对话：
- `/speckit.constitution` - 项目宪章管理
- `/speckit.specify` - 功能规格说明
- `/speckit.plan` - 实施计划
- `/speckit.tasks` - 任务生成
- `/speckit.implement` - 功能实现
- `/speckit.clarify` - 需求澄清
- `/speckit.checklist` - 检查清单生成
- `/speckit.analyze` - 跨构件分析

### 中文对话要求

1. **用户交互**: 所有提问、说明、报告都使用中文
2. **文档生成**: 生成的markdown文档内容使用中文（除了代码和技术术语）
3. **错误信息**: 错误提示和警告信息使用中文
4. **进度反馈**: 任务进度和状态更新使用中文

### 例外情况

以下内容仍使用英文：
- 代码（变量名、函数名、类名等）
- Git commit消息（保持英文以符合国际惯例）
- 技术专有名词（如：Universal Object、Agent、Constitution等，但需在首次出现时提供中文解释）
- 文件路径和命令

## 项目上下文

本项目是将NocoBase改造为AI原生应用平台的创新项目，核心理念：
- 一切皆对象（Universal Object Model）
- Agent执行能力（每个对象都具备AI智能）
- 自然语言交互（用户通过自然语言描述需求）

## 工作原则

遵循项目宪章（.specify/memory/constitution.md）定义的5大原则：
1. 产品创意优先
2. 内在逻辑与一致性
3. 交互设计卓越
4. 技术方案恰当性
5. 完整实现闭环
