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

  // 1. 自动计算当前进度
  const safePhases = Array.isArray(project.phases) ? project.phases : [];
  const nextPhaseIndex = safePhases.length + 1;
  
  // 2. 匹配当前阶段规划
  const currentPlan = project.phasePlans.find((p, idx) => {
    const pIdx = p.phaseIndex || (p as any).index;
    return Number(pIdx) === nextPhaseIndex || (idx + 1) === nextPhaseIndex;
  });

  // 3. 核心生成逻辑
  const handleGeneratePhase = async () => {
    if (!selectedNovel) return alert("请先选择原著小说资源");
    const novelFile = novels.find(n => n.id === selectedNovel);
    if (!novelFile) return alert("选择的小说资源不存在");
    if (!currentPlan) return alert("所有规划阶段已生成完毕或规划数据异常");

    setLoading(true);
    try {
      // 获取上个阶段的总结用于衔接
      const lastPhase = safePhases[safePhases.length - 1];
      const cumulativeSummary = lastPhase ? lastPhase.summary : '这是开篇第一阶段，请开始创作。';

      // 调用 API，强制透传 project.mode
      const result = await generateScriptPhase(
        novelFile.content,
        project.outline || '',
        currentPlan.keyPoints,
        cumulativeSummary,
        styles.find(s => s.id === selectedStyle)?.content || '',
        formats.find(s => s.id === selectedFormat)?.content || '',
        project.mode, // 模式：male 或 female
        nextPhaseIndex
      );

      // 解析总结标记
      const summaryMarker = "【递增式全量剧情总结】";
      let scriptBody = "";
      let finalSummary = cumulativeSummary;

      if (result.includes(summaryMarker)) {
        const parts = result.split(summaryMarker);
        scriptBody = parts[0].trim();
        finalSummary = parts[1]?.replace(/[:：]/, "").trim() || cumulativeSummary;
      } else {
        scriptBody = result;
        finalSummary = "AI未返回最新进度总结，请注意衔接。";
      }

      const newPhase: PhaseContent = {
        phaseIndex: nextPhaseIndex,
        episodes: [],
        summary: finalSummary,
        fullText: scriptBody
      };

      // 保存并更新项目
      onUpdate({
        ...project,
        phases: [...safePhases, newPhase]
      });

    } catch (err) {
      console.error(err);
      alert("生成中断，请检查 API 配置或网络环境。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* 顶部执行配置 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
            执行配置 (当前模式: {project.mode === 'male' ? '男频' : '女频'})
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">原著小说</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedNovel} onChange={e=>setSelectedNovel(e.target.value)}>
                <option value="">请选择小说...</option>
                {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">排版参考</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedFormat} onChange={e=>setSelectedFormat(e.target.value)}>
                <option value="">默认排版</option>
                {formats.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">文笔参考</label>
              <select className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm" value={selectedStyle} onChange={e=>setSelectedStyle(e.target.value)}>
                <option value="">默认文笔风格</option>
                {styles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 状态卡片 */}
        <div className="bg-teal-600 p-6 rounded-3xl shadow-lg flex flex-col justify-between text-white">
          <div>
            <div className="text-xs font-bold opacity-80 mb-1 tracking-widest">PROGRESS</div>
            <div className="text-3xl font-black">第 {safePhases.length} 阶段</div>
            <div className="text-[10px] mt-2 opacity-90">大纲规划共 {project.phasePlans.length} 个阶段</div>
          </div>
          <button
            onClick={handleGeneratePhase}
            disabled={loading || !currentPlan}
            className="w-full mt-4 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 disabled:opacity-50 transition-all active:scale-95 shadow-md"
          >
            {loading ? 'AI 剧本创作中...' : currentPlan ? `开始生成第 ${nextPhaseIndex} 阶段` : '全部规划已完成'}
          </button>
        </div>
      </div>

      {/* 当前待执行地图提示 */}
      {currentPlan && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black animate-pulse">!</div>
          <div className="flex-1">
            <h5 className="text-sm font-bold text-amber-800">即将执行规划 (第 {nextPhaseIndex} 阶段)</h5>
            <p className="text-xs text-amber-700 font-medium italic line-clamp-2">{currentPlan.keyPoints}</p>
          </div>
        </div>
      )}

      {/* 已生成内容展示 (倒序) */}
      <div className="space-y-12">
        {[...safePhases].reverse().map((phase) => (
          <div key={phase.phaseIndex} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="bg-slate-800 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs">P{phase.phaseIndex}</span>
                <h4 className="font-black text-slate-800">第 {phase.phaseIndex} 阶段脚本</h4>
              </div>
              <button 
                onClick={() => downloadAsDocx(`${project.name}_第${phase.phaseIndex}阶段`, phase.fullText)}
                className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors"
              >
                下载 DOCX
              </button>
            </div>
            <div className="p-8">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed mb-10 font-sans">
                {phase.fullText}
              </div>
              {/* 进度总结 */}
              <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 relative border-t-4 border-teal-500">
                <div className="absolute -top-3 left-6 px-3 bg-teal-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                  剧情进度快照 (1 - {phase.phaseIndex} 阶段)
                </div>
                <p className="text-sm leading-relaxed italic opacity-90">
                  {phase.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptModule;
