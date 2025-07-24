import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import {
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaUserCircle,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaUser,
  FaBriefcase,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaGraduationCap,
  FaIdCard,
  FaShieldAlt,
  FaInfoCircle,
  FaCheck
} from 'react-icons/fa';
import api from '../../utils/api';
import { jwtDecode } from 'jwt-decode';
import getProjectThumbnail from '../../utils/getProjectThumbnail';

const Profile = () => {
  const [user, setUser] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('기본정보');
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 아바타 편집 관련 상태
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 로컬 스토리지에서 사용자 ID 가져오기
  const userId = jwtDecode(localStorage.getItem('token')).userId;

  // 슬랙 ID 인증 관련 상태
  const [slackVerification, setSlackVerification] = useState({
    originalSlackId: '',
    verificationCode: '',
    isVerificationSent: false,
    isVerified: false,
    isSlackIdChanged: false
  });

  // 부서 목록 상태
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // 관리자 권한 확인 상태
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // 부서 목록 가져오기
  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await api.get('/departments');
      if (response.status === 200) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('부서 목록 로드 실패:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // 관리자 권한 확인
  const checkAdminAuth = async () => {
    try {
      const response = await api.get(`/company/check-admin/${userId}`);
      if (response.data.isAdmin) {
        setIsAdmin(true);
        setAdminRole(response.data.role);
      } else {
        setIsAdmin(false);
        setAdminRole(null);
      }
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error);
      setIsAdmin(false);
      setAdminRole(null);
    }
  };

  useEffect(() => {
    loadUserProfile();
    loadDepartments(); // 부서 목록도 함께 로드
    checkAdminAuth(); // 관리자 권한 확인
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');

      if (!userId) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      const response = await api.get(`/get-user-info?userId=${userId}`);

      if (response.status === 200) {
        const userInfo = response.data;
        console.log('사용자 정보 로드 완료:', response.data);

        setUser(userInfo);
        setFormData({
          ...userInfo,
          slackId: userInfo.slackId || '', // 슬랙 ID 기본값 설정
          department: userInfo.department?.name || userInfo.department || '' // 부서명 설정
        });
        
        // 슬랙 ID 원본 저장
        setSlackVerification(prev => ({
          ...prev,
          originalSlackId: userInfo.slackId || ''
        }));
      }
    } catch (err) {
      console.error('사용자 정보 로드 실패:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // 편집 취소 시 원래 데이터로 복원
      setFormData({
        ...user,
        slackId: user.slackId || '' // 슬랙 ID 기본값 설정
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setSaveStatus('');
      
      // 슬랙 인증 상태 초기화
      setSlackVerification({
        originalSlackId: user.slackId || '',
        verificationCode: '',
        isVerificationSent: false,
        isVerified: false,
        isSlackIdChanged: false
      });
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'role') {
      // roles 배열의 첫 번째 요소 업데이트
      const updatedRoles = [...(formData.roles || [])];
      updatedRoles[0] = value;
      setFormData({
        ...formData,
        roles: updatedRoles
      });
    } else if (name === 'department') {
      // 부서명 저장
      setFormData({
        ...formData,
        department: value
      });
    } else if (name === 'adminSlackMessage') {
      // 관리자 슬랙 알림 토글
      setFormData({
        ...formData,
        adminSlackMessage: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // 슬랙 ID 변경 감지
      if (name === 'slackId') {
        const isChanged = value !== slackVerification.originalSlackId;
        setSlackVerification(prev => ({
          ...prev,
          isSlackIdChanged: isChanged,
          isVerificationSent: false,
          isVerified: false,
          verificationCode: ''
        }));
      }
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });

    // 비밀번호 확인 검사
    if (name === 'confirmPassword' || (name === 'newPassword' && passwordData.confirmPassword)) {
      if (name === 'newPassword' && value !== passwordData.confirmPassword) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
      } else if (name === 'confirmPassword' && value !== passwordData.newPassword) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
      } else {
        setPasswordError('');
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');

    try {
      if (!userId) {
        setError('로그인이 필요합니다.');
        setSaveStatus('');
        return;
      }

      // 비밀번호 변경 시
      if (activeTab === '비밀번호변경') {
        if (!passwordData.currentPassword) {
          setPasswordError('현재 비밀번호를 입력해주세요.');
          setSaveStatus('');
          return;
        }

        if (!passwordData.newPassword) {
          setPasswordError('새 비밀번호를 입력해주세요.');
          setSaveStatus('');
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordError('비밀번호가 일치하지 않습니다.');
          setSaveStatus('');
          return;
        }

        const response = await api.put(`/change-password?userId=${userId}`, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });

        if (response.status === 200) {
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setPasswordError('');
          setSaveStatus('success');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } else {
        // 프로필 정보 업데이트
        
        // 슬랙 ID가 변경된 경우 인증 확인
        if (slackVerification.isSlackIdChanged && !slackVerification.isVerified) {
          setError('슬랙 ID를 변경하려면 인증번호 확인이 필요합니다.');
          setSaveStatus('');
          return;
        }
        
        console.log('프로필 업데이트 데이터:', formData);
        const response = await api.put(`/update-user-profile?userId=${userId}`, formData);

        if (response.status === 200) {
          const updatedUser = response.data.user;
          setUser(updatedUser);
          setFormData(updatedUser);

          // 로컬 스토리지의 사용자 정보도 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser));

          setSaveStatus('success');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      }
    } catch (err) {
      console.error('저장 실패:', err);

      let errorMessage = '저장 중 오류가 발생했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;

        if (activeTab === '비밀번호변경') {
          setPasswordError(errorMessage);
        }
      }

      if (activeTab !== '비밀번호변경') {
        setError(errorMessage);
      }

      setSaveStatus('');
    }

    setIsEditMode(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPasswordError('');
    setSaveStatus('');
    setError('');
  };

  const getTabIcon = (tabName) => {
    switch (tabName) {
      case '기본정보': return <FaUser />;
      case '직무정보': return <FaBriefcase />;
      case '비밀번호변경': return <FaLock />;
      default: return <FaInfoCircle />;
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      
      // 파일 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      alert('선택된 파일이 없습니다.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // 1. 아바타 업로드
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      console.log('아바타 업로드 시작:', avatarFile.name);
      
      const uploadResponse = await api.post('/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.status === 200) {
        const filename = uploadResponse.data.filename;
        console.log('아바타 업로드 성공:', filename);
        
        // 2. 프로필 업데이트 (파일명만 저장)
        const response = await api.put(`/update-user-profile?userId=${userId}`, {
          avatar: filename // 파일명만 저장
        });
        
        if (response.status === 200) {
          const updatedUser = response.data.user;
          setUser(updatedUser);
          setFormData(updatedUser);
          
          // 로컬 스토리지의 사용자 정보도 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          setEditingAvatar(false);
          setAvatarFile(null);
          setAvatarPreview(null);
          
          // 파일 input 초기화
          const fileInput = document.getElementById('avatar-input');
          if (fileInput) fileInput.value = '';
          
          setSaveStatus('success');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('아바타 업데이트 실패:', error);
      
      let errorMessage = '아바타 업데이트 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setEditingAvatar(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // 파일 input 초기화
    const fileInput = document.getElementById('avatar-input');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('프로필 사진을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const response = await api.put(`/update-user-profile?userId=${userId}`, {
        avatar: null
      });
      
      if (response.status === 200) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        setFormData(updatedUser);
        
        // 로컬 스토리지의 사용자 정보도 업데이트
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setEditingAvatar(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('아바타 삭제 실패:', error);
      setError('아바타 삭제 중 오류가 발생했습니다.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 슬랙 ID 인증 관련 함수들
  const handleSendVerificationCode = async () => {
    try {
      console.log('인증번호 발송:', formData.slackId);
      
      // 실제 서버 API 호출
      const response = await api.post('/slack/code', {
        slackId: formData.slackId
      });
      
      if (response.status === 200) {
        setSlackVerification(prev => ({
          ...prev,
          isVerificationSent: true
        }));
        
        setSaveStatus('verification-sent');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('인증번호 발송 실패:', error);
      
      let errorMessage = '인증번호 발송에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleVerifyCode = async () => {
    try {
      console.log('인증번호 확인:', slackVerification.verificationCode);
      
      // 실제 서버 API 호출
      const response = await api.post('/slack/code/verify', {
        slackId: formData.slackId,
        code: slackVerification.verificationCode
      });
      
      if (response.status === 200) {
        setSlackVerification(prev => ({
          ...prev,
          isVerified: true
        }));
        
        setSaveStatus('verification-success');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('인증번호 확인 실패:', error);
      
      let errorMessage = '인증번호 확인에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleVerificationCodeChange = (e) => {
    setSlackVerification(prev => ({
      ...prev,
      verificationCode: e.target.value
    }));
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className={styles.profile_container}>
        <div className={styles.loading_container}>
          <div className={styles.loading_spinner}></div>
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 표시
  if (error && !user._id) {
    return (
      <div className={styles.profile_container}>
        <div className={styles.error_container}>
          <FaExclamationCircle className={styles.error_icon} />
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button
            className={styles.retry_button}
            onClick={loadUserProfile}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profile_container}>
      <div className={styles.profile_header}>
        <div className={styles.header_content}>
          <div className={styles.header_title}>
            <h1>Profile</h1>
          </div>
          <button
            className={`${styles.edit_button} ${isEditMode ? styles.cancel : ''}`}
            onClick={handleEditToggle}
          >
            {isEditMode ? <><FaTimes /> 취소</> : <><FaEdit /> 편집</>}
          </button>
        </div>
        {saveStatus && (
          <div className={`${styles.save_status} ${styles[saveStatus]}`}>
            {saveStatus === 'saving' && '저장 중...'}
            {saveStatus === 'success' && <><FaCheck /> 성공적으로 저장되었습니다!</>}
            {saveStatus === 'verification-sent' && <><FaCheck /> 인증번호가 발송되었습니다!</>}
            {saveStatus === 'verification-success' && <><FaCheck /> 인증이 완료되었습니다!</>}
          </div>
        )}
        {error && (
          <div className={styles.error_message}>
            <FaExclamationCircle /> {error}
          </div>
        )}
      </div>

      <div className={styles.profile_content}>
        <div className={styles.profile_avatar_section}>
          <div className={styles.avatar_container}>
            <div className={styles.avatar_wrapper}>
              {editingAvatar ? (
                <div className={styles.avatar_editor}>
                  {/* 편집 모드 스켈레톤 */}
                  {!avatarLoaded && !avatarPreview && (
                    <div className={styles.avatar_skeleton}>
                      <div className={styles.skeleton_animation}></div>
                    </div>
                  )}
                  
                  <img 
                    src={avatarPreview || getProjectThumbnail(user.avatar)} 
                    alt="아바타 미리보기"
                    className={`${styles.avatar_image} ${avatarLoaded || avatarPreview ? styles.loaded : styles.loading}`}
                    onLoad={() => setAvatarLoaded(true)}
                    style={{ display: avatarLoaded || avatarPreview ? 'block' : 'none' }}
                  />
                  <div className={styles.avatar_overlay}>
                    <div className={styles.avatar_actions}>
                      <label htmlFor="avatar-input" className={styles.avatar_upload_button}>
                        <FaCamera />
                        이미지 선택
                      </label>
                      <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                        disabled={isUploadingAvatar}
                      />
                      {user.avatar && (
                        <button
                          type="button"
                          className={styles.avatar_remove_button}
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          <FaTimes />
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={styles.avatar_display}
                  onClick={() => !isEditMode && setEditingAvatar(true)}
                >
                  {/* 일반 모드 스켈레톤 */}
                  {!avatarLoaded && user.avatar && (
                    <div className={styles.avatar_skeleton}>
                      <div className={styles.skeleton_animation}></div>
                    </div>
                  )}
                  
                  {user.avatar ? (
                    <img 
                      src={getProjectThumbnail(user.avatar)} 
                      alt="프로필 이미지"
                      className={`${styles.avatar_image} ${avatarLoaded ? styles.loaded : styles.loading}`}
                      onLoad={() => setAvatarLoaded(true)}
                      style={{ display: avatarLoaded ? 'block' : 'none' }}
                    />
                  ) : (
                    <FaUserCircle className={styles.avatar_placeholder} />
                  )}
                  
                  {!isEditMode && (
                    <div className={styles.avatar_edit_overlay}>
                      <FaCamera className={styles.edit_icon} />
                      <span>클릭하여 편집</span>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.avatar_status}></div>
            </div>
            
            {editingAvatar && (
              <div className={styles.avatar_editor_actions}>
                <button 
                  className={styles.cancel_button}
                  onClick={handleCancelAvatar}
                  disabled={isUploadingAvatar}
                >
                  취소
                </button>
                <button 
                  className={styles.save_button}
                  onClick={handleSaveAvatar}
                  disabled={!avatarFile || isUploadingAvatar}
                >
                  <FaSave /> {isUploadingAvatar ? '업로드 중...' : '저장'}
                </button>
              </div>
            )}
            
            {isEditMode && !editingAvatar && (
              <button 
                className={styles.change_avatar_button}
                onClick={() => setEditingAvatar(true)}
                disabled={isUploadingAvatar}
              >
                <FaCamera />
                <span>사진 변경</span>
              </button>
            )}
          </div>
          <div className={styles.user_info}>
            <h2 className={styles.user_name}>{user.name || '이름 없음'}</h2>
            <p className={styles.user_role}>
              <FaBriefcase className={styles.role_icon} />
              {(user.roles && user.roles.length > 0) ? user.roles[0] : (user.department?.name || '직책 없음')}
            </p>
            <div className={styles.user_stats}>
              <div className={styles.stat_item}>
                <FaCalendarAlt />
                <span>입사 {user.hireYear ? new Date().getFullYear() - user.hireYear : (user.createdAt ? new Date().getFullYear() - new Date(user.createdAt).getFullYear() : 0)}년차</span>
              </div>
              <div className={styles.stat_item}>
                <FaIdCard />
                <span>{user.department?.name || '부서 미지정'}</span>
              </div>
            </div>
          </div>

          {isEditMode && (
            <div className={styles.tabs}>
              {['기본정보', '직무정보', '비밀번호변경'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {getTabIcon(tab)}
                  <span>{tab}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.profile_details}>
          {isEditMode ? (
            <form onSubmit={handleSaveProfile} className={styles.edit_form}>
              {activeTab === '기본정보' && (
                <div className={styles.tab_content}>
                  <div className={styles.section_header}>
                    <FaUser className={styles.section_icon} />
                    <h3>기본 정보</h3>
                    <p>개인 정보를 관리하세요</p>
                  </div>

                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label>
                        <FaIdCard className={styles.input_icon} />
                        이메일 (로그인 ID)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        readOnly
                        className={styles.readonly_input}
                      />
                      <small className={styles.field_note}>
                        <FaShieldAlt /> 이메일은 보안상 변경할 수 없습니다.
                      </small>
                    </div>
                    <div className={styles.form_group}>
                      <label>
                        <FaUser className={styles.input_icon} />
                        이름
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label>
                        <FaPhone className={styles.input_icon} />
                        전화번호
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        placeholder="예: 010-1234-5678"
                      />
                    </div>
                    <div className={styles.form_group}>
                      <label>
                        <FaPhone className={styles.input_icon} />
                        비상 연락처
                      </label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact || ''}
                        onChange={handleInputChange}
                        placeholder="비상시 연락 가능한 번호"
                      />
                    </div>
                  </div>

                  <div className={styles.form_row}>
                    <div className={`${styles.form_group} ${styles.full_width}`}>
                      <label>
                        <FaMapMarkerAlt className={styles.input_icon} />
                        주소
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        placeholder="상세 주소를 입력하세요"
                      />
                    </div>
                  </div>

                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label>
                        <FaEnvelope className={styles.input_icon} />
                        슬랙 ID
                      </label>
                      <div className={styles.slack_input_container}>
                        <input
                          type="text"
                          name="slackId"
                          value={formData.slackId || ''}
                          onChange={handleInputChange}
                          placeholder="슬랙 ID를 입력하세요"
                          className={styles.slack_id_input}
                        />
                        {slackVerification.isSlackIdChanged && (
                          <button
                            type="button"
                            className={`${styles.verification_button} ${slackVerification.isVerificationSent ? styles.sent : ''}`}
                            onClick={handleSendVerificationCode}
                            disabled={!formData.slackId || slackVerification.isVerificationSent}
                          >
                            {slackVerification.isVerificationSent ? '전송완료' : '인증번호 발송'}
                          </button>
                        )}
                        {slackVerification.isVerified && (
                          <FaCheck className={styles.verification_success_icon} />
                        )}
                      </div>
                    </div>
                    
                    {slackVerification.isSlackIdChanged && slackVerification.isVerificationSent && !slackVerification.isVerified && (
                      <div className={styles.form_group}>
                        <label>
                          <FaLock className={styles.input_icon} />
                          인증번호
                        </label>
                        <div className={styles.verification_input_container}>
                          <input
                            type="text"
                            value={slackVerification.verificationCode}
                            onChange={handleVerificationCodeChange}
                            placeholder="인증번호를 입력하세요"
                            className={styles.verification_code_input}
                          />
                          <button
                            type="button"
                            className={styles.verify_button}
                            onClick={handleVerifyCode}
                            disabled={!slackVerification.verificationCode}
                          >
                            확인
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 관리자 슬랙 알림 설정 */}
                    {isAdmin && (
                      <div className={styles.form_group}>
                        <label>
                          <FaShieldAlt className={styles.input_icon} />
                          관리자 슬랙 알림 수신
                        </label>
                        <div className={styles.toggle_container}>
                          <input
                            type="checkbox"
                            name="adminSlackMessage"
                            checked={formData.adminSlackMessage || false}
                            onChange={handleInputChange}
                            className={styles.toggle_input}
                            id="adminSlackMessage"
                          />
                          <label htmlFor="adminSlackMessage" className={styles.toggle_label}>
                            <span className={styles.toggle_slider}></span>
                          </label>
                          <span className={styles.toggle_text}>
                            {formData.adminSlackMessage ? '수신함' : '수신안함'}
                          </span>
                        </div>
                        <small className={styles.field_note}>
                          <FaInfoCircle /> 관리자 권한이 있는 경우에만 표시됩니다.
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === '직무정보' && (
                <div className={styles.tab_content}>
                  <div className={styles.section_header}>
                    <FaBriefcase className={styles.section_icon} />
                    <h3>직무 정보</h3>
                    <p>회사 내 역할과 정보를 관리하세요</p>
                  </div>

                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label>
                        <FaBriefcase className={styles.input_icon} />
                        부서
                      </label>
                      <select
                        name="department"
                        value={formData.department || ''}
                        onChange={handleInputChange}
                        className={styles.select_input}
                        disabled={departmentsLoading}
                      >
                        <option value="">부서를 선택하세요</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.form_group}>
                      <label>
                        <FaIdCard className={styles.input_icon} />
                        직책
                      </label>
                      <input 
                        type="text" 
                        name="role" 
                        value={(formData.roles && formData.roles.length > 0) ? formData.roles[0] : ''} 
                        onChange={handleInputChange} 
                        placeholder="예: 시니어 개발자"
                      />
                    </div>
                  </div>

                  <div className={styles.form_group}>
                    <label>
                      <FaInfoCircle className={styles.input_icon} />
                      자기소개
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      placeholder="간단한 자기소개를 작성해주세요"
                      rows="4"
                    />
                  </div>
                </div>
              )}

              {activeTab === '비밀번호변경' && (
                <div className={styles.tab_content}>
                  <div className={styles.section_header}>
                    <FaLock className={styles.section_icon} />
                    <h3>비밀번호 변경</h3>
                    <p>계정 보안을 위해 주기적으로 비밀번호를 변경하세요</p>
                  </div>

                  <div className={styles.password_security_info}>
                    <FaShieldAlt className={styles.security_icon} />
                    <div>
                      <h4>비밀번호 보안 권장사항</h4>
                      <ul>
                        <li>8자 이상의 문자 조합</li>
                        <li>대소문자, 숫자, 특수문자 포함</li>
                        <li>개인정보와 관련없는 비밀번호</li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.form_group}>
                    <label>
                      <FaLock className={styles.input_icon} />
                      현재 비밀번호
                    </label>
                    <div className={styles.password_input_container}>
                      <input
                        type={showPassword.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="현재 비밀번호를 입력하세요"
                      />
                      <button
                        type="button"
                        className={styles.toggle_password_button}
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.form_group}>
                    <label>
                      <FaLock className={styles.input_icon} />
                      새 비밀번호
                    </label>
                    <div className={styles.password_input_container}>
                      <input
                        type={showPassword.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="새 비밀번호를 입력하세요"
                      />
                      <button
                        type="button"
                        className={styles.toggle_password_button}
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.form_group}>
                    <label>
                      <FaLock className={styles.input_icon} />
                      새 비밀번호 확인
                    </label>
                    <div className={styles.password_input_container}>
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                      <button
                        type="button"
                        className={styles.toggle_password_button}
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <div className={styles.error_message}>
                      <FaExclamationCircle /> {passwordError}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.form_actions}>
                <button
                  type="submit"
                  className={styles.save_button}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? (
                    <>저장 중...</>
                  ) : (
                    <><FaSave /> 저장</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.info_display}>
              <div className={styles.info_section}>
                <div className={styles.section_header}>
                  <FaUser className={styles.section_icon} />
                  <h3>기본 정보</h3>
                </div>
                <div className={styles.info_grid}>
                  <div className={styles.info_card}>
                    <FaIdCard className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>이메일</label>
                      <p>{user.email || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaUser className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>이름</label>
                      <p>{user.name || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaPhone className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>전화번호</label>
                      <p>{user.phone || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaMapMarkerAlt className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>주소</label>
                      <p>{user.address || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaPhone className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>비상 연락처</label>
                      <p>{user.emergencyContact || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaIdCard className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>사용자 유형</label>
                      <p>{user.userType === 'internal' ? '내부 직원' : '외부 인력'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaEnvelope className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>슬랙 ID</label>
                      <p>{user.slackId || '미설정'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.info_section}>
                <div className={styles.section_header}>
                  <FaBriefcase className={styles.section_icon} />
                  <h3>직무 정보</h3>
                </div>
                <div className={styles.info_grid}>
                  <div className={styles.info_card}>
                    <FaBriefcase className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>부서</label>
                      <p>{user.department?.name || user.department || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaIdCard className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>직책/역할</label>
                      <p>{(user.roles && user.roles.length > 0) ? user.roles[0] : '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaCalendarAlt className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>가입일</label>
                      <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaIdCard className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>계정 상태</label>
                      <p>{user.status === 'active' ? '활성' : user.status === 'waiting' ? '승인 대기' : '비활성'}</p>
                    </div>
                  </div>
                </div>

                {user.bio && (
                  <div className={styles.bio_section}>
                    <div className={styles.bio_header}>
                      <FaInfoCircle className={styles.bio_icon} />
                      <h4>자기소개</h4>
                    </div>
                    <p className={styles.bio_content}>{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 