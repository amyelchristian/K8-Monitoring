export interface SwarmEvent {
  id: number;
  timestamp: string;
  type: string;
  agent: string;
  content: string;
  command?: string;
  action?: string;
  target?: string;
  reason?: string;
  approved?: boolean;
  risk_level?: string;
  total_heal_time?: string | number;
  metric?: string;
  pod?: string;
  severity?: string;
  model?: string;
  provider?: string;
}

export interface PodMetrics {
  cpu: number;            // % of limit
  memory: number;         // MiB
  restarts: number;
  pod_name: string;
  tcpRetransmits?: number;
}

export interface AiConfig {
  has_api_key: boolean;
  provider: string;
  model: string;
  mode: string;
}

export interface Heal {
  id: number;
  time: string;           // HH:MM:SS
  seconds: number;        // total heal time
  pod: string;
  metric: string;
  fast: boolean;          // fast path vs LLM
}

export interface Series { t: number; v: number }

export interface Toast {
  id: number;
  kind: 'crit' | 'fast' | 'ok' | 'warn' | 'llm';
  icon: string;
  text: string;
}

export type AgentStatus =
  | 'idle' | 'thinking' | 'decided' | 'reviewing' | 'approved' | 'blocked' | 'firing' | 'complete';

export interface AgentState {
  planner: AgentStatus;
  evaluator: AgentStatus;
  executor: AgentStatus;
  lastDecision: string;
  lastReason: string;
  lastCommand: string;
  riskLevel: string;
  fastPath: boolean;
  plannerCount: number;
  llmCount: number;
}

export type PipelineStage = 'idle' | 'snitch' | 'brain' | 'swarm' | 'healed';
