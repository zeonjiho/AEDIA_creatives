import React, { useState, useEffect } from 'react';
import styles from './AdminAdvanced.module.css';
import { 
    HiUpload, HiUser, HiTrash, HiPlus, HiSave, HiPencil, 
    HiCog, HiOfficeBuilding, HiMail, HiPhone, HiGlobe,
    HiLocationMarker, HiUserGroup, HiShieldCheck
} from 'react-icons/hi';
import StaffSearchModal from '../../../components/StaffSearchModal/StaffSearchModal';
import LocationPicker from '../../../common/LocationPicker';
import api from '../../../utils/api';

const AdminAdvanced = () => {
    // 회사 정보 상태
    const [companyData, setCompanyData] = useState({
        name: 'AEDIA STUDIO',
        logo: 'AEDIALOGO.svg',
        address: '',
        phone: '',
        email: '',
        website: '',
        adminUsers: [],
        settings: {
            autoLogout: 24,
            slackIntegration: true,
            emailNotification: true
        }
    });

    // UI 상태
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'admins', 'settings'
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // 폼 데이터 상태
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        website: ''
    });

    useEffect(() => {
        fetchCompanySettings();
    }, []);

    // 회사 설정 조회
    const fetchCompanySettings = async () => {
        try {
            const response = await api.get('/company/settings');
            if (response.status === 200) {
                setCompanyData(response.data);
                setFormData({
                    name: response.data.name || '',
                    address: response.data.address || '',
                    latitude: response.data.latitude || '',
                    longitude: response.data.longitude || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    website: response.data.website || ''
                });
            }
        } catch (err) {
            console.error('회사 설정 조회 실패:', err);
            alert('회사 설정을 불러오는데 실패했습니다.');
        }
    };

    // 폼 입력 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 기본 정보 저장
    const handleSaveBasicInfo = async () => {
        setLoading(true);
        try {
            const response = await api.put('/company/basic-info', {
                ...formData,
                logo: companyData.logo // 현재 로고 유지
            });

            if (response.status === 200) {
                setCompanyData(response.data.company);
                alert('회사 정보가 성공적으로 저장되었습니다.');
            }
        } catch (err) {
            console.error('회사 정보 저장 실패:', err);
            alert('회사 정보 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로고 파일 선택 핸들러
    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setSelectedFile(file);
                
                // 미리보기 생성
                const reader = new FileReader();
                reader.onload = (e) => {
                    setLogoPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                alert('이미지 파일만 업로드 가능합니다.');
            }
        }
    };

    // 로고 업로드
    const handleLogoUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('logo', selectedFile);

            const uploadResponse = await api.post('/company/upload-logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (uploadResponse.status === 200) {
                const newLogo = uploadResponse.data.filename;
                
                // 회사 정보 업데이트
                const updateResponse = await api.put('/company/basic-info', {
                    ...companyData,
                    logo: newLogo
                });

                if (updateResponse.status === 200) {
                    setCompanyData(updateResponse.data.company);
                    setSelectedFile(null);
                    setLogoPreview(null);
                    alert('로고가 성공적으로 업데이트되었습니다.');
                }
            }
        } catch (err) {
            console.error('로고 업로드 실패:', err);
            alert('로고 업로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 어드민 사용자 추가
    const handleAddAdmin = async (selectedUsers) => {
        if (selectedUsers.length === 0) {
            alert('추가할 사용자를 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const promises = selectedUsers.map(user => 
                api.post('/company/admin-users', {
                    userId: user.id || user._id,
                    role: 'admin',
                    addedBy: null // 현재 사용자 ID로 설정 가능
                })
            );

            await Promise.all(promises);
            await fetchCompanySettings(); // 새로고침
            setShowAddAdmin(false);
            alert(`${selectedUsers.length}명의 어드민 사용자가 추가되었습니다.`);
        } catch (err) {
            console.error('어드민 사용자 추가 실패:', err);
            alert('어드민 사용자 추가에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 어드민 사용자 삭제
    const handleRemoveAdmin = async (userId) => {
        if (!window.confirm('정말로 이 어드민 사용자를 삭제하시겠습니까?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.delete(`/company/admin-users/${userId}`);
            if (response.status === 200) {
                await fetchCompanySettings(); // 새로고침
                alert('어드민 사용자가 삭제되었습니다.');
            }
        } catch (err) {
            console.error('어드민 사용자 삭제 실패:', err);
            alert(err.response?.data?.message || '어드민 사용자 삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 어드민 역할 변경
    const handleChangeAdminRole = async (userId, newRole) => {
        setLoading(true);
        try {
            const response = await api.put(`/company/admin-users/${userId}`, {
                role: newRole
            });
            if (response.status === 200) {
                await fetchCompanySettings(); // 새로고침
                alert('어드민 역할이 변경되었습니다.');
            }
        } catch (err) {
            console.error('어드민 역할 변경 실패:', err);
            alert('어드민 역할 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 설정 업데이트
    const handleSettingsUpdate = async (settingKey, value) => {
        setLoading(true);
        try {
            const updateData = {
                ...companyData.settings,
                [settingKey]: value
            };

            const response = await api.put('/company/settings', updateData);
            if (response.status === 200) {
                setCompanyData(response.data.company);
                alert('설정이 성공적으로 업데이트되었습니다.');
            }
        } catch (err) {
            console.error('설정 업데이트 실패:', err);
            alert('설정 업데이트에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 위치 선택 핸들러
    const handleLocationSelect = (location) => {
        console.log('Selected location:', location);
        setFormData(prev => ({
            ...prev,
            address: location.koreanAddress,
            latitude: location.lat,
            longitude: location.lng
        }));
        setShowLocationPicker(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Advanced Settings</h1>
                <p className={styles.subtitle}>회사 정보 및 시스템 설정을 관리합니다</p>
            </div>

            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'basic' ? styles.active : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    <HiOfficeBuilding className={styles.tabIcon} />
                    기본 정보
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'admins' ? styles.active : ''}`}
                    onClick={() => setActiveTab('admins')}
                >
                    <HiUserGroup className={styles.tabIcon} />
                    어드민 관리
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <HiCog className={styles.tabIcon} />
                    시스템 설정
                </button>
            </div>

            {/* 기본 정보 탭 */}
            {activeTab === 'basic' && (
                <div className={styles.tabContent}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>회사 로고</h2>
                            <p className={styles.sectionDescription}>
                                회사 로고를 업로드하고 관리할 수 있습니다.
                            </p>
                        </div>

                        <div className={styles.logoSection}>
                            <div className={styles.currentLogo}>
                                <h3>현재 로고</h3>
                                <div className={styles.logoPreview}>
                                    <img 
                                        src={`/uploads/product/${companyData.logo}`}
                                        alt="Company Logo"
                                        className={styles.logoImage}
                                        onError={(e) => {
                                            e.target.src = '/AEDIALOGO.svg'; // 기본 로고
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.logoUpload}>
                                <h3>새 로고 업로드</h3>
                                <div className={styles.uploadArea}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        className={styles.fileInput}
                                        id="logoUpload"
                                    />
                                    <label htmlFor="logoUpload" className={styles.fileLabel}>
                                        <HiUpload className={styles.uploadIcon} />
                                        파일 선택
                                    </label>

                                    {logoPreview && (
                                        <div className={styles.previewContainer}>
                                            <h4>미리보기</h4>
                                            <img 
                                                src={logoPreview} 
                                                alt="Logo Preview" 
                                                className={styles.previewImage}
                                            />
                                            <button 
                                                onClick={handleLogoUpload}
                                                className={styles.uploadButton}
                                                disabled={loading}
                                            >
                                                <HiSave className={styles.buttonIcon} />
                                                로고 업데이트
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>회사 기본 정보</h2>
                            <p className={styles.sectionDescription}>
                                회사의 기본 정보를 관리할 수 있습니다.
                            </p>
                        </div>

                        <div className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiOfficeBuilding className={styles.labelIcon} />
                                        회사명
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="회사명을 입력하세요"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiLocationMarker className={styles.labelIcon} />
                                        주소
                                    </label>
                                    <div className={styles.inputWithButton}>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="회사 주소를 입력하세요"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowLocationPicker(true)}
                                            className={styles.locationPickerButton}
                                            title="지도에서 위치 선택"
                                        >
                                            <HiLocationMarker />
                                            위치 선택
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiLocationMarker className={styles.labelIcon} />
                                        위도 (Latitude)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="위도를 입력하세요 (예: 37.5665) - 출근 관리에 사용됩니다"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiLocationMarker className={styles.labelIcon} />
                                        경도 (Longitude)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="경도를 입력하세요 (예: 126.9780) - 출근 관리에 사용됩니다"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiPhone className={styles.labelIcon} />
                                        전화번호
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="전화번호를 입력하세요"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiMail className={styles.labelIcon} />
                                        이메일
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="이메일을 입력하세요"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <HiGlobe className={styles.labelIcon} />
                                        웹사이트
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="웹사이트 URL을 입력하세요"
                                    />
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button 
                                    onClick={handleSaveBasicInfo}
                                    className={styles.saveButton}
                                    disabled={loading}
                                >
                                    <HiSave className={styles.buttonIcon} />
                                    기본 정보 저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 어드민 관리 탭 */}
            {activeTab === 'admins' && (
                <div className={styles.tabContent}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>어드민 사용자 관리</h2>
                            <p className={styles.sectionDescription}>
                                시스템 관리 권한을 가진 사용자들을 관리할 수 있습니다.
                            </p>
                            <button 
                                onClick={() => setShowAddAdmin(true)}
                                className={styles.addButton}
                            >
                                <HiPlus className={styles.buttonIcon} />
                                어드민 추가
                            </button>
                        </div>

                        <div className={styles.adminList}>
                            {companyData.adminUsers.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <HiShieldCheck className={styles.emptyIcon} />
                                    <p>등록된 어드민 사용자가 없습니다.</p>
                                </div>
                            ) : (
                                companyData.adminUsers.map((admin) => (
                                    <div key={admin._id} className={styles.adminCard}>
                                        <div className={styles.adminInfo}>
                                            <div className={styles.adminAvatar}>
                                                {admin.userId?.name ? admin.userId.name.charAt(0) : '?'}
                                            </div>
                                            <div className={styles.adminDetails}>
                                                <h3 className={styles.adminName}>
                                                    {admin.userId?.name || '이름 없음'}
                                                </h3>
                                                <p className={styles.adminEmail}>
                                                    {admin.userId?.email || '이메일 없음'}
                                                </p>
                                                <p className={styles.adminDepartment}>
                                                    {admin.userId?.department || '소속 없음'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className={styles.adminActions}>
                                            <select
                                                value={admin.role}
                                                onChange={(e) => handleChangeAdminRole(admin.userId._id, e.target.value)}
                                                className={styles.roleSelect}
                                                disabled={loading}
                                            >
                                                <option value="admin">관리자</option>
                                                <option value="super_admin">슈퍼 관리자</option>
                                            </select>
                                            
                                            <button
                                                onClick={() => handleRemoveAdmin(admin.userId._id)}
                                                className={styles.removeButton}
                                                disabled={loading}
                                            >
                                                <HiTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 시스템 설정 탭 */}
            {activeTab === 'settings' && (
                <div className={styles.tabContent}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>시스템 설정</h2>
                            <p className={styles.sectionDescription}>
                                시스템의 다양한 설정을 관리할 수 있습니다.
                            </p>
                        </div>

                        <div className={styles.settingsList}>
                            <div className={styles.settingItem}>
                                <div className={styles.settingInfo}>
                                    <h3>자동 로그아웃 시간</h3>
                                    <p>사용자가 자동으로 로그아웃되는 시간을 설정합니다.</p>
                                </div>
                                <div className={styles.settingControl}>
                                    <select
                                        value={companyData.settings.autoLogout}
                                        onChange={(e) => handleSettingsUpdate('autoLogout', parseInt(e.target.value))}
                                        className={styles.settingSelect}
                                        disabled={loading}
                                    >
                                        <option value={1}>1시간</option>
                                        <option value={4}>4시간</option>
                                        <option value={8}>8시간</option>
                                        <option value={12}>12시간</option>
                                        <option value={24}>24시간</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.settingItem}>
                                <div className={styles.settingInfo}>
                                    <h3>슬랙 연동</h3>
                                    <p>슬랙 메시지 및 알림 기능을 활성화합니다.</p>
                                </div>
                                <div className={styles.settingControl}>
                                    <label className={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={companyData.settings.slackIntegration}
                                            onChange={(e) => handleSettingsUpdate('slackIntegration', e.target.checked)}
                                            disabled={loading}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.settingItem}>
                                <div className={styles.settingInfo}>
                                    <h3>이메일 알림</h3>
                                    <p>이메일 알림 기능을 활성화합니다.</p>
                                </div>
                                <div className={styles.settingControl}>
                                    <label className={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={companyData.settings.emailNotification}
                                            onChange={(e) => handleSettingsUpdate('emailNotification', e.target.checked)}
                                            disabled={loading}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 어드민 추가 모달 */}
            {showAddAdmin && (
                <StaffSearchModal
                    isOpen={showAddAdmin}
                    onClose={() => setShowAddAdmin(false)}
                    onSelect={handleAddAdmin}
                    selectedPeople={[]}
                    multiSelect={true}
                    title="어드민 사용자 추가"
                    initialFilterType="internal"
                />
            )}

            {/* 위치 선택 모달 */}
            {showLocationPicker && (
                <LocationPicker
                    isOpen={showLocationPicker}
                    onClose={() => setShowLocationPicker(false)}
                    onLocationSelect={handleLocationSelect}
                    initialLocation={{
                        name: '',
                        koreanAddress: formData.address,
                        englishAddress: '',
                        lat: formData.latitude ? parseFloat(formData.latitude) : 37.5665,
                        lng: formData.longitude ? parseFloat(formData.longitude) : 126.9780
                    }}
                />
            )}
        </div>
    );
};

export default AdminAdvanced; 