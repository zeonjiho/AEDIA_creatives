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
import { currentUser, departments, positions } from '../../data/mockDatabase';

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

  useEffect(() => {
    // 실제 앱에서는 API 호출을 통해 사용자 정보를 가져옵니다
    setUser(currentUser);
    setFormData(currentUser);
  }, []);

  const handleEditToggle = () => {
    if (isEditMode) {
      // 편집 취소 시 원래 데이터로 복원
      setFormData(user);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setSaveStatus('');
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    // 비밀번호 변경 시 유효성 검사
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
      
      // 실제 앱에서는 API 호출을 통해 비밀번호를 업데이트합니다
      setTimeout(() => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordError('');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      }, 1000);
    } else {
      // 실제 앱에서는 API 호출을 통해 사용자 정보를 업데이트합니다
      setTimeout(() => {
        setUser(formData);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      }, 1000);
    }
    
    setIsEditMode(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPasswordError('');
    setSaveStatus('');
  };

  const getTabIcon = (tabName) => {
    switch(tabName) {
      case '기본정보': return <FaUser />;
      case '직무정보': return <FaBriefcase />;
      case '비밀번호변경': return <FaLock />;
      default: return <FaInfoCircle />;
    }
  };

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
          </div>
        )}
      </div>

      <div className={styles.profile_content}>
        <div className={styles.profile_avatar_section}>
          <div className={styles.avatar_container}>
            <div className={styles.avatar_wrapper}>
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="프로필 이미지" 
                  className={styles.avatar_image} 
                />
              ) : (
                <FaUserCircle className={styles.avatar_placeholder} />
              )}
              <div className={styles.avatar_status}></div>
            </div>
            {isEditMode && (
              <button className={styles.change_avatar_button}>
                <FaCamera />
                <span>사진 변경</span>
              </button>
            )}
          </div>
          <div className={styles.user_info}>
            <h2 className={styles.user_name}>{user.name}</h2>
            <p className={styles.user_role}>
              <FaBriefcase className={styles.role_icon} />
              {user.role}
            </p>
            <div className={styles.user_stats}>
              <div className={styles.stat_item}>
                <FaCalendarAlt />
                <span>입사 {user.joinDate ? new Date().getFullYear() - new Date(user.joinDate).getFullYear() : 0}년차</span>
              </div>
              <div className={styles.stat_item}>
                <FaIdCard />
                <span>{user.department || '부서 미지정'}</span>
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
                        아이디
                      </label>
                      <input 
                        type="text" 
                        name="username" 
                        value={formData.username || ''} 
                        onChange={handleInputChange} 
                        readOnly
                        className={styles.readonly_input} 
                      />
                      <small className={styles.field_note}>
                        <FaShieldAlt /> 아이디는 보안상 변경할 수 없습니다.
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
                        <FaEnvelope className={styles.input_icon} />
                        이메일
                      </label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
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
                  </div>

                  <div className={styles.form_group}>
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
                        직책
                      </label>
                      <select 
                        name="position" 
                        value={formData.position || ''} 
                        onChange={handleInputChange}
                      >
                        <option value="">직책을 선택하세요</option>
                        {Object.values(positions).map(position => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.form_group}>
                      <label>
                        <FaIdCard className={styles.input_icon} />
                        직함
                      </label>
                      <input 
                        type="text" 
                        name="role" 
                        value={formData.role || ''} 
                        onChange={handleInputChange} 
                        placeholder="예: 시니어 개발자"
                      />
                    </div>
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
                      >
                        <option value="">부서를 선택하세요</option>
                        {Object.values(departments).map(department => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.form_group}>
                      <label>
                        <FaCalendarAlt className={styles.input_icon} />
                        입사일
                      </label>
                      <input 
                        type="date" 
                        name="joinDate" 
                        value={formData.joinDate || ''} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>

                  <div className={styles.form_group}>
                    <label>
                      <FaGraduationCap className={styles.input_icon} />
                      학력
                    </label>
                    <input 
                      type="text" 
                      name="education" 
                      value={formData.education || ''} 
                      onChange={handleInputChange} 
                      placeholder="예: 00대학교 컴퓨터공학과"
                    />
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
                      <label>아이디</label>
                      <p>{user.username || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaEnvelope className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>이메일</label>
                      <p>{user.email || '미설정'}</p>
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
                      <label>직책</label>
                      <p>{user.role || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaIdCard className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>부서</label>
                      <p>{user.department || '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaCalendarAlt className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>입사일</label>
                      <p>{user.joinDate ? new Date(user.joinDate).toLocaleDateString() : '미설정'}</p>
                    </div>
                  </div>
                  <div className={styles.info_card}>
                    <FaGraduationCap className={styles.info_icon} />
                    <div className={styles.info_content}>
                      <label>학력</label>
                      <p>{user.education || '미설정'}</p>
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