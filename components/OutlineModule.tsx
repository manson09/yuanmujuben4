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

  // 【精准解析逻辑】：将大纲切分为带有分集对照表的阶段数组
  const parsePhasePlans = (text: string): PhasePlan[] => {
    const plans: PhasePlan[] = [];
    const markerStart = "【阶段详细规划开始】";
    const markerEnd = "【阶段详细规划结束】";
    const startIndex = text.indexOf(markerStart);
    const endIndex = text.indexOf(markerEnd);
    
    let targetText = text;
    if (startIndex !== -1 && endIndex !== -1) {
      targetText = text.substring(startIndex + markerStart.length, endIndex).trim();
    }

    // 按照“第n阶段”切分块，保留块内所有的“第n集：对应原著第x章”信息
    const rawPhases = targetText.split(/第\d+阶段[:：]?/).filter(p => p.trim().length > 0);
    
    rawPhases.forEach((content, index) => {
      const phaseNum = index + 1;
      const fullPhaseContent = `第${phaseNum}阶段${content}`;
      
      // 提取本阶段总的集数范围 [1-6]
      const episodeMatch = fullPhaseContent.match(/[\[【](\d+-\d+)[\]】]集/);
      // 提取本阶段总的章节范围 【1-12】
      const chapterMatch = fullPhaseContent.match(/[\[【](\d+-\d+)[\]】]章节/);

      plans.push({
        phaseIndex: phaseNum,
        episodesRange: episodeMatch ? episodeMatch[1] : '动态分配',
        chaptersRange: chapterMatch ? chapterMatch[1] : '分析中',
        // 【关键】：这里存储了包含每一集对应哪一章的完整文字地图
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
      {/* 左侧配置 */}
      <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
        <h3 className="font-bold text-slate-800 border-b pb-2">大纲生成配置</h3>
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
          <label className="block text-xs font-bold text-slate-500 mb-2">排版参考</label>
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
          <label className="block text-xs font-bold text-slate-500 mb-2">文笔参考</label>
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
          className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md"
        >
          {loading ? 'AI深度分析中...' : project.outline ? '重新生成大纲' : '生成分集执行大纲'}
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

      {/* 右侧展示 */}
      <div className="lg:col-span-3">
        {project.outline ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
