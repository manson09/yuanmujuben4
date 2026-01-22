
import React, { useState, useEffect } from 'react';
import { ViewState, Project, PolishProject } from './types';
import Dashboard from './components/Dashboard';
import ProjectWorkspace from './components/ProjectWorkspace';
import PolishWorkspace from './components/PolishWorkspace';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('main');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [polishProjects, setPolishProjects] = useState<PolishProject[]>([]);

  // Persistence
  useEffect(() => {
    const savedProjects = localStorage.getItem('script_projects');
    const savedPolish = localStorage.getItem('polish_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedPolish) setPolishProjects(JSON.parse(savedPolish));
  }, []);

  const saveToLocalStorage = (newProjects: Project[], newPolish: PolishProject[]) => {
    localStorage.setItem('script_projects', JSON.stringify(newProjects));
    localStorage.setItem('polish_projects', JSON.stringify(newPolish));
  };

  const createProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      mode: 'male',
      knowledgeBase: [],
      phasePlans: [],
      phases: [],
      lastModified: Date.now(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveToLocalStorage(updated, polishProjects);
    setActiveProjectId(newProject.id);
    setView('project-detail');
  };

  const createPolishProject = (name: string) => {
    const newProject: PolishProject = {
      id: 'polish_' + Date.now().toString(),
      name,
      knowledgeBase: [],
      items: [],
    };
    const updated = [...polishProjects, newProject];
    setPolishProjects(updated);
    saveToLocalStorage(projects, updated);
    setActiveProjectId(newProject.id);
    setView('polish-center');
  };

  const updateProject = (updatedProject: Project) => {
    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjects(updated);
    saveToLocalStorage(updated, polishProjects);
  };

  const updatePolishProject = (updatedProject: PolishProject) => {
    const updated = polishProjects.map(p => p.id === updatedProject.id ? updatedProject : p);
    setPolishProjects(updated);
    saveToLocalStorage(projects, updated);
  };

  const currentProject = projects.find(p => p.id === activeProjectId);
  const currentPolishProject = polishProjects.find(p => p.id === activeProjectId);

  return (
    <div className="min-h-screen">
      {view === 'main' && (
        <Dashboard 
          projects={projects} 
          polishProjects={polishProjects}
          onCreateProject={createProject}
          onCreatePolish={createPolishProject}
          onOpenProject={(id) => { setActiveProjectId(id); setView('project-detail'); }}
          onOpenPolish={(id) => { setActiveProjectId(id); setView('polish-center'); }}
        />
      )}
      
      {view === 'project-detail' && currentProject && (
        <ProjectWorkspace 
          project={currentProject} 
          onSave={updateProject}
          onBack={() => setView('main')}
        />
      )}

      {view === 'polish-center' && currentPolishProject && (
        <PolishWorkspace 
          project={currentPolishProject}
          onSave={updatePolishProject}
          onBack={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;
