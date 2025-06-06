import React, { useState } from 'react';
import styles from './ProjectDetailModal.module.css';
import { 
  HiX, HiPencil, HiSave, HiPlus,
  HiInformationCircle, HiTag, HiChartBar, HiCalendar, 
  HiUserGroup, HiLightBulb, HiDocumentText, HiUsers,
  HiPhotograph, HiTrash, HiCheck, HiClock, HiUser
} from 'react-icons/hi';
import StaffSearchModal from '../StaffSearchModal/StaffSearchModal';
import api from '../../utils/api';
import getProjectThumbnail from '../../utils/getProjectThumbnail';

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [currentStaffCategory, setCurrentStaffCategory] = useState('');

  // 썸네일 관련 상태
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // 프로젝트 개요 편집 상태
  const [tempDescription, setTempDescription] = useState('');

  // 프로젝트 제목 편집 상태
  const [tempTitle, setTempTitle] = useState('');

  // 로딩 상태
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  // Todo 관련 상태
  const [todos, setTodos] = useState([
    {
      _id: 'todo1',
      text: '프로젝트 기획서 작성',
      completed: false,
      dueDate: '2024-01-15',
      dueTime: '14:00',
      projectId: selectedProject?.id,
      poster: { name: '김민수' }
    },
    {
      _id: 'todo2', 
      text: '스토리보드 제작',
      completed: true,
      dueDate: '2024-01-12',
      dueTime: '10:00',
      projectId: selectedProject?.id,
      poster: { name: '이영희' }
    },
    {
      _id: 'todo3',
      text: '촬영 장비 준비',
      completed: false,
      dueDate: '2024-01-18',
      dueTime: '09:30',
      projectId: selectedProject?.id,
      poster: { name: '박정호' }
    }
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newTodoDueTime, setNewTodoDueTime] = useState('');
  const [showAddTodo, setShowAddTodo] = useState(false);

  if (!selectedProject) return null;

  // 서버 업데이트 함수
  const updateProjectOnServer = async (updates) => {
    try {
      setIsUpdating(true);
      console.log('프로젝트 업데이트 요청:', updates);
      
      const response = await api.put(`/projects/${selectedProject._id || selectedProject.id}`, updates);
      
      if (response.status === 200) {
        console.log('프로젝트 업데이트 성공:', response.data.project);
        
        // 부모 컴포넌트에 업데이트된 프로젝트 전달
        const updatedProject = {
          ...response.data.project,
          id: response.data.project._id || response.data.project.id
        };
    onProjectUpdate(updatedProject);
        
        return updatedProject;
      }
    } catch (error) {
      console.error('프로젝트 업데이트 실패:', error);
      
      let errorMessage = '프로젝트 업데이트 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProjectOnServer({ 
        ...selectedProject,
        status: newStatus 
      });
    setEditingProjectStatus(false);
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleProgressChange = (e) => {
    const newProgress = parseInt(e.target.value);
    // 로컬 상태만 임시 업데이트 (저장 버튼 클릭 시 서버 전송)
    const updatedProject = { ...selectedProject, progress: newProgress };
    onProjectUpdate(updatedProject);
  };

  const handleSaveProgress = async () => {
    try {
      await updateProjectOnServer(selectedProject);
    setEditingProgress(false);
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleDeadlineChange = (e) => {
    const newDeadline = e.target.value;
    // 로컬 상태만 임시 업데이트
    const updatedProject = { ...selectedProject, deadline: newDeadline };
    onProjectUpdate(updatedProject);
  };

  const handleSaveDeadline = async () => {
    try {
      await updateProjectOnServer(selectedProject);
    setEditingDeadline(false);
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  // 팀원 관리 함수들
  const handleTeamMemberRemove = async (memberToRemove) => {
    try {
    let updatedTeam;
    if (typeof memberToRemove === 'string') {
      updatedTeam = selectedProject.team.filter(member => member !== memberToRemove);
    } else {
      updatedTeam = selectedProject.team.filter(member => 
          (typeof member === 'string' ? member : member._id || member.id) !== (typeof memberToRemove === 'string' ? memberToRemove : memberToRemove._id || memberToRemove.id)
        );
      }
      
      await updateProjectOnServer({
        ...selectedProject,
        team: updatedTeam
      });
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleTeamModalOpen = () => {
    setShowTeamModal(true);
  };

  const handleTeamSelect = async (selectedPeople) => {
    try {
    const currentTeam = selectedProject.team || [];
    const newMembers = selectedPeople.filter(person => 
      !currentTeam.some(member => 
          (typeof member === 'string' ? member : member._id || member.id) === (person._id || person.id)
      )
    );
    
    const updatedTeam = [...currentTeam, ...newMembers];
      
      await updateProjectOnServer({
        ...selectedProject,
        team: updatedTeam
      });
      
    setShowTeamModal(false);
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  // 스탭 관리 함수들
  const handleStaffModalOpen = (category) => {
    setCurrentStaffCategory(category);
    setShowStaffModal(true);
  };

  const handleStaffSelect = async (selectedPeople) => {
    try {
      const currentStaffList = selectedProject.staffList || [];
      
      // 새로운 스탭 리스트 구조로 변환
      const updatedStaffList = [...currentStaffList];
      
      // 해당 카테고리의 기존 역할 찾기 또는 새로 생성
      let categoryRole = updatedStaffList.find(role => role.roleName === currentStaffCategory);
      
      if (!categoryRole) {
        categoryRole = {
          roleName: currentStaffCategory,
          members: []
        };
        updatedStaffList.push(categoryRole);
      }
      
      // 새로운 멤버들 추가 (중복 제거)
      const existingMemberIds = categoryRole.members.map(m => m.userId || m._id || m.id);
      const newMembers = selectedPeople
        .filter(person => !existingMemberIds.includes(person._id || person.id))
        .map(person => ({
          userId: person._id || person.id,
          name: person.name,
          department: person.department,
          phone: person.phone,
          email: person.email
        }));
      
      categoryRole.members = [...categoryRole.members, ...newMembers];
      
      await updateProjectOnServer({
        ...selectedProject,
        staffList: updatedStaffList
      });
      
    setShowStaffModal(false);
    setCurrentStaffCategory('');
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleRemoveStaff = async (category, personId) => {
    try {
      const currentStaffList = selectedProject.staffList || [];
      const updatedStaffList = currentStaffList.map(role => {
        if (role.roleName === category) {
          return {
            ...role,
            members: role.members.filter(member => 
              (member.userId || member._id || member.id) !== personId
            )
    };
        }
        return role;
      });
      
      await updateProjectOnServer({
        ...selectedProject,
        staffList: updatedStaffList
      });
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
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

  const handleSaveThumbnail = async () => {
    if (!thumbnailFile) {
      alert('선택된 파일이 없습니다.');
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      
      // 1. 썸네일 업로드
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);
      
      console.log('썸네일 업로드 시작:', thumbnailFile.name);
      
      const uploadResponse = await api.post('/upload-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.status === 200) {
        const filename = uploadResponse.data.filename;
        console.log('썸네일 업로드 성공:', filename);
        
        // 2. 프로젝트 업데이트 (파일명만 저장)
        await updateProjectOnServer({
          ...selectedProject,
          thumbnail: filename // 파일명만 저장
        });
        
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
        
        // 파일 input 초기화
        const fileInput = document.getElementById('thumbnail-input-detail');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('썸네일 업데이트 실패:', error);
      
      let errorMessage = '썸네일 업데이트 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleCancelThumbnail = () => {
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // 파일 input 초기화
    const fileInput = document.getElementById('thumbnail-input-detail');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveThumbnail = async () => {
    try {
      const defaultThumbnail = 'default_thumbnail.jpeg'; // 기본 썸네일 파일명
      
      await updateProjectOnServer({
      ...selectedProject, 
      thumbnail: defaultThumbnail 
      });
      
    setEditingThumbnail(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  // 프로젝트 개요 편집 함수들
  const handleDescriptionEdit = () => {
    setTempDescription(selectedProject.description);
    setEditingDescription(true);
  };

  const handleDescriptionSave = async () => {
    try {
      await updateProjectOnServer({
      ...selectedProject, 
      description: tempDescription 
      });
      
    setEditingDescription(false);
    setTempDescription('');
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleDescriptionCancel = () => {
    setEditingDescription(false);
    setTempDescription('');
  };

  // 프로젝트 제목 편집 함수들
  const handleTitleEdit = () => {
    setTempTitle(selectedProject.title);
    setEditingTitle(true);
  };

  const handleTitleSave = async () => {
    try {
      if (!tempTitle.trim()) {
        alert('프로젝트 제목을 입력해주세요.');
        return;
      }

      await updateProjectOnServer({
        ...selectedProject,
        title: tempTitle.trim()
      });
      
      setEditingTitle(false);
      setTempTitle('');
    } catch (error) {
      // 에러는 updateProjectOnServer에서 처리됨
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  // Todo 관련 함수들
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo = {
      _id: `todo${Date.now()}`,
      text: newTodoText,
      completed: false,
      dueDate: newTodoDueDate || new Date().toISOString().split('T')[0],
      dueTime: newTodoDueTime || null,
      projectId: selectedProject.id,
      poster: { name: '현재 사용자' } // 실제로는 로그인한 사용자 정보
    };

    setTodos([newTodo, ...todos]);
    setNewTodoText('');
    setNewTodoDueDate('');
    setNewTodoDueTime('');
    setShowAddTodo(false);
  };

  const handleToggleTodo = (todoId) => {
    setTodos(todos.map(todo => 
      todo._id === todoId ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (todoId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setTodos(todos.filter(todo => todo._id !== todoId));
    }
  };

  // 날짜 포맷팅 함수 (TodoList와 동일)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
    }
  };

  const formatDateTime = (dateString, timeString) => {
    const formattedDate = formatDate(dateString);
    
    if (!timeString) return formattedDate;
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    let timeFormat = '';
    if (hour < 12) {
      timeFormat = `오전 ${hour}시`;
    } else if (hour === 12) {
      timeFormat = `오후 12시`;
    } else {
      timeFormat = `오후 ${hour - 12}시`;
    }
    
    if (minute > 0) {
      timeFormat += ` ${minute}분`;
    }
    
    return `${formattedDate} ${timeFormat}`;
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    return date < today;
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
    return (selectedProject.team || [])
      .filter(member => member) // 유효한 멤버만 필터링
      .map(member => {
      if (typeof member === 'string') {
        return {
          id: `temp_${member}`,
            _id: `temp_${member}`,
          name: member,
            userType: 'employee',
            roles: ['팀원'],
          position: '팀원',
            department: '프로젝트팀',
            phone: '',
            email: ''
        };
      }
        
        // 객체인 경우 안전하게 처리
        return {
          id: member._id || member.id || `temp_${Date.now()}_${Math.random()}`,
          _id: member._id || member.id,
          name: member.name || '이름 없음',
          userType: member.userType || 'internal',
          roles: member.roles || ['팀원'],
          position: member.position || '팀원',
          department: member.department || '프로젝트팀',
          phone: member.phone || '',
          email: member.email || ''
        };
      })
      .filter(member => member.name && member.name !== '이름 없음'); // name이 유효한 멤버만 반환
  };

  // 스탭 카테고리별 멤버 가져오기
  const getStaffByCategory = (category) => {
    if (!selectedProject.staffList || !Array.isArray(selectedProject.staffList)) {
      return [];
    }
    
    const roleData = selectedProject.staffList.find(role => role.roleName === category);
    return roleData ? roleData.members || [] : [];
  };

  // 현재 스탭 카테고리의 선택된 멤버들 가져오기 (StaffSearchModal에 맞는 형태로 변환)
  const getCurrentStaffForModal = () => {
    const staffMembers = getStaffByCategory(currentStaffCategory);
    
    // StaffSearchModal이 기대하는 형태로 변환하고 안전성 확보
    return staffMembers
      .filter(member => member && member.name) // name이 있는 멤버만 필터링
      .map(member => ({
        id: member.userId || member._id || member.id || `temp_${Date.now()}_${Math.random()}`,
        _id: member.userId || member._id || member.id,
        name: member.name || '이름 없음',
        userType: member.userType || 'external',
        roles: member.roles || [currentStaffCategory],
        department: member.department || '소속 없음',
        phone: member.phone || '',
        email: member.email || '',
        position: member.position || currentStaffCategory
      }));
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
            {editingTitle ? (
              <div className={styles.title_editor}>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className={styles.title_input}
                  placeholder="프로젝트 제목을 입력하세요..."
                  disabled={isUpdating}
                  autoFocus
                />
                <div className={styles.title_editor_actions}>
                  <button 
                    className={styles.title_cancel_button}
                    onClick={handleTitleCancel}
                    disabled={isUpdating}
                  >
                    <HiX />
                  </button>
                  <button 
                    className={styles.title_save_button}
                    onClick={handleTitleSave}
                    disabled={isUpdating || !tempTitle.trim()}
                  >
                    <HiSave />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.title_display}>
            <h2>{selectedProject.title}</h2>
                <button 
                  className={styles.edit_title_button}
                  onClick={handleTitleEdit}
                  disabled={isUpdating}
                >
                  <HiPencil />
                </button>
              </div>
            )}
            {isUpdating && <span className={styles.updating_indicator}>업데이트 중...</span>}
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
                    src={thumbnailPreview || getProjectThumbnail(selectedProject.thumbnail)} 
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
                        disabled={isUploadingThumbnail}
                      />
                      <button
                        type="button"
                        className={styles.thumbnail_remove_button}
                        onClick={handleRemoveThumbnail}
                        disabled={isUploadingThumbnail}
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
                    disabled={isUploadingThumbnail}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.save_button}
                    onClick={handleSaveThumbnail}
                    disabled={!thumbnailFile || isUploadingThumbnail}
                  >
                    <HiSave /> {isUploadingThumbnail ? '업로드 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={styles.thumbnail_display_banner}
                onClick={() => !isUpdating && setEditingThumbnail(true)}
              >
                {/* 일반 모드 스켈레톤 */}
                {!thumbnailLoaded && (
                  <div className={styles.image_skeleton_banner}>
                    <div className={styles.skeleton_animation_banner}></div>
                  </div>
                )}
                
                <img 
                  src={getProjectThumbnail(selectedProject.thumbnail)} 
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
                disabled={isUpdating}
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
                  disabled={isUpdating}
                />
                <div className={styles.description_editor_actions}>
                  <button 
                    className={styles.cancel_button}
                    onClick={handleDescriptionCancel}
                    disabled={isUpdating}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.save_button}
                    onClick={handleDescriptionSave}
                    disabled={isUpdating}
                  >
                    <HiSave /> {isUpdating ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={styles.project_description}
                onClick={() => !isUpdating && handleDescriptionEdit()}
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
                      onClick={() => !isUpdating && handleStatusChange(status)}
                    >
                      {getStatusText(status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className={`${styles.status_display} ${getStatusClass(selectedProject.status)}`}
                  onClick={() => !isUpdating && setEditingProjectStatus(true)}
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
                  onClick={() => !isUpdating && setEditingProgress(true)}
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
                    disabled={isUpdating}
                  />
                  <div className={styles.progress_editor_actions}>
                    <button 
                      className={styles.save_button}
                      onClick={handleSaveProgress}
                      disabled={isUpdating}
                    >
                      <HiSave /> {isUpdating ? '저장 중...' : '저장'}
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
                    disabled={isUpdating}
                  />
                  <button 
                    className={styles.save_button}
                    onClick={handleSaveDeadline}
                    disabled={isUpdating}
                  >
                    <HiSave /> {isUpdating ? '저장 중...' : '저장'}
                  </button>
                </div>
              ) : (
                <div 
                  className={styles.deadline_display}
                  onClick={() => !isUpdating && setEditingDeadline(true)}
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
                  disabled={isUpdating}
                >
                  <HiPlus /> 팀원 추가
                </button>
                <button 
                  className={styles.edit_team_button}
                  onClick={() => !isUpdating && setEditingTeam(!editingTeam)}
                  disabled={isUpdating}
                >
                  {editingTeam ? <HiX /> : <HiPencil />}
                </button>
              </div>
            </div>
            
            <div className={styles.team_members}>
              {(!selectedProject.team || selectedProject.team.length === 0) ? (
                <div className={styles.no_members}>
                  <HiLightBulb />
                  <p>할당된 팀원이 없습니다</p>
                </div>
              ) : (
                selectedProject.team.map((member, index) => {
                  const memberName = typeof member === 'string' ? member : member.name;
                  const memberPosition = typeof member === 'string' ? '' : member.position;
                  const memberId = typeof member === 'string' ? `temp_${index}` : (member._id || member.id);
                  
                  return (
                    <div key={memberId} className={styles.member_chip}>
                      <span>{memberName}</span>
                      {memberPosition && <span className={styles.member_position}>({memberPosition})</span>}
                      {editingTeam && (
                        <button 
                          className={styles.remove_member_button}
                          onClick={() => handleTeamMemberRemove(member)}
                          disabled={isUpdating}
                        >
                          <HiX />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 스탭 섹션 (외부 인력) */}
          <div className={styles.staff_section}>
            <div className={styles.staff_header}>
              <h3><HiUsers /> 스탭 (외부 인력)</h3>
              <button 
                className={styles.edit_staff_button}
                onClick={() => !isUpdating && setEditingStaff(!editingStaff)}
                disabled={isUpdating}
              >
                {editingStaff ? <HiX /> : <HiPencil />}
              </button>
            </div>
            
            <div className={styles.staff_categories}>
              {staffCategories.map(category => {
                const staffMembers = getStaffByCategory(category);
                
                return (
                <div key={category} className={styles.staff_category}>
                  <div className={styles.category_header}>
                    <h4>{category}</h4>
                    {editingStaff && (
                      <button
                        type="button"
                        className={styles.add_staff_button}
                        onClick={() => handleStaffModalOpen(category)}
                          disabled={isUpdating}
                      >
                        <HiPlus />
                      </button>
                    )}
                  </div>
                  <div className={styles.staff_members}>
                      {staffMembers.length === 0 ? (
                      <p className={styles.no_staff}>배정된 스탭이 없습니다</p>
                    ) : (
                        staffMembers.map(person => (
                          <div key={person.userId || person._id || person.id} className={styles.staff_member}>
                          <span className={styles.member_name}>{person.name}</span>
                            <span className={styles.member_info}>({person.department || '소속 없음'})</span>
                          {person.phone && <span className={styles.member_phone}>📞 {person.phone}</span>}
                          {person.isExternal && <span className={styles.external_badge}>외부</span>}
                          {editingStaff && (
                            <button
                              type="button"
                              className={styles.remove_staff_button}
                                onClick={() => handleRemoveStaff(category, person.userId || person._id || person.id)}
                                disabled={isUpdating}
                            >
                              <HiX />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                );
              })}
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
        from="only_internal"
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
        selectedPeople={getCurrentStaffForModal()}
        from="contact"
        title={`${currentStaffCategory} 스탭 선택`}
        multiSelect={true}
        initialFilterType="staff"
      />
    </div>
  );
};

export default ProjectDetailModal; 