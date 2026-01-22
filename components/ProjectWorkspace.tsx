
import React, { useState } from 'react';
import { Project, SubModule, FileItem } from '../types';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import OutlineModule from './OutlineModule';
import ScriptModule from './ScriptModule';

interface ProjectWorkspaceProps {
  project: Project;
  onSave: (p: Project) => void;
  onBack: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<SubModule>('kb');

  const updateFiles = (files: FileItem[]) => {
    onSave({ ...project, knowledgeBase: files, lastModified: Date.now() });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
          <select 
            className="bg-slate-100 px-2 py-1 rounded text-sm font-medium text-slate-600 border-none cursor-pointer"
            value={project.mode}
            onChange={(e) => onSave({ ...project, mode: e.target.value as 'male' | 'female' })}
          >
            <option value="male">男频模式</option>
            <option value="female">女频模式</option>
          </select>
        </div>
        <div className="flex gap-2">
          {['kb', 'outline', 'script'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as SubModule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {tab === 'kb' ? '知识库' : tab === 'outline' ? '剧本大纲' : '剧情脚本'}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'kb' && (
          <KnowledgeBaseManager 
            files={project.knowledgeBase} 
            onUpdate={updateFiles} 
          />
        )}
        
        {activeTab === 'outline' && (
          <OutlineModule 
            project={project}
            onUpdate={(updated) => onSave({ ...updated, lastModified: Date.now() })}
          />
        )}

        {activeTab === 'script' && (
          <ScriptModule 
            project={project}
            onUpdate={(updated) => onSave({ ...updated, lastModified: Date.now() })}
          />
        )}
      </main>
    </div>
  );
};

export default ProjectWorkspace;
