import React, { useState } from 'react';
import styles from './ProjectDetailModal.module.css';
import { 
  HiX, HiPencil, HiSave, HiPlus,
  HiInformationCircle, HiTag, HiChartBar, HiCalendar, 
  HiUserGroup, HiLightBulb, HiDocumentText, HiUsers,
  HiPhotograph, HiTrash
} from 'react-icons/hi';
import StaffSearchModal from '../StaffSearchModal/StaffSearchModal';

const ProjectDetailModal = ({ 
  selectedProject, 
  onClose, 
  onProjectUpdate 
}) => {
  const [editingProjectStatus, setEditingProjectStatus] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);
  const [editingThumbnail, setEditingThumbnail] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [currentStaffCategory, setCurrentStaffCategory] = useState('');

  // 썸네일 관련 상태
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // 프로젝트 개요 편집 상태
  const [tempDescription, setTempDescription] = useState('');

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

  // 팀원 관리 함수들
  const handleTeamMemberRemove = (memberToRemove) => {
    let updatedTeam;
    if (typeof memberToRemove === 'string') {
      updatedTeam = selectedProject.team.filter(member => member !== memberToRemove);
    } else {
      updatedTeam = selectedProject.team.filter(member => 
        (typeof member === 'string' ? member : member.id) !== (typeof memberToRemove === 'string' ? memberToRemove : memberToRemove.id)
      );
    }
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

  const handleTeamModalOpen = () => {
    setShowTeamModal(true);
  };

  const handleTeamSelect = (selectedPeople) => {
    const currentTeam = selectedProject.team || [];
    const newMembers = selectedPeople.filter(person => 
      !currentTeam.some(member => 
        (typeof member === 'string' ? member : member.name) === person.name
      )
    );
    
    const updatedTeam = [...currentTeam, ...newMembers];
    const updatedProject = { ...selectedProject, team: updatedTeam };
    onProjectUpdate(updatedProject);
    setShowTeamModal(false);
  };

  // 스탭 관리 함수들
  const handleStaffModalOpen = (category) => {
    setCurrentStaffCategory(category);
    setShowStaffModal(true);
  };

  const handleStaffSelect = (selectedPeople) => {
    const currentStaffList = selectedProject.staffList || {
      '연출': [], '조연출': [], '제작 PD': [], '촬영감독': [], '조명감독': [],
      '미술감독': [], '지미집': [], 'CG': [], '클리닝': [], 'DI': []
    };
    
    const updatedStaffList = {
      ...currentStaffList,
      [currentStaffCategory]: selectedPeople
    };
    
    const updatedProject = { ...selectedProject, staffList: updatedStaffList };
    onProjectUpdate(updatedProject);
    setShowStaffModal(false);
    setCurrentStaffCategory('');
  };

  const handleRemoveStaff = (category, personId) => {
    const currentStaffList = selectedProject.staffList || {};
    const updatedStaffList = {
      ...currentStaffList,
      [category]: (currentStaffList[category] || []).filter(person => person.id !== personId)
    };
    
    const updatedProject = { ...selectedProject, staffList: updatedStaffList };
    onProjectUpdate(updatedProject);
  };

  // 썸네일 관리 함수들
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      
      // 파일 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveThumbnail = () => {
    if (thumbnailPreview) {
      const updatedProject = { 
        ...selectedProject, 
        thumbnail: thumbnailPreview 
      };
      onProjectUpdate(updatedProject);
    }
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleCancelThumbnail = () => {
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // 파일 input 초기화
    const fileInput = document.getElementById('thumbnail-input-detail');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveThumbnail = () => {
    const defaultThumbnail = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085';
    const updatedProject = { 
      ...selectedProject, 
      thumbnail: defaultThumbnail 
    };
    onProjectUpdate(updatedProject);
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  // 프로젝트 개요 편집 함수들
  const handleDescriptionEdit = () => {
    setTempDescription(selectedProject.description);
    setEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    const updatedProject = { 
      ...selectedProject, 
      description: tempDescription 
    };
    onProjectUpdate(updatedProject);
    setEditingDescription(false);
    setTempDescription('');
  };

  const handleDescriptionCancel = () => {
    setEditingDescription(false);
    setTempDescription('');
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

  // 현재 팀원을 StaffSearchModal에서 인식할 수 있는 형태로 변환
  const getCurrentTeamForModal = () => {
    return selectedProject.team.map(member => {
      if (typeof member === 'string') {
        return {
          id: `temp_${member}`,
          name: member,
          type: 'employee',
          position: '팀원',
          department: '프로젝트팀'
        };
      }
      return member;
    });
  };

  const staffCategories = [
    '연출', '조연출', '제작 PD', '촬영감독', '조명감독', 
    '미술감독', '지미집', 'CG', '클리닝', 'DI'
  ];

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
          {/* 썸네일 배너 (노션 스타일) */}
          <div className={styles.thumbnail_banner}>
            {editingThumbnail ? (
              <div className={styles.thumbnail_editor_banner}>
                <div className={styles.thumbnail_preview_banner}>
                  {/* 편집 모드 스켈레톤 */}
                  {!thumbnailLoaded && !thumbnailPreview && (
                    <div className={styles.image_skeleton_banner}>
                      <div className={styles.skeleton_animation_banner}></div>
                    </div>
                  )}
                  
                  <img 
                    src={thumbnailPreview || selectedProject.thumbnail} 
                    alt="썸네일 미리보기"
                    className={`${styles.thumbnail_image_banner} ${thumbnailLoaded || thumbnailPreview ? styles.loaded : styles.loading}`}
                    onLoad={() => setThumbnailLoaded(true)}
                    style={{ display: thumbnailLoaded || thumbnailPreview ? 'block' : 'none' }}
                  />
                  <div className={styles.thumbnail_overlay_banner}>
                    <div className={styles.thumbnail_actions}>
                      <label htmlFor="thumbnail-input-detail" className={styles.thumbnail_upload_button}>
                        <HiPhotograph />
                        이미지 선택
                      </label>
                      <input
                        id="thumbnail-input-detail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className={styles.thumbnail_remove_button}
                        onClick={handleRemoveThumbnail}
                      >
                        <HiTrash />
                        기본으로
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.thumbnail_editor_actions_banner}>
                  <button 
                    className={styles.cancel_button}
                    onClick={handleCancelThumbnail}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.save_button}
                    onClick={handleSaveThumbnail}
                    disabled={!thumbnailPreview}
                  >
                    <HiSave /> 저장
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={styles.thumbnail_display_banner}
                onClick={() => setEditingThumbnail(true)}
              >
                {/* 일반 모드 스켈레톤 */}
                {!thumbnailLoaded && (
                  <div className={styles.image_skeleton_banner}>
                    <div className={styles.skeleton_animation_banner}></div>
                  </div>
                )}
                
                <img 
                  src={selectedProject.thumbnail} 
                  alt="프로젝트 썸네일"
                  className={`${styles.thumbnail_image_banner} ${thumbnailLoaded ? styles.loaded : styles.loading}`}
                  onLoad={() => setThumbnailLoaded(true)}
                  style={{ display: thumbnailLoaded ? 'block' : 'none' }}
                />
                <div className={styles.thumbnail_edit_overlay_banner}>
                  <HiPencil className={styles.edit_icon} />
                  <span>클릭하여 편집</span>
                </div>
              </div>
            )}
          </div>

          {/* 프로젝트 개요 섹션 */}
          <div className={styles.content_section}>
            <div className={styles.description_header}>
              <h3><HiInformationCircle /> 프로젝트 개요</h3>
              <button 
                className={styles.edit_description_button}
                onClick={() => editingDescription ? handleDescriptionCancel() : handleDescriptionEdit()}
              >
                {editingDescription ? <HiX /> : <HiPencil />}
              </button>
            </div>
            
            {editingDescription ? (
              <div className={styles.description_editor}>
                <textarea 
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className={styles.description_textarea}
                  placeholder="프로젝트 설명을 입력하세요..."
                />
                <div className={styles.description_editor_actions}>
                  <button 
                    className={styles.cancel_button}
                    onClick={handleDescriptionCancel}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.save_button}
                    onClick={handleDescriptionSave}
                  >
                    <HiSave /> 저장
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={styles.project_description}
                onClick={handleDescriptionEdit}
              >
                {selectedProject.description}
                <div className={styles.description_edit_hint}>
                  <HiPencil className={styles.edit_icon} />
                  <span>클릭하여 편집</span>
                </div>
              </div>
            )}
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

          {/* 팀원 섹션 (내부 직원) */}
          <div className={styles.team_section}>
            <div className={styles.team_header}>
              <h3><HiUserGroup /> 팀원 (내부 직원)</h3>
              <div className={styles.team_actions}>
                <button 
                  className={styles.search_team_button}
                  onClick={handleTeamModalOpen}
                >
                  <HiPlus /> 팀원 추가
                </button>
                <button 
                  className={styles.edit_team_button}
                  onClick={() => setEditingTeam(!editingTeam)}
                >
                  {editingTeam ? <HiX /> : <HiPencil />}
                </button>
              </div>
            </div>
            
            <div className={styles.team_members}>
              {selectedProject.team.length === 0 ? (
                <div className={styles.no_members}>
                  <HiLightBulb />
                  <p>할당된 팀원이 없습니다</p>
                </div>
              ) : (
                selectedProject.team.map((member, index) => {
                  const memberName = typeof member === 'string' ? member : member.name;
                  const memberPosition = typeof member === 'string' ? '' : member.position;
                  return (
                    <div key={index} className={styles.member_chip}>
                      <span>{memberName}</span>
                      {memberPosition && <span className={styles.member_position}>({memberPosition})</span>}
                      {editingTeam && (
                        <button 
                          className={styles.remove_member_button}
                          onClick={() => handleTeamMemberRemove(member)}
                        >
                          <HiX />
                        </button>
                      )}
                    </div>
                  );
                })
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

          {/* 스탭 섹션 (외부 인력) */}
          <div className={styles.staff_section}>
            <div className={styles.staff_header}>
              <h3><HiUsers /> 스탭 (외부 인력)</h3>
              <button 
                className={styles.edit_staff_button}
                onClick={() => setEditingStaff(!editingStaff)}
              >
                {editingStaff ? <HiX /> : <HiPencil />}
              </button>
            </div>
            
            <div className={styles.staff_categories}>
              {staffCategories.map(category => (
                <div key={category} className={styles.staff_category}>
                  <div className={styles.category_header}>
                    <h4>{category}</h4>
                    {editingStaff && (
                      <button
                        type="button"
                        className={styles.add_staff_button}
                        onClick={() => handleStaffModalOpen(category)}
                      >
                        <HiPlus />
                      </button>
                    )}
                  </div>
                  <div className={styles.staff_members}>
                    {(!selectedProject.staffList || !selectedProject.staffList[category] || selectedProject.staffList[category].length === 0) ? (
                      <p className={styles.no_staff}>배정된 스탭이 없습니다</p>
                    ) : (
                      selectedProject.staffList[category].map(person => (
                        <div key={person.id} className={styles.staff_member}>
                          <span className={styles.member_name}>{person.name}</span>
                          <span className={styles.member_info}>({person.position})</span>
                          {person.phone && <span className={styles.member_phone}>📞 {person.phone}</span>}
                          {person.isExternal && <span className={styles.external_badge}>외부</span>}
                          {editingStaff && (
                            <button
                              type="button"
                              className={styles.remove_staff_button}
                              onClick={() => handleRemoveStaff(category, person.id)}
                            >
                              <HiX />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
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

      {/* 팀원 검색 모달 */}
      <StaffSearchModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSelect={handleTeamSelect}
        selectedPeople={getCurrentTeamForModal()}
        title="팀원 추가 (내부 직원)"
        multiSelect={true}
        initialFilterType="employee"
      />

      {/* 스탭 검색 모달 */}
      <StaffSearchModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setCurrentStaffCategory('');
        }}
        onSelect={handleStaffSelect}
        selectedPeople={selectedProject.staffList?.[currentStaffCategory] || []}
        title={`${currentStaffCategory} 스탭 선택`}
        multiSelect={true}
        initialFilterType="staff"
      />
    </div>
  );
};

export default ProjectDetailModal; 