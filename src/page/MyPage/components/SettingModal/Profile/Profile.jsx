import React, { useEffect, useRef } from 'react'
import ss from './Profile.module.css'
import { DEFAULT_PROFILE_IMAGE } from '../constants'
import getAvatarImage from '../../../../../util/getAvatarImage';

const Profile = ({ formData, setFormData, userData }) => {
    const fileInputRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 크기 검증 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should be less than 5MB');
                return;
            }

            // 파일 타입 검증
            if (!file.type.startsWith('image/')) {
                alert('Only image files are allowed');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    // 미리보기용 임시 URL (preview 필드로 분리)
                    previewImage: reader.result,
                    // 실제 파일 경로는 유지
                    avatar: formData.avatar,
                    // 실제 업로드용 파일
                    avatarFile: file,
                    // 이전 아바타 파일명 저장
                    oldAvatar: userData.avatar ? userData.avatar.split('/').pop() : null
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData({
            ...formData,
            avatar: null,
            previewImage: null,
            avatarFile: null,
            oldAvatar: userData.avatar ? userData.avatar.split('/').pop() : null
        });
    };


    return (
        <div className={ss.profile_container}>
            <div className={ss.avatar_section}>
                <img
                    src={formData.previewImage || (formData.avatar && getAvatarImage(formData.avatar)) || DEFAULT_PROFILE_IMAGE}
                    alt="Profile"
                    className={ss.avatar}
                />
                <div className={ss.button_container}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className={ss.hidden_input}
                    />
                    <button
                        type="button"
                        className={ss.basic_btn}
                        onClick={() => fileInputRef.current.click()}
                    >
                        Change Profile Image
                    </button>
                    <button
                        type="button"
                        className={`${ss.basic_btn} ${ss.remove_btn}`}
                        onClick={handleRemoveImage}
                    >
                        Remove
                    </button>
                </div>
            </div>

            <div className={ss.form_section}>
                <div className={ss.input_group}>
                    <label>Username</label>
                    <div className={ss.username_input}>
                        <span className={ss.at_symbol}>@</span>
                        <input
                            type="text"
                            value={formData.userName}
                            onChange={(e) => {
                                if (e.target.value.length <= 20) {
                                    setFormData({ ...formData, userName: e.target.value })
                                }
                            }}
                            maxLength={20}
                            placeholder="Enter username (max 20 characters)"
                        />
                    </div>
                </div>
                <div className={ss.input_group}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                            if (e.target.value.length <= 30) {
                                setFormData({ ...formData, fullName: e.target.value })
                            }
                        }}
                        maxLength={30}
                        placeholder="Enter name (max 30 characters)"
                    />
                </div>

                <div className={ss.input_group}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                            if (e.target.value.length <= 50) {
                                setFormData({ ...formData, email: e.target.value })
                            }
                        }}
                        maxLength={50}
                        placeholder="Enter email (max 50 characters)"
                    />
                </div>

                <div className={ss.input_group}>
                    <label>Phone Number</label>
                    <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => {
                            if (e.target.value.length <= 15) {
                                setFormData({ ...formData, phone: e.target.value })
                            }
                        }}
                        maxLength={15}
                        placeholder="+82 10-1234-5678"
                    />
                </div>

                <div className={ss.row_group}>
                    <div className={ss.input_group}>
                        <label>Gender</label>
                        <select
                            className={ss.select_input}
                            value={formData.gender || ''}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="">Select gender</option>
                            <option value="0">Male</option>
                            <option value="1">Female</option>
                            <option value="2">Other</option>
                            <option value="3">Prefer not to say</option>
                        </select>
                    </div>

                    <div className={ss.input_group}>
                        <label>Occupation(Job)</label>
                        <select
                            className={ss.select_input}
                            value={formData.occupation || ''}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        >
                            <option value="">Select occupation</option>
                            <option value="student">Student</option>
                            <option value="developer">Developer</option>
                            <option value="designer">Designer</option>
                            <option value="manager">Manager</option>
                            <option value="entrepreneur">Entrepreneur</option>
                            <option value="teacher">Teacher</option>
                            <option value="researcher">Researcher</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className={ss.input_group}>
                    <label>Bio</label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => {
                            if (e.target.value.length <= 200) {
                                setFormData({ ...formData, bio: e.target.value })
                            }
                        }}
                        maxLength={200}
                        placeholder="Write something about yourself"
                    />
                    <span className={ss.char_count}>{formData.bio?.length || 0}/200</span>
                </div>
            </div>

            <button 
                className={ss.logout_btn}
                onClick={handleLogout}
            >
                Log out
            </button>
        </div>
    )
}

export default Profile 