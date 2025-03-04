import React, { useState, useEffect } from 'react';
import ss from './HomeModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSave, 
  faFolder, 
  faTimes, 
  faEdit,
  faTrash,
  faFileExport,
  faFileImport,
  faDownload,
  faUpload
} from '@fortawesome/free-solid-svg-icons';

const HomeModal = ({ 
  isOpen, 
  onClose, 
  onNewProject, 
  onOpenProject, 
  onSaveProject,
  onExportProject,
  onImportProject,
  projects = []
}) => {
  const [activeTab, setActiveTab] = useState('recent');
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState(projects);

  // 프로젝트 목록이 변경될 때 필터링된 프로젝트 업데이트
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projects, searchTerm]);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab('recent');
      setProjectName('');
      setIsCreating(false);
      setIsSaving(false);
      setSelectedProject(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  // 새 프로젝트 생성 처리
  const handleCreateProject = () => {
    if (projectName.trim() === '') return;
    
    onNewProject(projectName);
    setProjectName('');
    setIsCreating(false);
    onClose();
  };

  // 프로젝트 저장 처리
  const handleSaveProject = () => {
    if (projectName.trim() === '') return;
    
    onSaveProject(projectName);
    setProjectName('');
    setIsSaving(false);
  };

  // 프로젝트 열기 처리
  const handleOpenProject = (project) => {
    setSelectedProject(project);
    onOpenProject(project);
    onClose();
  };

  // 모달 외부 클릭 시 닫기 방지
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className={ss.modalOverlay} onClick={onClose}>
      <div className={ss.modal} onClick={handleModalClick}>
        <div className={ss.modalHeader}>
          <h2>Projects</h2>
          <button className={ss.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={ss.tabs}>
          <button 
            className={`${ss.tab} ${activeTab === 'recent' ? ss.active : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Projects
          </button>
          <button 
            className={`${ss.tab} ${activeTab === 'all' ? ss.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Projects
          </button>
        </div>

        <div className={ss.searchContainer}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={ss.searchInput}
          />
        </div>

        {isCreating ? (
          <div className={ss.createProjectForm}>
            <h3>Create New Project</h3>
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={ss.projectNameInput}
              autoFocus
            />
            <div className={ss.formButtons}>
              <button 
                className={ss.cancelButton} 
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
              <button 
                className={ss.createButton} 
                onClick={handleCreateProject}
                disabled={projectName.trim() === ''}
              >
                Create
              </button>
            </div>
          </div>
        ) : isSaving ? (
          <div className={ss.createProjectForm}>
            <h3>프로젝트 저장</h3>
            <input
              type="text"
              placeholder="프로젝트 이름"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={ss.projectNameInput}
              autoFocus
            />
            <div className={ss.formButtons}>
              <button 
                className={ss.cancelButton} 
                onClick={() => setIsSaving(false)}
              >
                취소
              </button>
              <button 
                className={ss.createButton} 
                onClick={handleSaveProject}
                disabled={projectName.trim() === ''}
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={ss.projectsGrid}>
              <div 
                className={`${ss.projectCard} ${ss.newProjectCard}`}
                onClick={() => setIsCreating(true)}
              >
                <div className={ss.newProjectIcon}>
                  <FontAwesomeIcon icon={faPlus} />
                </div>
                <div className={ss.projectName}>New Project</div>
              </div>

              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  className={ss.projectCard}
                  onClick={() => handleOpenProject(project)}
                >
                  <div 
                    className={ss.projectThumbnail}
                    style={{ 
                      backgroundColor: project.color || '#4A90E2',
                      backgroundImage: project.thumbnail ? `url(${project.thumbnail})` : 'none'
                    }}
                  >
                    {!project.thumbnail && (
                      <FontAwesomeIcon icon={faFolder} className={ss.folderIcon} />
                    )}
                  </div>
                  <div className={ss.projectInfo}>
                    <div className={ss.projectName}>{project.name}</div>
                    <div className={ss.projectDate}>
                      {new Date(project.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={ss.projectActions}>
                    <button 
                      className={ss.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveProject(project);
                      }}
                    >
                      <FontAwesomeIcon icon={faSave} />
                    </button>
                    <button 
                      className={ss.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportProject(project);
                      }}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={ss.modalFooter}>
              <button 
                className={`${ss.footerButton} ${ss.secondaryButton}`}
                onClick={onImportProject}
              >
                <span className={ss.buttonIcon}>
                  <FontAwesomeIcon icon={faFileImport} />
                </span>
                <span className={ss.buttonText}>Import Project</span>
              </button>
              
              <button 
                className={`${ss.footerButton} ${ss.secondaryButton}`}
                onClick={onExportProject}
              >
                <span className={ss.buttonIcon}>
                  <FontAwesomeIcon icon={faFileExport} />
                </span>
                <span className={ss.buttonText}>Export Project</span>
              </button>
              
              <button 
                className={`${ss.footerButton} ${ss.primaryButton}`}
                onClick={onSaveProject}
              >
                <span className={ss.buttonIcon}>
                  <FontAwesomeIcon icon={faSave} />
                </span>
                <span className={ss.buttonText}>Save Current Project</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeModal; 