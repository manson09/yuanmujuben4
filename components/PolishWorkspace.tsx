
import React, { useState } from 'react';
import { PolishProject, FileItem } from '../types';
import { polishScript } from '../services/gemini';
import KnowledgeBaseManager from './KnowledgeBaseManager';

interface PolishWorkspaceProps {
  project: PolishProject;
  onSave: (p: PolishProject) => void;
  onBack: () => void;
}

const PolishWorkspace: React.FC<PolishWorkspaceProps> = ({ project, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'kb' | 'process'>('kb');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePolish = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const kbContext = project.knowledgeBase.map(f => f.content).join('\n\n');
      const result = await polishScript(inputText, kbContext);
      
      const newItem = {
        id: Date.now().toString(),
        original: inputText,
        polished: result,
        timestamp: Date.now()
      };
      
      onSave({ ...project, items: [newItem, ...project.items] });
      setInputText('');
      setActiveTab('process');
    } catch (err) {
      alert("润色失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <nav className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-none">{project.name}</h2>
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">润色实验室 / AI-De-Logic Lab</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('kb')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'kb' ? 'bg-white text-indigo-900' : 'hover:bg-white/10'}`}
          >
            独立知识库
          </button>
          <button 
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'process' ? 'bg-white text-indigo-900' : 'hover:bg-white/10'}`}
          >
            去AI化作业
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'kb' && (
          <KnowledgeBaseManager 
            files={project.knowledgeBase} 
            onUpdate={(files) => onSave({ ...project, knowledgeBase: files })} 
          />
        )}

        {activeTab === 'process' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Input & Execution */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">待处理脚本片段</span>
                  <button 
                    onClick={() => setInputText('')}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >清空</button>
                </div>
                <textarea 
                  className="flex-1 p-6 outline-none resize-none text-slate-700 leading-relaxed"
                  placeholder="粘贴需要去AI化的剧本内容..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
              </div>
              <button 
                onClick={handlePolish}
                disabled={loading || !inputText}
                className="py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? '正在进行去AI化处理...' : '执行精修润色'}
              </button>
            </div>

            {/* History & Results */}
            <div className="space-y-6 overflow-y-auto pr-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">润色历史记录</h3>
              {project.items.length === 0 ? (
                <div className="bg-slate-100 rounded-3xl py-24 text-center text-slate-300 font-medium">
                  暂无处理记录
                </div>
              ) : (
                project.items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(item.timestamp).toLocaleString()}</span>
                      <button className="text-indigo-600 text-xs font-bold hover:underline">下载文档</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-400 block mb-1">原文</span>
                        <p className="text-slate-500 line-clamp-3 italic">{item.original}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <span className="font-bold text-indigo-400 block mb-1">精修后</span>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{item.polished}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PolishWorkspace;
