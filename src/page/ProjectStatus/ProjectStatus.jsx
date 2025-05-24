import React, { useState, useEffect } from 'react';
import styles from './ProjectStatus.module.css';
import { 
  HiPlus, HiPencil, HiTrash, HiX, 
  HiCalendar, HiCheckCircle, HiChartBar, HiUserGroup, 
  HiInformationCircle, HiLightBulb, HiSave,
  HiStar, HiDocument, HiDocumentText, HiChevronDown, HiTag
} from 'react-icons/hi';

// 프로젝트 샘플 데이터
const sampleProjects = [
  {
    id: 1,
    title: '웹 앱 개발 프로젝트',
    status: 'production',
    progress: 65,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    description: '새로운 소셜 미디어 플랫폼 개발 프로젝트. 프론트엔드와 백엔드 작업 진행 중.',
    deadline: '2023-12-15',
    tasks: [
      { id: 1, title: '로그인 시스템 구현', status: 'completed' },
      { id: 2, title: '사용자 프로필 페이지', status: 'in_progress' },
      { id: 3, title: '알림 시스템 개발', status: 'planned' },
    ],
    team: ['김개발', '이디자인', '박백엔드']
  },
  {
    id: 2,
    title: '모바일 앱 리디자인',
    status: 'post_production',
    progress: 85,
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3',
    description: '기존 모바일 앱의 UI/UX 개선 프로젝트. 사용자 피드백 반영 중.',
    deadline: '2023-11-30',
    tasks: [
      { id: 1, title: '와이어프레임 작성', status: 'completed' },
      { id: 2, title: '디자인 시스템 구축', status: 'completed' },
      { id: 3, title: '프로토타입 테스트', status: 'in_progress' },
    ],
    team: ['최디자이너', '정UX', '강개발']
  },
  {
    id: 3,
    title: '데이터 분석 대시보드',
    status: 'delivery',
    progress: 100,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    description: '마케팅 데이터 시각화를 위한 대시보드 개발 프로젝트.',
    deadline: '2023-10-15',
    tasks: [
      { id: 1, title: '데이터 소스 연결', status: 'completed' },
      { id: 2, title: '차트 구현', status: 'completed' },
      { id: 3, title: '사용자 권한 설정', status: 'completed' },
    ],
    team: ['임데이터', '홍분석', '유개발']
  },
  {
    id: 4,
    title: '블록체인 기반 결제 시스템',
    status: 'development',
    progress: 20,
    thumbnail: 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
    description: '암호화폐를 활용한 결제 시스템 개발 프로젝트. 기술 검토 중.',
    deadline: '2024-02-28',
    tasks: [
      { id: 1, title: '기술 스택 검토', status: 'completed' },
      { id: 2, title: '스마트 컨트랙트 개발', status: 'in_progress' },
      { id: 3, title: '보안 감사', status: 'planned' },
    ],
    team: ['강블록', '조개발', '윤보안']
  },
  {
    id: 5,
    title: 'AI 추천 알고리즘 개발',
    status: 'pre_production',
    progress: 45,
    thumbnail: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1',
    description: '사용자 행동 기반 AI 추천 시스템 개발 프로젝트.',
    deadline: '2023-12-30',
    tasks: [
      { id: 1, title: '데이터 수집 및 전처리', status: 'completed' },
      { id: 2, title: '모델 학습', status: 'in_progress' },
      { id: 3, title: 'A/B 테스트', status: 'planned' },
    ],
    team: ['김AI', '이ML', '박데이터']
  },
  {
    id: 6,
    title: '마케팅 웹사이트 개발',
    status: 'vfx',
    progress: 90,
    thumbnail: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c',
    description: '신규 제품 출시를 위한 마케팅 웹사이트 개발 프로젝트.',
    deadline: '2023-11-15',
    tasks: [
      { id: 1, title: '콘텐츠 작성', status: 'completed' },
      { id: 2, title: '디자인 구현', status: 'completed' },
      { id: 3, title: 'SEO 최적화', status: 'in_progress' },
    ],
    team: ['송마케팅', '조디자인', '최개발']
  }
];

