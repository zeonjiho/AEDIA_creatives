import React, { useState } from 'react';
import styles from './ProjectDetailModal.module.css';
import { 
  HiX, HiPencil, HiSave, HiPlus,
  HiInformationCircle, HiTag, HiChartBar, HiCalendar, 
  HiUserGroup, HiLightBulb, HiDocumentText
} from 'react-icons/hi';

const ProjectDetailModal = ({ 
  selectedProject, 
  onClose, 
  onProjectUpdate 
}) => {
  const [editingProjectStatus, setEditingProjectStatus] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState('');

  if (!selectedProject) return null;

  const handleStatusChange = (newStatus) => {
    const updatedProject = { ...selectedProject, status: newStatus };
    onProjectUpdate(updatedProject);
    setEditingProjectStatus(false);
  };

  const handleProgressChange = (e) => {
    const newProgress = parseInt(e.target.value);
    const updatedProject = { ...selectedProject, progress: newProgress };
    onProjectUpdate(updatedProject);
  };

  const handleSaveProgress = () => {
    setEditingProgress(false);
  };

  const handleDeadlineChange = (e) => {
    const newDeadline = e.target.value;
    const updatedProject = { ...selectedProject, deadline: newDeadline };
    onProjectUpdate(updatedProject);
  };

  const handleSaveDeadline = () => {
    setEditingDeadline(false);
  };

  const handleTeamMemberRemove = (memberToRemove) => {
    const updatedTeam = selectedProject.team.filter(member => member !== memberToRemove);
    const updatedProject = { ...selectedProject, team: updatedTeam };
    onProjectUpdate(updatedProject);
  };

  const handleTeamMemberAdd = (e) => {
    e.preventDefault();
    
    if (!newTeamMember.trim()) return;
    
    const updatedTeam = [...selectedProject.team, newTeamMember.trim()];
    const updatedProject = { ...selectedProject, team: updatedTeam };
    onProjectUpdate(updatedProject);
    
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

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.modal_background} onClick={onClose}></div>
      <div className={styles.modal_panel}>
        <div className={styles.panel_header}>
          <div className={styles.panel_title}>
            <h2>{selectedProject.title}</h2>
          </div>
          <button className={styles.close_button} onClick={onClose}>
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
  );
};

export default ProjectDetailModal; 