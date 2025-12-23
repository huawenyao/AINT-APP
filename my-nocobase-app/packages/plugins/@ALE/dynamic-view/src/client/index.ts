/**
 * @ALE/dynamic-view - Client Entry
 */

export { ChatInterface } from './components/ChatInterface';
export { ProposalPreview } from './components/ProposalPreview';
export { SchemaGraph } from './components/SchemaGraph';
export { StateMachineGraph } from './components/StateMachineGraph';
export { ImpactAnalysis } from './components/ImpactAnalysis';
export { GatePreCheck } from './components/GatePreCheck';
export { ALEStudio } from './components/ALEStudio';

// 导出类型
export type {
  IntentInput,
  ConversationMessage,
  ChangeProposal,
  SchemaPreview,
  StateMachinePreview,
  ImpactAnalysis,
  GatePreCheckResults,
} from '@ALE/core';
