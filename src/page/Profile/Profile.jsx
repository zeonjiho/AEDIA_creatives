import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import { FaCamera, FaEdit, FaSave, FaTimes, FaUserCircle, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
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
    
    // 비밀번호 변경 시 유효성 검사
    if (activeTab === '비밀번호변경') {
      if (!passwordData.currentPassword) {
        setPasswordError('현재 비밀번호를 입력해주세요.');
        return;
      }
      
      if (!passwordData.newPassword) {
        setPasswordError('새 비밀번호를 입력해주세요.');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
        return;
      }
      
      // 실제 앱에서는 API 호출을 통해 비밀번호를 업데이트합니다
      // 여기서는 비밀번호 변경 성공으로 가정하고 상태를 초기화합니다
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      alert('비밀번호가 성공적으로 변경되었습니다.');
    } else {
      // 실제 앱에서는 API 호출을 통해 사용자 정보를 업데이트합니다
      setUser(formData);
    }
    
    setIsEditMode(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.profile_container}>
      <div className={styles.profile_header}>
        <h1>내 프로필</h1>
        <button 
          className={`${styles.edit_button} ${isEditMode ? styles.cancel : ''}`} 
          onClick={handleEditToggle}
        >
          {isEditMode ? <><FaTimes /> 취소</> : <><FaEdit /> 편집</>}
        </button>
      </div>

      <div className={styles.profile_content}>
        <div className={styles.profile_avatar_section}>
          <div className={styles.avatar_container}>
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="프로필 이미지" 
                className={styles.avatar_image} 
              />
            ) : (
              <FaUserCircle className={styles.avatar_placeholder} />
            )}
            {isEditMode && (
              <button className={styles.change_avatar_button}>
                <FaCamera />
              </button>
            )}
          </div>
          <h2 className={styles.user_name}>{user.name}</h2>
          <p className={styles.user_role}>{user.role}</p>
          
          {isEditMode && (
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === '기본정보' ? styles.active : ''}`}
                onClick={() => handleTabChange('기본정보')}
              >
                기본정보
              </button>
              <button 
                className={`${styles.tab} ${activeTab === '직무정보' ? styles.active : ''}`}
                onClick={() => handleTabChange('직무정보')}
              >
                직무정보
              </button>
              <button 
                className={`${styles.tab} ${activeTab === '비밀번호변경' ? styles.active : ''}`}
                onClick={() => handleTabChange('비밀번호변경')}
              >
                비밀번호 변경
              </button>
            </div>
          )}
        </div>

        <div className={styles.profile_details}>
          {isEditMode ? (
            <form onSubmit={handleSaveProfile}>
              {activeTab === '기본정보' && (
                <div className={styles.tab_content}>
                  <div className={styles.form_group}>
                    <label>아이디</label>
                    <input 
                      type="text" 
                      name="username" 
                      value={formData.username || ''} 
                      onChange={handleInputChange} 
                      readOnly
                      className={styles.readonly_input} 
                    />
                    <small className={styles.field_note}>아이디는 변경할 수 없습니다.</small>
                  </div>
                  <div className={styles.form_group}>
                    <label>이름</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name || ''} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>이메일</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email || ''} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>전화번호</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>주소</label>
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>비상 연락처</label>
                    <input 
                      type="tel" 
                      name="emergencyContact" 
                      value={formData.emergencyContact || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              )}

              {activeTab === '직무정보' && (
                <div className={styles.tab_content}>
                  <div className={styles.form_group}>
                    <label>직책</label>
                    <select 
                      name="position" 
                      value={formData.position || ''} 
                      onChange={handleInputChange}
                    >
                      <option value="">선택하세요</option>
                      {Object.values(positions).map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.form_group}>
                    <label>직함</label>
                    <input 
                      type="text" 
                      name="role" 
                      value={formData.role || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>부서</label>
                    <select 
                      name="department" 
                      value={formData.department || ''} 
                      onChange={handleInputChange}
                    >
                      <option value="">선택하세요</option>
                      {Object.values(departments).map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.form_group}>
                    <label>입사일</label>
                    <input 
                      type="date" 
                      name="joinDate" 
                      value={formData.joinDate || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>학력</label>
                    <input 
                      type="text" 
                      name="education" 
                      value={formData.education || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>소개</label>
                    <textarea 
                      name="bio" 
                      value={formData.bio || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              )}

              {activeTab === '비밀번호변경' && (
                <div className={styles.tab_content}>
                  <div className={styles.form_group}>
                    <label>현재 비밀번호</label>
                    <div className={styles.password_input_container}>
                      <input 
                        type={showPassword.current ? "text" : "password"} 
                        name="currentPassword" 
                        value={passwordData.currentPassword} 
                        onChange={handlePasswordChange} 
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
                    <label>새 비밀번호</label>
                    <div className={styles.password_input_container}>
                      <input 
                        type={showPassword.new ? "text" : "password"} 
                        name="newPassword" 
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange} 
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
                    <label>새 비밀번호 확인</label>
                    <div className={styles.password_input_container}>
                      <input 
                        type={showPassword.confirm ? "text" : "password"} 
                        name="confirmPassword" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange} 
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

              <button type="submit" className={styles.save_button}>
                <FaSave /> 저장
              </button>
            </form>
          ) : (
            <div className={styles.info_list}>
              <div className={styles.info_item}>
                <label>아이디</label>
                <p>{user.username || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>이메일</label>
                <p>{user.email}</p>
              </div>
              <div className={styles.info_item}>
                <label>직책</label>
                <p>{user.role || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>부서</label>
                <p>{user.department || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>전화번호</label>
                <p>{user.phone || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>주소</label>
                <p>{user.address || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>입사일</label>
                <p>{user.joinDate ? new Date(user.joinDate).toLocaleDateString() : '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>학력</label>
                <p>{user.education || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>비상 연락처</label>
                <p>{user.emergencyContact || '미설정'}</p>
              </div>
              <div className={styles.info_item}>
                <label>소개</label>
                <p className={styles.bio}>{user.bio || '소개가 없습니다.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 