
import React, { useState } from 'react';
import { Project, PhaseContent } from '../types';
import { generateScriptPhase } from '../services/gemini';
import { downloadAsDocx } from '../services/export';

interface ScriptProps {
  project: Project;
  onUpdate: (p: Project) => void;
}

const ScriptModule: React.FC<ScriptProps> = ({ project, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const novels = project.knowledgeBase.filter(f => f.type === 'novel');
  const formats = project.knowledgeBase.filter(f => f.type === 'format');
  const styles = project.knowledgeBase.filter(f => f.type === 'style');

  // 当前应该生成的阶段索引
  const nextPhaseIndex = project.phases.length + 1;
  const currentPlan = project.phasePlans.find(p => p.phaseIndex === nextPhaseIndex);

  const handleGeneratePhase = async () => {
    if (!project.outline || project.phasePlans.length === 0) {
      alert("请先生成剧本大纲及阶段规划");
      return;
    }
    
    if (!currentPlan) {
      alert("所有规划阶段已生成完毕");
      return;
    }
    
    const novelFile = novels.find(n => n.id === selectedNovel);
    if (!novelFile) {
      alert("请选择原著小说资源");
      return;
    }

    setLoading(true);
    try {
      // 获取上一个阶段的“累计总结”
      const lastPhase = project.phases[project.phases.length - 1];
      const cumulativeSummary = lastPhase ? lastPhase.summary : '';

      const styleFile = styles.find(s => s.id === selectedStyle);
      const formatFile = formats.find(f => f.id === selectedFormat);

      const result = await generateScriptPhase(
        novelFile.content,
        project.outline,
        currentPlan.keyPoints,
        cumulativeSummary,
        styleFile?.content || '',
        formatFile?.content || '',
        project.mode,
        nextPhaseIndex
      );

      const summaryMarker = "【递增式全量剧情总结】";
      const parts = result.split(summaryMarker);
      const fullText = parts[0].trim();
      const newCumulativeSummary = parts[1]?.trim() || "剧情总结生成失败，请检查模型输出。";

      const newPhase: PhaseContent = {
        phaseIndex: nextPhaseIndex,
        episodes: [], 
        summary: newCumulativeSummary,
        fullText
      };

      onUpdate({ ...project, phases: [...project.phases, newPhase] });
    } catch (err) {
      console.error(err);
      alert("生成中断，请检查网络后重试。当前进度已为您保留在本地。");
    } finally {
      setLoading(false);
    }
  };

  const regenerateSpecificPhase = async (idx: number) => {
    const confirm = window.confirm(`确定重新生成第 ${idx} 阶段吗？\n注意：这会基于第 ${idx-1} 阶段的总结重新创作，并产生新的“全量总结”。`);
    if (!confirm) return;

    // 重新生成逻辑：找到前一个阶段的总结
    const prevPhase = project.phases.find(p => p.phaseIndex === idx - 1);
    const cumulativeSummary = prevPhase ? prevPhase.summary : '';
    const plan = project.phasePlans.find(p => p.phaseIndex === idx);
    const novelFile = novels.find(n => n.id === selectedNovel);

    if (!plan || !novelFile) {
      alert("缺少必要配置，无法重新生成");
      return;
    }

    setLoading(true);
    try {
      const result = await generateScriptPhase(
        novelFile.content,
        project.outline!,
        plan.keyPoints,
        cumulativeSummary,
        styles.find(s => s.id === selectedStyle)?.content || '',
        formats.find(f => f.id === selectedFormat)?.content || '',
        project.mode,
        idx
      );

      const parts = result.split("【递增式全量剧情总结】");
      const newPhase: PhaseContent = {
        phaseIndex: idx,
        episodes: [],
        summary: parts[1]?.trim() || "全量总结更新中...",
        fullText: parts[0].trim()
      };

      // 替换对应阶段，并移除之后的所有阶段以保持逻辑链条严谨
      const newPhases = project.phases.filter(p => p.phaseIndex < idx);
      onUpdate({ ...project, phases: [...newPhases, newPhase] });
    } catch (err) {
      alert("重新生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* 状态看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
            执行配置
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">原著小说指向</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedNovel} onChange={e=>setSelectedNovel(e.target.value)}>
                <option value="">选择资源...</option>
                {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">排版参考</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedFormat} onChange={e=>setSelectedFormat(e.target.value)}>
                <option value="">默认排版</option>
                {formats.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">文笔风格</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedStyle} onChange={e=>setSelectedStyle(e.target.value)}>
                <option value="">默认文笔</option>
                {styles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-teal-600 p-6 rounded-3xl shadow-lg shadow-teal-100 flex flex-col justify-between text-white">
          <div>
            <div className="text-xs font-bold opacity-80 mb-1">当前进度</div>
            <div className="text-3xl font-black">第 {project.phases.length} 阶段</div>
            <div className="text-[10px] mt-2 opacity-90">共 {project.phasePlans.length} 个规划阶段</div>
          </div>
          <button
            onClick={handleGeneratePhase}
            disabled={loading || !currentPlan}
            className="w-full mt-4 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 disabled:opacity-50 transition-all active:scale-95 shadow-md"
          >
            {loading ? 'AI创作中...' : currentPlan ? `点击开始第 ${nextPhaseIndex} 阶段` : '规划已全部完成'}
          </button>
        </div>
      </div>

      {/* 实时规划提醒 */}
      {currentPlan && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black animate-pulse">!</div>
          <div className="flex-1">
            <h5 className="text-sm font-bold text-amber-800">即将执行规划 (第 {nextPhaseIndex} 阶段)</h5>
            <p className="text-xs text-amber-700 font-medium italic">{currentPlan.keyPoints}</p>
          </div>
        </div>
      )}

      {/* 阶段历史 */}
      <div className="space-y-12">
        {[...project.phases].reverse().map((phase) => (
          <div key={phase.phaseIndex} className="group relative">
            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-slate-200 rounded-full group-hover:bg-teal-400 transition-colors"></div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ml-4">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="bg-slate-800 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs">P{phase.phaseIndex}</span>
                  <h4 className="font-black text-slate-800 tracking-tight">第 {phase.phaseIndex} 阶段脚本</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => regenerateSpecificPhase(phase.phaseIndex)} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-tighter transition-colors">重新生成此阶段</button>
                  <button onClick={() => downloadAsDocx(`${project.name}_P${phase.phaseIndex}`, phase.fullText)} className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors">下载WORD</button>
                </div>
              </div>
              
              <div className="p-8">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed mb-10 font-serif text-lg">
                  {phase.fullText}
                </div>
                
                {/* 递增式全量总结展示 */}
                <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 relative border-t-4 border-teal-500 shadow-inner">
                  <div className="absolute -top-3 left-6 px-3 bg-teal-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                    递增式全量剧情快照 (1 - {phase.phaseIndex} 阶段)
                  </div>
                  <p className="text-sm leading-relaxed italic opacity-90">
                    {phase.summary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptModule;
