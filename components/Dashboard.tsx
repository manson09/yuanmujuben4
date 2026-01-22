
import React, { useState } from 'react';
import { Project, PolishProject } from '../types';

interface DashboardProps {
  projects: Project[];
  polishProjects: PolishProject[];
  onCreateProject: (name: string) => void;
  onCreatePolish: (name: string) => void;
  onOpenProject: (id: string) => void;
  onOpenPolish: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  polishProjects, 
  onCreateProject, 
  onCreatePolish,
  onOpenProject,
  onOpenPolish 
}) => {
  const [newProjName, setNewProjName] = useState('');
  const [showModal, setShowModal] = useState<'script' | 'polish' | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">灵感剧阵 <span className="text-teal-600">Matrix</span></h1>
        <p className="text-slate-500 mt-2 text-lg">专业级动漫爽剧创作引擎 & 智能精修工作台</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Section 1: Script Creation */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </span>
              剧本创作中心
            </h2>
            <button 
              onClick={() => setShowModal('script')}
              className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition shadow-lg shadow-teal-200"
            >
              + 新建作品
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400">
                暂无作品，开启你的第一个爽剧剧本
              </div>
            ) : projects.map(p => (
              <div 
                key={p.id}
                onClick={() => onOpenProject(p.id)}
                className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-teal-600">{p.name}</h3>
                <div className="mt-4 flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded ${p.mode === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {p.mode === 'male' ? '男频' : '女频'}
                  </span>
                  <span className="text-xs text-slate-400">更新于 {new Date(p.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Polishing Center */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              脚本润色实验室
            </h2>
            <button 
              onClick={() => setShowModal('polish')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              + 启动实验室
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {polishProjects.length === 0 ? (
              <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400">
                暂无润色任务，导入剧本进行AI去化
              </div>
            ) : polishProjects.map(p => (
              <div 
                key={p.id}
                onClick={() => onOpenPolish(p.id)}
                className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-2">包含 {p.items.length} 个润色片段</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for Creating New */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">
              {showModal === 'script' ? '新建创作作品' : '新建润色实验室'}
            </h3>
            <input 
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none mb-6"
              placeholder="请输入名称..."
              value={newProjName}
              onChange={e => setNewProjName(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setShowModal(null); setNewProjName(''); }}
                className="px-6 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  if (newProjName) {
                    showModal === 'script' ? onCreateProject(newProjName) : onCreatePolish(newProjName);
                    setShowModal(null);
                    setNewProjName('');
                  }
                }}
                className={`px-6 py-2 text-white font-medium rounded-lg transition ${showModal === 'script' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                立即开启
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