const ProjectStatus = () => {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProjectStatus, setEditingProjectStatus] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'concept',
    deadline: new Date().toISOString().split('T')[0]
  });
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    // 실제 앱에서는 API 호출로 대체
    setProjects(sampleProjects);
    setAllProjects(sampleProjects);
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
    setEditingProjectStatus(false);
    setEditingProgress(false);
    setEditingDeadline(false);
    setEditingTeam(false);
  };

  const handleCloseDetail = () => {
    setSelectedProject(null);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    // 폼 초기화
    setNewProject({
      title: '',
      description: '',
      status: 'concept',
      deadline: new Date().toISOString().split('T')[0]
    });
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

  const handleAddProject = (e) => {
    e.preventDefault();
    // 프로젝트 추가 로직
    if (!newProject.title) return;
    
    const projectToAdd = {
      ...newProject,
      id: Date.now(),
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      tasks: [],
      team: []
    };
    
    setProjects([...projects, projectToAdd]);
    handleCloseAddForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value
    });
  };

  const handleDeleteProject = (id) => {
    // 프로젝트 삭제 로직
    setProjects(projects.filter(project => project.id !== id));
    if (selectedProject && selectedProject.id === id) {
      setSelectedProject(null);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedProject) return;

    const updatedProject = { ...selectedProject, status: newStatus };
    setSelectedProject(updatedProject);
    setProjects(projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    ));
    setEditingProjectStatus(false);
  };

  const handleProgressChange = (e) => {
    if (!selectedProject) return;
    
    const newProgress = parseInt(e.target.value);
    const updatedProject = { ...selectedProject, progress: newProgress };
    setSelectedProject(updatedProject);
    setProjects(projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    ));
  };

  const handleSaveProgress = () => {
    setEditingProgress(false);
  };

  const handleDeadlineChange = (e) => {
    if (!selectedProject) return;
    
    const newDeadline = e.target.value;
    const updatedProject = { ...selectedProject, deadline: newDeadline };
    setSelectedProject(updatedProject);
    setProjects(projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    ));
  };

  const handleSaveDeadline = () => {
    setEditingDeadline(false);
  };

  const handleTeamMemberRemove = (memberToRemove) => {
    if (!selectedProject) return;
    
    const updatedTeam = selectedProject.team.filter(member => member !== memberToRemove);
    const updatedProject = { ...selectedProject, team: updatedTeam };
    setSelectedProject(updatedProject);
    setProjects(projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    ));
  };

  const handleTeamMemberAdd = (e) => {
    e.preventDefault();
    
    if (!selectedProject || !newTeamMember.trim()) return;
    
    const updatedTeam = [...selectedProject.team, newTeamMember.trim()];
    const updatedProject = { ...selectedProject, team: updatedTeam };
    setSelectedProject(updatedProject);
    setProjects(projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    ));
    
    setNewTeamMember('');
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
              <img 
                src={project.thumbnail} 
                alt={project.title} 
                className={styles.project_thumbnail}
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
                    <HiCheckCircle /> {project.tasks.length}개
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <div className={styles.modal_wrapper}>
          <div className={styles.modal_background} onClick={handleCloseDetail}></div>
          <div className={styles.modal_panel}>
            <div className={styles.panel_header}>
              <div className={styles.panel_title}>
                <h2>{selectedProject.title}</h2>
              </div>
              <button className={styles.close_button} onClick={handleCloseDetail}>
                <HiX />
              </button>
            </div>

            <div className={styles.panel_content}>
              <div className={styles.content_section}>
                <h3><HiInformationCircle /> 프로젝트 개요</h3>
                <p className={styles.project_description}>{selectedProject.description}</p>
              </div>

              <div className={styles.info_cards_container}>
                {/* 상태 카드 */}
                <div className={styles.info_card}>
                  <div className={styles.info_card_header}>
                    <HiTag className={styles.info_card_icon} />
                    <h4>상태</h4>
                  </div>
                  {editingProjectStatus ? (
                    <div className={styles.status_selector}>
                      {['concept', 'development', 'pre_production', 'production', 'post_production', 'vfx', 'sound_design', 'quality_check', 'delivery'].map(status => (
                        <div
                          key={status}
                          className={`${styles.status_option} ${selectedProject.status === status ? styles.selected : ''} ${getStatusClass(status)}`}
                          onClick={() => handleStatusChange(status)}
                        >
                          {getStatusText(status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className={`${styles.status_display} ${getStatusClass(selectedProject.status)}`}
                      onClick={() => setEditingProjectStatus(true)}
                    >
                      <span>{getStatusText(selectedProject.status)}</span>
                      <HiPencil className={styles.edit_icon} />
                    </div>
                  )}
                </div>

                {/* 진행률 카드 */}
                <div className={styles.info_card}>
                  <div className={styles.info_card_header}>
                    <HiChartBar className={styles.info_card_icon} />
                    <h4>진행률</h4>
                  </div>
                  <div className={styles.progress_display}>
                    <div className={styles.progress_bar_container}>
                      <div 
                        className={styles.progress_bar_full} 
                        style={{ width: `${selectedProject.progress}%` }}
                      ></div>
                    </div>
                    <div 
                      className={styles.progress_percentage}
                      onClick={() => setEditingProgress(true)}
                    >
                      <span>{selectedProject.progress}%</span>
                      <HiPencil className={styles.edit_icon} />
                    </div>
                  </div>
                  {editingProgress && (
                    <div className={styles.progress_editor}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={selectedProject.progress} 
                        onChange={handleProgressChange}
                        className={styles.progress_slider_full}
                      />
                      <div className={styles.progress_editor_actions}>
                        <button 
                          className={styles.save_button}
                          onClick={handleSaveProgress}
                        >
                          <HiSave /> 저장
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 마감일 카드 */}
                <div className={styles.info_card}>
                  <div className={styles.info_card_header}>
                    <HiCalendar className={styles.info_card_icon} />
                    <h4>마감일</h4>
                  </div>
                  {editingDeadline ? (
                    <div className={styles.deadline_editor}>
                      <input 
                        type="date" 
                        value={selectedProject.deadline}
                        onChange={handleDeadlineChange}
                        className={styles.date_input}
                      />
                      <button 
                        className={styles.save_button}
                        onClick={handleSaveDeadline}
                      >
                        <HiSave /> 저장
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={styles.deadline_display}
                      onClick={() => setEditingDeadline(true)}
                    >
                      <span>{new Date(selectedProject.deadline).toLocaleDateString()}</span>
                      <HiPencil className={styles.edit_icon} />
                    </div>
                  )}
                </div>
              </div>

              {/* 팀원 섹션 */}
              <div className={styles.team_section}>
                <div className={styles.team_header}>
                  <h3><HiUserGroup /> 팀원</h3>
                  <button 
                    className={styles.edit_team_button}
                    onClick={() => setEditingTeam(!editingTeam)}
                  >
                    {editingTeam ? <HiX /> : <HiPencil />}
                  </button>
                </div>
                
                <div className={styles.team_members}>
                  {selectedProject.team.length === 0 ? (
                    <div className={styles.no_members}>
                      <HiLightBulb />
                      <p>할당된 팀원이 없습니다</p>
                    </div>
                  ) : (
                    selectedProject.team.map((member, index) => (
                      <div key={index} className={styles.member_chip}>
                        <span>{member}</span>
                        {editingTeam && (
                          <button 
                            className={styles.remove_member_button}
                            onClick={() => handleTeamMemberRemove(member)}
                          >
                            <HiX />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  
                  {editingTeam && (
                    <form onSubmit={handleTeamMemberAdd} className={styles.add_member_form}>
                      <input 
                        type="text"
                        value={newTeamMember}
                        onChange={(e) => setNewTeamMember(e.target.value)}
                        placeholder="새 팀원 이름"
                        className={styles.member_input}
                      />
                      <button 
                        type="submit" 
                        className={styles.add_member_button}
                        disabled={!newTeamMember.trim()}
                      >
                        <HiPlus />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* 작업 수 카드 */}
              <div className={styles.info_card}>
                <div className={styles.info_card_header}>
                  <HiDocumentText className={styles.info_card_icon} />
                  <h4>작업 개수</h4>
                </div>
                <div className={styles.task_count}>
                  <span>{selectedProject.tasks.length}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 프로젝트 추가 모달 */}
      {showAddForm && (
        <div className={styles.modal_wrapper}>
          <div className={styles.modal_background} onClick={handleCloseAddForm}></div>
          <div className={styles.modal_panel}>
            <div className={styles.panel_header}>
              <div className={styles.panel_title}>
                <h2>새 프로젝트 추가</h2>
              </div>
              <button className={styles.close_button} onClick={handleCloseAddForm}>
                <HiX />
              </button>
            </div>
            <div className={styles.panel_content}>
              <form onSubmit={handleAddProject}>
                <div className={styles.form_group}>
                  <label>프로젝트명</label>
                  <input 
                    type="text" 
                    name="title"
                    value={newProject.title}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className={styles.form_group}>
                  <label>설명</label>
                  <textarea 
                    name="description"
                    value={newProject.description}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <div className={styles.form_row}>
                  <div className={styles.form_group}>
                    <label>상태</label>
                    <select 
                      name="status"
                      value={newProject.status}
                      onChange={handleInputChange}
                    >
                      <option value="concept">Concept</option>
                      <option value="development">Development</option>
                      <option value="pre_production">Pre-Production</option>
                      <option value="production">Production</option>
                      <option value="post_production">Post-Production</option>
                      <option value="vfx">VFX/CG</option>
                      <option value="sound_design">Sound Design</option>
                      <option value="quality_check">Quality Check</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                  <div className={styles.form_group}>
                    <label>마감일</label>
                    <input 
                      type="date" 
                      name="deadline"
                      value={newProject.deadline}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                <div className={styles.form_actions}>
                  <button type="button" className={styles.cancel_button} onClick={handleCloseAddForm}>
                    취소
                  </button>
                  <button type="submit" className={styles.save_button}>
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatus; 