import React, { useState } from 'react'
import ss from './Profile.module.css'
import formatNumber from '../../../../util/formatNumber';
import { jwtDecode } from 'jwt-decode';
import getAvatarImage from '../../../../util/getAvatarImage';
import Dashboard from '../Dashboard/Dashboard'
import FollowModal from './Components/FollowModal'

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#2C2C2C"/>
        <circle cx="75" cy="55" r="25" fill="#525252"/>
        <circle cx="75" cy="135" r="45" fill="#525252"/>
    </svg>
`)}`;

// 서버에서 받을 데이터 형식
const mockUserData = {
    username: "Username",
    fullName: "Full Name",
    occupation: "Artist",
    bio: "Digital artist based in Seoul, South Korea 🎨",
    stats: {
        posts: 120,
        followers: 1200,
        following: 890
    }
};

const Profile = ({ targetUserData, isLoggedIn, setIsSettingModalOpen, onCoverImageClick, coverImage }) => {
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isHoveringFollow, setIsHoveringFollow] = useState(false);
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('followers');
    const userData = targetUserData || mockUserData;

    const handleFollowClick = () => {
        setIsFollowing(!isFollowing);
    };

    const profileStyle = {
        background: coverImage ? `url(${coverImage})` : 'rgba(255, 255, 255, 0.05)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    };

    return (
        <div className={ss.profileContainer}>
            {/* 커버 이미지 영역 */}
            <div className={ss.coverImage} style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}>
                {/* 그라데이션 오버레이 */}
                <div className={ss.overlay} />
            </div>

            {/* 프로필 콘텐츠 */}
            <div className={ss.profile} style={profileStyle}>
                <div className={ss.profileHeader}>
                    <div className={ss.avatarSection}>
                        <img
                            src={userData.avatar ? getAvatarImage(userData.avatar) : DEFAULT_PROFILE_IMAGE}
                            alt="Profile"
                            className={ss.avatar}
                        />
                        <div className={ss.userInfo}>
                            <div className={ss.username}>
                                <span className={ss.atSymbol}>@</span>
                                <h1>{userData.userName}</h1>
                            </div>
                            <p className={ss.fullName}>{userData.fullName}</p>
                            <p className={ss.occupation}>{userData.occupation}</p>
                            <p className={ss.bio}>{userData.bio}</p>
                        </div>
                    </div>
                </div>

                <div className={ss.statsContainer}>
                    <div className={ss.stats}>
                        <div className={ss.statItem}>
                            <span className={ss.statNumber}>
                                {String(formatNumber(userData.stats.posts)).split('.').map((part, index) => 
                                    index === 0 ? (
                                        <>
                                            {part}
                                            {String(formatNumber(userData.stats.posts)).includes('.') && <span className={ss.dot}>.</span>}
                                        </>
                                    ) : part
                                )}
                            </span>
                            <span className={ss.statLabel}>Posts</span>
                        </div>
                        <div 
                            className={`${ss.statItem} ${ss.clickable}`}
                            onClick={() => {
                                setActiveTab('followers');
                                setIsFollowModalOpen(true);
                            }}
                        >
                            <span className={ss.statNumber}>
                                {String(formatNumber(userData.stats.followers)).split('.').map((part, index) => 
                                    index === 0 ? (
                                        <>
                                            {part}
                                            {String(formatNumber(userData.stats.followers)).includes('.') && <span className={ss.dot}>.</span>}
                                        </>
                                    ) : part
                                )}
                            </span>
                            <span className={ss.statLabel}>Followers</span>
                        </div>
                        <div 
                            className={`${ss.statItem} ${ss.clickable}`}
                            onClick={() => {
                                setActiveTab('following');
                                setIsFollowModalOpen(true);
                            }}
                        >
                            <span className={ss.statNumber}>
                                {String(formatNumber(userData.stats.following)).split('.').map((part, index) => 
                                    index === 0 ? (
                                        <>
                                            {part}
                                            {String(formatNumber(userData.stats.following)).includes('.') && <span className={ss.dot}>.</span>}
                                        </>
                                    ) : part
                                )}
                            </span>
                            <span className={ss.statLabel}>Following</span>
                        </div>
                    </div>

                    {isLoggedIn && targetUserData._id === jwtDecode(localStorage.getItem('token')).userId ? (
                        <div className={ss.editButtons}>
                            <button
                                className={ss.editButton}
                                onClick={() => setIsDashboardOpen(true)}
                            >
                                My Dashboard
                            </button>
                            <button
                                className={ss.editButton}
                                onClick={() => setIsSettingModalOpen(true)}
                            >
                                Edit Profile
                            </button>
                            <button
                                className={ss.editButton}
                                onClick={onCoverImageClick}
                            >
                                Edit Cover
                            </button>
                        </div>
                    ) : (
                        <div className={ss.actionButtons}>
                            <button 
                                className={`${ss.followButton} ${
                                    isFollowing 
                                        ? isHoveringFollow 
                                            ? ss.unfollow 
                                            : ss.following 
                                        : ss.follow
                                }`}
                                onClick={handleFollowClick}
                                onMouseEnter={() => setIsHoveringFollow(true)}
                                onMouseLeave={() => setIsHoveringFollow(false)}
                            >
                                {isFollowing 
                                    ? (isHoveringFollow ? 'Unfollow' : 'Following') 
                                    : 'Follow'}
                            </button>
                            <button className={ss.messageBtn}>
                                Message
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {isDashboardOpen && (
                <Dashboard onClose={() => setIsDashboardOpen(false)} />
            )}

            {isFollowModalOpen && (
                <FollowModal 
                    onClose={() => setIsFollowModalOpen(false)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userData={userData}
                />
            )}
        </div>
    )
}

export default Profile 