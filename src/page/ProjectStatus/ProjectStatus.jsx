import React, { useState, useEffect } from 'react';
import styles from './ProjectStatus.module.css';
import ProjectDetailModal from '../../components/ProjectDetailModal/ProjectDetailModal';
import AddProjectModal from '../../components/AddProjectModal/AddProjectModal';
import api from '../../utils/api';
import { 
  HiPlus, HiPencil, HiTrash, HiX, 
  HiCalendar, HiCheckCircle, HiChartBar, HiUserGroup, 
  HiInformationCircle, HiLightBulb, HiSave,
  HiStar, HiDocument, HiDocumentText, HiChevronDown, HiTag
} from 'react-icons/hi';
import getProjectThumbnail from '../../utils/getProjectThumbnail';

const ProjectStatus = () => {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // 이미지 로딩 상태 관리
  const [imageLoadStates, setImageLoadStates] = useState({});

  // 서버에서 프로젝트 데이터 로드
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      if (response.status === 200) {
        // 데이터 구조 안전성 확보 (숨겨진 프로젝트 제외)
        const projectsWithDefaults = response.data
          .filter(project => !project.isHide) // 숨겨진 프로젝트 제외
          .map(project => ({
            ...project,
            id: project._id || project.id,
            tasks: project.tasks || [],
            team: project.team || [],
            staffList: project.staffList || [],
            progress: project.progress || 0
          }));
        
        setProjects(projectsWithDefaults);
        setAllProjects(projectsWithDefaults);
        console.log('프로젝트 데이터 로드 성공:', projectsWithDefaults.length, '개');
      }
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error);
      // 에러 발생 시 빈 배열로 설정
      setProjects([]);
      setAllProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 로드 완료 핸들러
  const handleImageLoad = (projectId) => {
    setImageLoadStates(prev => ({
      ...prev,
      [projectId]: true
    }));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer)
  }, [])

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCloseDetail = () => {
    setSelectedProject(null);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };

  const handleStatusFilterChange = (status, category = null) => {
    setStatusFilter(status);
    
    if (status === 'all') {
      setProjects(allProjects);
      return;
    }
    
    if (category === 'pre_production') {
      setProjects(allProjects.filter(project => 
        ['concept', 'development', 'pre_production'].includes(project.status)
      ));
      return;
    }
    
    if (category === 'production') {
      setProjects(allProjects.filter(project => 
        project.status === 'production'
      ));
      return;
    }
    
    if (category === 'post_production') {
      setProjects(allProjects.filter(project => 
        ['post_production', 'sound_design', 'vfx', 'quality_check', 'delivery'].includes(project.status)
      ));
      return;
    }
    
    // 단일 상태 필터링
    setProjects(allProjects.filter(project => project.status === status));
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'concept': return 'Concept';
      case 'development': return 'Development';
      case 'pre_production': return 'Pre-Production';
      case 'production': return 'Production';
      case 'post_production': return 'Post-Production';
      case 'vfx': return 'VFX/CG';
      case 'sound_design': return 'Sound Design';
      case 'quality_check': return 'Quality Check';
      case 'delivery': return 'Delivery';
      default: return 'Unknown';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'concept': return styles.status_concept;
      case 'development': return styles.status_development;
      case 'pre_production': return styles.status_pre_production;
      case 'production': return styles.status_production;
      case 'post_production': return styles.status_post_production;
      case 'vfx': return styles.status_vfx;
      case 'sound_design': return styles.status_sound_design;
      case 'quality_check': return styles.status_quality_check;
      case 'delivery': return styles.status_delivery;
      default: return '';
    }
  };

  const filteredProjects = projects;

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading_state}>
          <p>프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.dashboard_header}>
        <div className={styles.header_content}>
          <h1 className={styles.dashboard_title}>Project Status</h1>
          <p className={styles.dashboard_date}>
            {currentTime.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} {currentTime.toLocaleTimeString('en-US')}
          </p>
        </div>
        
        <div className={styles.header_controls}>
          <div className={styles.filters}>
            <button 
              className={`${styles.filter_tab} ${statusFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleStatusFilterChange('all')}
            >
              ALL
            </button>
            <button 
              className={`${styles.filter_tab} ${(statusFilter === 'pre_production_category') ? styles.active : ''}`}
              onClick={() => handleStatusFilterChange('pre_production_category', 'pre_production')}
            >
              PRE
            </button>
            <button 
              className={`${styles.filter_tab} ${statusFilter === 'production_category' ? styles.active : ''}`}
              onClick={() => handleStatusFilterChange('production_category', 'production')}
            >
              PRODUCTION
            </button>
            <button 
              className={`${styles.filter_tab} ${statusFilter === 'post_production_category' ? styles.active : ''}`}
              onClick={() => handleStatusFilterChange('post_production_category', 'post_production')}
            >
              POST
            </button>
          </div>
          
          <button className={`${styles.customize_btn} ${styles.save_btn}`} onClick={handleShowAddForm}>
            <HiPlus /> 새 프로젝트
          </button>
        </div>
      </header>

      <div className={styles.projects_grid}>
        {filteredProjects.length === 0 ? (
          <div className={styles.no_projects}>
            <HiDocument />
            <p>현재 필터에 해당하는 프로젝트가 없습니다.</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div 
              key={project.id}
              className={`${styles.project_card} ${selectedProject && selectedProject.id === project.id ? styles.selected : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              {/* 이미지 스켈레톤 */}
              {!imageLoadStates[project.id] && (
                <div className={styles.image_skeleton}>
                  <div className={styles.skeleton_animation}></div>
                </div>
              )}
              
              {/* 실제 이미지 */}
              <img 
                src={getProjectThumbnail(project.thumbnail)} 
                alt={project.title} 
                className={`${styles.project_thumbnail} ${imageLoadStates[project.id] ? styles.loaded : styles.loading}`}
                onLoad={() => handleImageLoad(project.id)}
                style={{ display: imageLoadStates[project.id] ? 'block' : 'none' }}
              />
              
              <div className={styles.project_overlay}></div>
              <div className={styles.project_content}>
                <span className={`${styles.project_status} ${getStatusClass(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                <h3 className={styles.project_title}>{project.title}</h3>
                <div className={styles.project_progress}>
                  <div 
                    className={styles.progress_bar} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className={styles.project_meta}>
                  <span className={styles.project_deadline}>
                    <HiCalendar /> {new Date(project.deadline).toLocaleDateString()}
                  </span>
                  <span className={styles.project_tasks}>
                    <HiCheckCircle /> {project.tasks ? project.tasks.length : 0}개
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
      <ProjectDetailModal
        selectedProject={selectedProject}
        onClose={handleCloseDetail}
        onProjectUpdate={(updatedProject) => {
          setSelectedProject(updatedProject);
          setProjects(projects.map(project => 
            project.id === updatedProject.id ? updatedProject : project
          ));
          setAllProjects(allProjects.map(project => 
            project.id === updatedProject.id ? updatedProject : project
          ));
        }}
      />

      {/* 새 프로젝트 추가 모달 */}
      <AddProjectModal
        isOpen={showAddForm}
        onClose={handleCloseAddForm}
        onAddProject={(newProject) => {
          // 서버에서 최신 데이터 다시 로드
          fetchProjects();
          setShowAddForm(false);
        }}
      />
    </div>
  );
};

export default ProjectStatus; 