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

 const parsePhasePlans = (text: string): PhasePlan[] => {
  const plans: PhasePlan[] = [];
  const markerStart = "【START_MAP】";
  const markerEnd = "【END_MAP】";
  const startIndex = text.indexOf(markerStart);
  const endIndex = text.indexOf(markerEnd);
  
  if (startIndex === -1 || endIndex === -1) return [];

  const mapContent = text.substring(startIndex + markerStart.length, endIndex).trim();
  
  // 按“第n阶段”分割，保留其下的分集清单
  const rawPhases = mapContent.split(/第\d+阶段[:：]?/).filter(p => p.trim().length > 0);
  
  rawPhases.forEach((content, index) => {
    const phaseNum = index + 1;
    // 动态提取这一段里提到的集数范围
    const epRange = content.match(/[\[【](\d+-\d+)[\]】]集/);
    const chRange = content.match(/[\[【](\d+-\d+)[\]】]章节/);

    plans.push({
      phaseIndex: phaseNum,
      episodesRange: epRange ? epRange[1] : '动态',
      chaptersRange: chRange ? chRange[1] : '动态',
      // 【核心】：完整存入包含“- 第x集：对应第y章”的文本
      keyPoints: `第${phaseNum}阶段` + content.trim()
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
          {loading ? 'AI分析原著并规划中...' : project.outline ? '重新生成大纲' : '生成分集执行大纲'}
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
              <span className="text-xs font-bold text-slate-400">大纲内容及分集对照地图</span>
              <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded">
                共识别出 {project.phasePlans.length} 个阶段
              </span>
            </div>
            <div className="p-8 whitespace-pre-wrap text-slate-700 max-h-[70vh] overflow-y-auto leading-relaxed font-serif text-lg">
              {project.outline}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>请先在左侧选择小说并点击生成按钮</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlineModule;
