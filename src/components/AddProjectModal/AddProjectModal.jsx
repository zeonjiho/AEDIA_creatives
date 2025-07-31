import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './AddProjectModal.module.css';
import { HiX, HiPlus, HiUserGroup, HiPhotograph, HiTrash } from 'react-icons/hi';
import StaffSearchModal from '../StaffSearchModal/StaffSearchModal';
import api from '../../utils/api';
import getProjectThumbnail from '../../utils/getProjectThumbnail';

const AddProjectModal = ({ isOpen, onClose, onAddProject }) => {
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'concept',
    deadline: new Date().toISOString().split('T')[0],
    thumbnail: 'default_thumbnail.jpeg'
  });

  // 스탭리스트 상태 - 유연한 구조로 변경
  const [staffList, setStaffList] = useState([]);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [currentStaffCategory, setCurrentStaffCategory] = useState('');

  // 썸네일 관련 상태
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let thumbnailFileName = null;
      
      // 1. 썸네일 파일이 있으면 먼저 업로드
      if (thumbnailFile) {
        setIsUploading(true);
        console.log('썸네일 업로드 시작:', thumbnailFile.name);
        
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        
        const uploadResponse = await api.post('/upload-thumbnail', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadResponse.status === 200) {
          thumbnailFileName = uploadResponse.data.filename; // 파일명만 저장
          console.log('썸네일 업로드 성공:', thumbnailFileName);
        }
        setIsUploading(false);
      }
      
      // 2. 프로젝트 데이터 구성
      const projectData = {
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        status: newProject.status,
        deadline: newProject.deadline,
        thumbnail: thumbnailFileName || 'default_thumbnail.jpeg', // 파일명만 저장
        staffList: staffList.map(person => ({
          roleName: person.roles && person.roles.length > 0 ? person.roles[0] : '기타',
          members: [{
            userId: person._id || person.id,
            name: person.name,
            department: person.department,
            phone: person.phone,
            email: person.email
          }]
        })),
        team: [], // 초기에는 빈 배열
        tasks: [] // 초기에는 빈 배열
      };
      
      console.log('프로젝트 생성 요청:', projectData);
      
      // 3. 프로젝트 생성 API 호출
      const response = await api.post('/add-project', projectData);
      
      if (response.status === 200) {
        console.log('프로젝트 생성 성공:', response.data);
        alert('프로젝트가 성공적으로 생성되었습니다.');
        
        // 부모 컴포넌트에 새 프로젝트 전달
        if (onAddProject) {
          onAddProject(response.data.project);
        }
        
        // 폼 초기화
        setNewProject({
          title: '',
          description: '',
          status: 'concept',
          deadline: new Date().toISOString().split('T')[0],
          thumbnail: 'default_thumbnail.jpeg'
        });
        setStaffList([]);
        setThumbnailFile(null);
        setThumbnailPreview(null);
      }
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      
      let errorMessage = '프로젝트 생성 중 오류가 발생했습니다.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || '입력 정보를 확인해주세요.';
      } else if (error.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setNewProject({
      title: '',
      description: '',
      status: 'concept',
      deadline: new Date().toISOString().split('T')[0],
      thumbnail: 'default_thumbnail.jpeg'
    });
    setStaffList([]);
    // 썸네일 상태 초기화
    setThumbnailFile(null);
    setThumbnailPreview(null);
    onClose();
  };

  const handleAddStaff = (category) => {
    console.log('스탭 추가 버튼 클릭:', category);
    setCurrentStaffCategory(category);
    setShowStaffModal(true);
    console.log('스탭 모달 상태:', true);
  };

  const handleStaffSelect = (selectedPeople) => {
    console.log('선택된 스탭:', selectedPeople);
    
    // 기존 스탭리스트와 새로 선택된 스탭들을 합치되, 중복 제거
    setStaffList(prev => {
      const existingIds = prev.map(person => person._id || person.id);
      const newStaff = selectedPeople.filter(person => 
        !existingIds.includes(person._id || person.id)
      );
      return [...prev, ...newStaff];
    });
    
    setShowStaffModal(false);
    setCurrentStaffCategory('');
  };

  const handleRemoveStaff = (personId) => {
    setStaffList(prev => prev.filter(person => (person._id || person.id) !== personId));
  };

  // 스탭 카테고리를 동적으로 관리
  const getStaffByRole = (role) => {
    return staffList.filter(person => 
      person.roles && person.roles.includes(role)
    );
  };

  const staffCategories = [
    '연출', '조연출', '제작 PD', '촬영감독', '조명감독', 
    '미술감독', '지미집', 'CG', '클리닝', 'DI'
  ];

  // 썸네일 파일 처리 함수들
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

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // 파일 input 초기화
    const fileInput = document.getElementById('thumbnail-input');
    if (fileInput) fileInput.value = '';
  };

  console.log('AddProjectModal 렌더:', { isOpen, showStaffModal, currentStaffCategory });

  return createPortal(
    <div className={styles.modal_wrapper}>
      <div className={styles.modal_background} onClick={handleClose}></div>
      <div className={styles.modal_panel}>
        <div className={styles.panel_header}>
          <div className={styles.panel_title}>
            <h2>새 프로젝트 추가</h2>
          </div>
          <button className={styles.close_button} onClick={handleClose}>
            <HiX />
          </button>
        </div>
        <div className={styles.panel_content}>
          <form onSubmit={handleSubmit}>
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

            {/* 썸네일 섹션 */}
            <div className={styles.form_group}>
              <label>썸네일 이미지</label>
              <div className={styles.thumbnail_section}>
                <div className={styles.thumbnail_preview}>
                  {/* 스켈레톤 */}
                  {!thumbnailLoaded && !thumbnailPreview && (
                    <div className={styles.image_skeleton}>
                      <div className={styles.skeleton_animation}></div>
                    </div>
                  )}
                  
                  <img 
                    src={thumbnailPreview || getProjectThumbnail(newProject.thumbnail)} 
                    alt="썸네일 미리보기"
                    className={`${styles.thumbnail_image} ${thumbnailLoaded || thumbnailPreview ? styles.loaded : styles.loading}`}
                    onLoad={() => setThumbnailLoaded(true)}
                    style={{ display: thumbnailLoaded || thumbnailPreview ? 'block' : 'none' }}
                  />
                  <div className={styles.thumbnail_overlay}>
                    <div className={styles.thumbnail_actions}>
                      <label htmlFor="thumbnail-input" className={styles.thumbnail_upload_button}>
                        <HiPhotograph />
                        이미지 선택
                      </label>
                      <input
                        id="thumbnail-input"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        style={{ display: 'none' }}
                      />
                      {(thumbnailPreview || thumbnailFile) && (
                        <button
                          type="button"
                          className={styles.thumbnail_remove_button}
                          onClick={handleRemoveThumbnail}
                        >
                          <HiTrash />
                          제거
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className={styles.thumbnail_help}>
                  JPG, PNG, GIF 파일을 업로드할 수 있습니다. (최대 10MB)
                </p>
              </div>
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

            {/* 스탭리스트 섹션 */}
            <div className={styles.staff_section}>
              <h3><HiUserGroup /> 스탭리스트</h3>
              <div className={styles.staff_categories}>
                {staffCategories.map(category => (
                  <div key={category} className={styles.staff_category}>
                    <div className={styles.category_header}>
                      <h4>{category}</h4>
                      <button
                        type="button"
                        className={styles.add_staff_button}
                        onClick={() => handleAddStaff(category)}
                      >
                        <HiPlus />
                      </button>
                    </div>
                    <div className={styles.staff_members}>
                      {getStaffByRole(category).length === 0 ? (
                        <p className={styles.no_staff}>배정된 스탭이 없습니다</p>
                      ) : (
                        getStaffByRole(category).map(person => (
                          <div key={person._id || person.id} className={styles.staff_member}>
                            <span className={styles.member_name}>{person.name}</span>
                            <span className={styles.member_info}>
                              ({person.roles && person.roles.length > 0 ? person.roles[0] : '직책 없음'})
                            </span>
                            {person.phone && <span className={styles.member_phone}>📞 {person.phone}</span>}
                            {person.isExternal && <span className={styles.external_badge}>외부</span>}
                            <button
                              type="button"
                              className={styles.remove_staff_button}
                              onClick={() => handleRemoveStaff(person._id || person.id)}
                            >
                              <HiX />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.form_actions}>
              <button 
                type="button" 
                className={styles.cancel_button} 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button 
                type="submit" 
                className={styles.save_button}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  isUploading ? '이미지 업로드 중...' : '프로젝트 생성 중...'
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 스탭 검색 모달 */}
      {showStaffModal && (
        <StaffSearchModal
          isOpen={showStaffModal}
          onClose={() => {
            console.log('스탭 모달 닫기');
            setShowStaffModal(false);
            setCurrentStaffCategory('');
          }}
          onSelect={handleStaffSelect}
          selectedPeople={staffList}
          title={`${currentStaffCategory} 스탭 선택`}
          multiSelect={true}
          initialFilterType="external"
          from="project_add"
        />
      )}
    </div>,
    document.body
  );
};

export default AddProjectModal; 