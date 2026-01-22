
import React from 'react';
import { FileItem } from '../types';

interface KBProps {
  files: FileItem[];
  onUpdate: (files: FileItem[]) => void;
}

const KnowledgeBaseManager: React.FC<KBProps> = ({ files, onUpdate }) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: FileItem['type']) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newItem: FileItem = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        content,
        type,
        timestamp: Date.now(),
      };
      onUpdate([...files, newItem]);
    };
    reader.readAsText(file);
  };

  const removeFile = (id: string) => {
    onUpdate(files.filter(f => f.id !== id));
  };

  const getFilesByType = (type: FileItem['type']) => files.filter(f => f.type === type);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold mb-6">资源库配置</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UploadSection 
            title="原著小说小说小说" 
            type="novel" 
            files={getFilesByType('novel')} 
            onUpload={handleFileUpload} 
            onDelete={removeFile}
          />
          <UploadSection 
            title="排版参考指向" 
            type="format" 
            files={getFilesByType('format')} 
            onUpload={handleFileUpload} 
            onDelete={removeFile}
          />
          <UploadSection 
            title="文笔参考指向" 
            type="style" 
            files={getFilesByType('style')} 
            onUpload={handleFileUpload} 
            onDelete={removeFile}
          />
        </div>
      </div>
    </div>
  );
};

interface UploadSectionProps {
  title: string;
  type: FileItem['type'];
  files: FileItem[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: FileItem['type']) => void;
  onDelete: (id: string) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ title, type, files, onUpload, onDelete }) => (
  <div className="flex flex-col h-full">
    <label className="text-sm font-semibold text-slate-500 mb-3">{title}</label>
    <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col">
      <div className="space-y-2 mb-4 overflow-y-auto max-h-40">
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded group">
            <span className="truncate flex-1 font-medium">{f.name}</span>
            <button onClick={() => onDelete(f.id)} className="text-red-400 opacity-0 group-hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
      <div className="mt-auto relative">
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onUpload(e, type)}
        />
        <div className="py-2 px-4 border border-teal-200 bg-teal-50 text-teal-700 rounded-lg text-center text-xs font-bold hover:bg-teal-100 transition">
          + 点击上传
        </div>
      </div>
    </div>
  </div>
);

export default KnowledgeBaseManager;
