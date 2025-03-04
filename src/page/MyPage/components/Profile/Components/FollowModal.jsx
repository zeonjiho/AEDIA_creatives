import React, { useState } from 'react';
import styles from './FollowModal.module.css';

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#2C2C2C"/>
        <circle cx="75" cy="55" r="25" fill="#525252"/>
        <circle cx="75" cy="135" r="45" fill="#525252"/>
    </svg>
`)}`;

const FollowModal = ({ onClose, activeTab, setActiveTab, userData }) => {
    const [followStates, setFollowStates] = useState({});
    const [hoverStates, setHoverStates] = useState({});

    const handleFollowClick = (userId) => {
        setFollowStates(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const handleMouseEnter = (userId) => {
        setHoverStates(prev => ({
            ...prev,
            [userId]: true
        }));
    };

    const handleMouseLeave = (userId) => {
        setHoverStates(prev => ({
            ...prev,
            [userId]: false
        }));
    };

    // 임시 데이터 (나중에 실제 데이터로 교체)
    const mockFollowers = [
        { id: 1, username: 'user1', fullName: 'User One', avatar: null },
        { id: 2, username: 'user2', fullName: 'User Two', avatar: null },
        // ... 더 많은 팔로워
    ];

    const mockFollowing = [
        { id: 3, username: 'user3', fullName: 'User Three', avatar: null },
        { id: 4, username: 'user4', fullName: 'User Four', avatar: null },
        // ... 더 많은 팔로잉
    ];

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.tabs}>
                        <button 
                            className={`${styles.tab} ${activeTab === 'followers' ? styles.active : ''}`}
                            onClick={() => setActiveTab('followers')}
                        >
                            Followers
                        </button>
                        <button 
                            className={`${styles.tab} ${activeTab === 'following' ? styles.active : ''}`}
                            onClick={() => setActiveTab('following')}
                        >
                            Following
                        </button>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div className={styles.modalBody}>
                    <div 
                        key={activeTab} 
                        className={styles.userContainer}
                    >
                        {(activeTab === 'followers' ? mockFollowers : mockFollowing).map(user => (
                            <div key={user.id} className={styles.userItem}>
                                <div className={styles.userContent}>
                                    <img 
                                        src={user.avatar || DEFAULT_PROFILE_IMAGE} 
                                        alt={user.username} 
                                        className={styles.userAvatar}
                                    />
                                    <div className={styles.userInfo}>
                                        <div className={styles.username}>@ {user.username}</div>
                                        <div className={styles.fullName}>{user.fullName}</div>
                                    </div>
                                </div>
                                <button 
                                    className={`${styles.followButton} ${
                                        followStates[user.id]
                                            ? hoverStates[user.id]
                                                ? styles.unfollow
                                                : styles.following
                                            : styles.follow
                                    }`}
                                    onClick={() => handleFollowClick(user.id)}
                                    onMouseEnter={() => handleMouseEnter(user.id)}
                                    onMouseLeave={() => handleMouseLeave(user.id)}
                                >
                                    {followStates[user.id]
                                        ? hoverStates[user.id]
                                            ? 'Unfollow'
                                            : 'Following'
                                        : 'Follow'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FollowModal; 