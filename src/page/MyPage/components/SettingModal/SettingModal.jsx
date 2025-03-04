import React, { useEffect, useState } from 'react'
import ss from './SettingModal.module.css'
import { IoClose } from "react-icons/io5"
import Profile from './Profile/Profile'
import Settings from './Settings/Settings'
import api from '../../../../util/api'
import { useNavigate } from 'react-router-dom'

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="75" cy="75" r="75" fill="#2C2C2C"/>
    <circle cx="75" cy="55" r="25" fill="#525252"/>
    <circle cx="75" cy="135" r="45" fill="#525252"/>
</svg>
`)}`;

const SettingModal = ({ userData, onClose, refreshUserInfo }) => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [showSuccess, setShowSuccess] = useState(false)
    const [isHiding, setIsHiding] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [formData, setFormData] = useState({
        avatar: userData.avatar ? userData.avatar : null,
        userName: userData.userName,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        occupation: userData.occupation,
        bio: userData.bio,
        oldAvatar: userData.avatar ? userData.avatar.split('/').pop() : null,
        //여기서부터는 settings에서 사용. 차후 수정 해제(필드 미정의 상태에서 해제 시 submit할 때 에러)
        // language: userData.language,
        // theme: 'dark',
        // notifications: {
        //     newFollowers: true,
        //     likes: true,
        //     comments: true
        // }
    })

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        // 모달이 DOM에 마운트된 직후에 visible 클래스 추가
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // 애니메이션이 완료된 후에 모달 닫기
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowSuccess(true);
        setIsHiding(false);

        try {
            let updatedData = { ...formData };
            delete updatedData.previewImage; // 미리보기 이미지 제거

            // 이미지 파일이 있는 경우 먼저 업로드
            if (formData.avatarFile) {
                const formDataForFile = new FormData();
                formDataForFile.append('avatar', formData.avatarFile);

                // 이전 아바타 파일명만 전송
                if (formData.oldAvatar) {
                    formDataForFile.append('oldAvatar', formData.oldAvatar);
                }

                const imageResponse = await api.post('/user/upload-avatar', formDataForFile, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (imageResponse.data.filename) {
                    updatedData.avatar = imageResponse.data.filename;
                }
            }

            // 임시 필드들 제거
            delete updatedData.avatarFile;


            const response = await api.post('/user/update-user-info', {
                userId: userData._id,
                data: updatedData
            });

            if (response.status === 200) {
                if (formData.userName !== userData.userName) {
                    navigate(`/@${formData.userName}`);
                } else {
                    refreshUserInfo();
                }
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during update.');
        } finally {
            setTimeout(() => {
                setIsHiding(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setIsHiding(false);
                }, 300);
            }, 2700);
        }
    };

    return (
        <div className={`${ss.modal_overlay} ${isVisible ? ss.overlayVisible : ''}`}
             onClick={e => e.target === e.currentTarget && handleClose()}>
            <div className={`${ss.modal_content} ${isVisible ? ss.modalVisible : ''}`}>
                <div className={ss.modal_header}>
                    <h1 className={ss.header_title}>Edit Profile</h1>
                    <button className={ss.close_btn} onClick={handleClose}>
                        <IoClose />
                    </button>
                </div>

                <div className={ss.tabs_container}>
                    <div className={ss.tabs}>
                        <button
                            className={`${ss.tab} ${activeTab === 'profile' ? ss.active : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`${ss.tab} ${activeTab === 'settings' ? ss.active : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </button>
                    </div>
                </div>

                <div className={ss.modal_body}>
                    {activeTab === 'profile' ? (
                        <Profile formData={formData} setFormData={setFormData} userData={userData} />
                    ) : (
                        <Settings formData={formData} setFormData={setFormData} userData={userData} />
                    )}
                </div>

                <div className={ss.modal_footer}>
                    <div className={ss.button_container}>
                        {showSuccess && (
                            <div className={`${ss.success_message} ${isHiding ? ss.hide : ''}`}>
                                <span>✓</span> Changes saved successfully
                            </div>
                        )}
                        <div className={ss.button_actions}>
                            <button type="button" className={ss.cancel_btn} onClick={handleClose}>
                                Cancel
                            </button>
                            <button type="submit" className={ss.save_btn} onClick={handleSubmit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SettingModal 