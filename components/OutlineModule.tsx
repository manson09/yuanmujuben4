import React, { useState } from 'react';
import { Project, PhasePlan } from '../types';
import { generateOutline } from '../services/gemini';
import { downloadAsDocx } from '../services/export';

interface OutlineProps {
  project: Project;
  onUpdate: (p: Project) => void;
}

const OutlineModule: React.FC<OutlineProps> = ({ project, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const novels = project.knowledgeBase.filter(f => f.type === 'novel');
  const formats = project.knowledgeBase.filter(f => f.type === 'format');
  const styles = project.knowledgeBase.filter(f => f.type === 'style');

  // 【核心修复：解析逻辑】
  const parsePhasePlans = (text: string): PhasePlan[] => {
    const plans: PhasePlan[] = [];
    
   const parsePhasePlans = (text: string): PhasePlan[] => {
    const plans: PhasePlan[] = [];
    
    // 1. 定位 AI 输出的规划区域
    const markerStart = "【阶段详细规划开始】";
    const markerEnd = "【阶段详细规划结束】";
    const startIndex = text.indexOf(markerStart);
    const endIndex = text.indexOf(markerEnd);
    
    let targetText = text;
    if (startIndex !== -1 && endIndex !== -1) {
      targetText = text.substring(startIndex + markerStart.length, endIndex).trim();
    }

    // 2. 【核心修改】：按照“第n阶段”切分文字块
    // 这样每个块里都会包含“第n阶段：...”以及它下面的“- 第x集：...”所有清单
    const rawPhases = targetText.split(/第\d+阶段[:：]?/).filter(p => p.trim().length > 0);
    
    rawPhases.forEach((content, index) => {
      const phaseNum = index + 1;
      const fullPhaseContent = `第${phaseNum}阶段${content}`;
      
      // 3. 【动态抓取】：让 AI 自己决定集数和章节，我们只负责提取
      // 匹配格式如：[1-8]集 或 【1-12】章节
      const episodeMatch = fullPhaseContent.match(/[\[【](\d+-\d+)[\]】]集/);
      const chapterMatch = fullPhaseContent.match(/[\[【](\d+-\d+)[\]】]章节/);

      plans.push({
        phaseIndex: phaseNum,
        // 这里不再用 index*10 这种死公式，而是优先取 AI 生成的数字
        episodesRange: episodeMatch ? episodeMatch[1] : '动态分配',
        chaptersRange: chapterMatch ? chapterMatch[1] : '动态分配',
        // 【最重要】：把包含“第x集对应第y章”的完整清单全部存入 keyPoints
        keyPoints: fullPhaseContent.trim() 
      });
    });

    return plans;
  };
  const handleGenerate = async () => {
    const novelFile = novels.find(n => n.id === selectedNovel);
    if (!novelFile) {
      alert("请选择原著小说资源");
      return;
    }

    setLoading(true);
    try {
      const formatFile = formats.find(f => f.id === selectedFormat);
      const styleFile = styles.find(s => s.id === selectedStyle);
      
      const result = await generateOutline(
        novelFile.content,
        styleFile?.content || '',
        formatFile?.content || '',
        project.mode
      );

      const parsedPlans = parsePhasePlans(result);
      
      onUpdate({ 
        ...project, 
        outline: result, 
        phasePlans: parsedPlans,
        phases: [] 
      });
    } catch (err) {
      console.error(err);
      alert("大纲生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 左侧配置栏 */}
      <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
        <h3 className="font-bold text-slate-800 border-b pb-2">生成配置</h3>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">原著小说指向</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={selectedNovel}
            onChange={(e) => setSelectedNovel(e.target.value)}
          >
            <option value="">请选择...</option>
            {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">排版参考指向</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            <option value="">默认排版</option>
            {formats.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">文笔参考指向</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            <option value="">默认风格</option>
            {styles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all"
        >
          {loading ? '分析并规划中...' : project.outline ? '重新生成大纲' : '生成大纲与章节规划'}
        </button>

        {project.outline && (
          <button
            onClick={() => downloadAsDocx(`${project.name}_深度大纲`, project.outline || '')}
            className="w-full py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            下载大纲 Word
          </button>
        )}
      </div>

      {/* 右侧展示区 */}
      <div className="lg:col-span-3">
        {project.outline ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">大纲内容及原著章节对照规划</span>
              <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded">共 {project.phasePlans.length} 个阶段</span>
            </div>
            <div className="p-8 whitespace-pre-wrap text-slate-700 max-h-[70vh] overflow-y-auto leading-relaxed font-serif">
              {project.outline}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p>请先在左侧选择小说及参考资源</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlineModule;
