
export interface FileItem {
  id: string;
  name: string;
  content: string;
  type: 'novel' | 'format' | 'style' | 'generic';
  timestamp: number;
}

export interface PhasePlan {
  phaseIndex: number;
  episodesRange: string;
  chaptersRange: string; // 新增：对应原著的章节范围
  keyPoints: string;
  summary?: string;
}

export interface Episode {
  index: number;
  title: string;
  content: string;
  conflicts: string[];
}

export interface PhaseContent {
  phaseIndex: number;
  episodes: Episode[];
  summary: string;
  fullText: string;
}

export interface Project {
  id: string;
  name: string;
  mode: 'male' | 'female';
  knowledgeBase: FileItem[];
  outline?: string;
  phasePlans: PhasePlan[];
  phases: PhaseContent[];
  lastModified: number;
}

export interface PolishProject {
  id: string;
  name: string;
  knowledgeBase: FileItem[];
  items: { id: string; original: string; polished: string; timestamp: number }[];
}

export type ViewState = 'main' | 'project-detail' | 'polish-center';
export type SubModule = 'outline' | 'script' | 'kb';
