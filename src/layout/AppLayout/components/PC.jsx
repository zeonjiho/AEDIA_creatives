import React, { useEffect, useState } from 'react'
import ss from './PC.module.css'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FaSearch, FaLock, FaHome, FaCompass, FaImages, FaPlus, FaBell, FaExchangeAlt, FaLayerGroup, FaEdit, FaMousePointer, FaSquare, FaCircle, FaFont, FaArrowsAlt, FaTrash, FaUndo, FaRedo, FaSave, FaShare, FaTimes, FaBorderAll } from 'react-icons/fa'
import TermsPrivacy from '../../../common/TermsPrivacy/TermsPrivacy'
import api from '../../../util/api'
import { jwtDecode } from 'jwt-decode'
import { ReactComponent as HyperLogo } from '../../../Assets/logos/hyper-logo-title-w.svg'
import getAvatarImage from '../../../util/getAvatarImage'
import MessagesModal from '../../../common/MessagesModal/MessagesModal'

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#2C2C2C"/>
        <circle cx="75" cy="55" r="25" fill="#525252"/>
        <circle cx="75" cy="135" r="45" fill="#525252"/>
    </svg>
`)}`;

const CREDIT_ICON = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L9.8 4.2L14 7L9.8 9.8L7 14L4.2 9.8L0 7L4.2 4.2L7 0Z" fill="#00E0FF"/>
        <path d="M7 3L8.5 5.5L11 7L8.5 8.5L7 11L5.5 8.5L3 7L5.5 5.5L7 3Z" fill="#FFFFFF" fill-opacity="0.3"/>
    </svg>
`)}`;

const HOME_ICON = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 10V20H9V14H15V20H20V10L12 4Z" fill="#FFFFFF"/>
    </svg>
`)}`;

// 종이비행기 아이콘 컴포넌트 추가
const PaperPlaneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.7 2.3C21.5 2.1 21.2 2 21 2C20.8 2 20.6 2.1 20.4 2.2L2.4 11.2C2.1 11.4 2 11.7 2 12C2 12.3 2.2 12.6 2.5 12.7L8 15.5L15.5 8L12.7 14.8L18.8 17.8C18.9 17.9 19.1 17.9 19.2 17.9C19.4 17.9 19.6 17.8 19.8 17.7C20 17.5 20.1 17.3 20.1 17L22.1 3C22.1 2.7 22 2.5 21.7 2.3Z" 
            fill="currentColor"/>
    </svg>
);

// 알림 아이콘 컴포넌트 수정
const NotificationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" 
            fill="currentColor"/>
    </svg>
);

// Jam 아이콘 컴포넌트 추가
const JamIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
        <path d="M15 8H9C8.45 8 8 8.45 8 9V15C8 15.55 8.45 16 9 16H15C15.55 16 16 15.55 16 15V9C16 8.45 15.55 8 15 8ZM14 14H10V10H14V14Z" fill="currentColor"/>
    </svg>
);

const AppLayout = ({ currentUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [modalType, setModalType] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // const [currentUser, setCurrentUser] = useState({
    //     userId: '',
    //     username: 'Username',
    //     fullname: '',
    //     avatar: DEFAULT_PROFILE_IMAGE,
    //     isPrivate: true,
    //     stats: {
    //         followers: 1200,
    //         views: 5000,
    //         likes: 3500,
    //         uploads: 120,
    //         exp: 750,
    //         level: 5
    //     }
    // });

    const [accounts, setAccounts] = useState([
        {
            userId: 'user1',
            username: 'zeonjiho',
            fullname: 'JIHO JEON®',
            avatar: DEFAULT_PROFILE_IMAGE,
            isPrivate: false,
            isActive: true
        },
        {
            userId: 'user2',
            username: 'other_account',
            fullname: 'Other User',
            avatar: DEFAULT_PROFILE_IMAGE,
            isPrivate: true,
            isActive: false
        }
    ]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isProfileTooltipOpen, setIsProfileTooltipOpen] = useState(false);
    const [isSwitchTooltipOpen, setIsSwitchTooltipOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'like',
            user: {
                username: 'john_doe',
                avatar: DEFAULT_PROFILE_IMAGE
            },
            content: 'liked your post',
            target: 'Beautiful sunset photo',
            time: '2 hours ago',
            isRead: false
        },
        {
            id: 2,
            type: 'follow',
            user: {
                username: 'jane_smith',
                avatar: DEFAULT_PROFILE_IMAGE
            },
            content: 'started following you',
            time: '1 day ago',
            isRead: false
        },
        {
            id: 3,
            type: 'comment',
            user: {
                username: 'mike_wilson',
                avatar: DEFAULT_PROFILE_IMAGE
            },
            content: 'commented on your post',
            target: 'Code snippet',
            time: '2 days ago',
            isRead: true
        }
    ]);
    const [isNotificationTooltipOpen, setIsNotificationTooltipOpen] = useState(false);
    const [showMessagesModal, setShowMessagesModal] = useState(false);

    useEffect(() => {
        autoLoginAndLogout()
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [])

    const handleTermsClick = (e) => {
        e.preventDefault();
        setModalType('terms');
    };

    const handlePrivacyClick = (e) => {
        e.preventDefault();
        setModalType('privacy');
    };

    const autoLoginAndLogout = async () => {
        if (!localStorage.getItem('token')) {
            setIsLoggedIn(false)
            return
        }
        try {
            const response = await api.post('/user/validation-user-status-and-update-last-visit',
                { userId: jwtDecode(localStorage.getItem('token')).userId }
            );

            if (response.status === 200) {
                setIsLoggedIn(true);

                // 현재 유저 정보 설정 (디버깅용 임시 해제)
                // setCurrentUser({
                //     userId: response.data.userId,
                //     username: response.data.userName?.toLowerCase() || 'username',
                //     fullname: response.data.fullname?.toUpperCase() || 'Full Name',
                //     avatar: response.data.avatar || DEFAULT_PROFILE_IMAGE,
                //     isPrivate: response.data.isPrivate || true,
                //     stats: {
                //         followers: response.data.followers || 1200,
                //         views: response.data.views || 5000,
                //         likes: response.data.likes || 3500,
                //         uploads: response.data.uploads || 120,
                //         exp: response.data.exp || 750,
                //         level: response.data.level || 5
                //     },
                //     theme: response.data.theme || 'dark'
                // });

                // 계정 목록 설정 (디버깅용 임시 비활성화)
                // const accountsResponse = await api.get('/user/linked-accounts');
                // if (accountsResponse.status === 200) {
                //     setAccounts(accountsResponse.data.accounts.map(account => ({
                //         ...account,
                //         username: account.username?.toLowerCase(),
                //         fullname: account.fullname?.toUpperCase(),
                //         isActive: account.userId === response.data.userId
                //     })));
                // }
            } else if (response.status === 201) {
                handleLogout('no-reload');
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleLogout = (reload) => {
        localStorage.removeItem('token')
        setIsLoggedIn(false)
        if (reload === 'no-reload') {
            return
        }
        window.location.reload()
    }

    const handleSwitchAccount = async (userId) => {
        try {
            const response = await api.post('/user/switch-account', { userId });
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                await autoLoginAndLogout(); // 새 계정 정보로 리로드
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleProfileClick = (e) => {
        if (isMobile) {
            e.preventDefault();
            e.stopPropagation();
            if (!isProfileTooltipOpen) {
                setIsSwitchTooltipOpen(false); // 다른 툴팁 닫기
                setIsProfileTooltipOpen(true);
            } else {
                setIsProfileTooltipOpen(false);
                navigate(`/@${currentUser.userName}`);
            }
        } else {
            navigate(`/@${currentUser.userName}`);
        }
    };

    const handleSwitchClick = (e) => {
        if (isMobile) {
            e.preventDefault();
            e.stopPropagation();
            if (!isSwitchTooltipOpen) {
                setIsProfileTooltipOpen(false); // 다른 툴팁 닫기
                setIsSwitchTooltipOpen(true);
            } else {
                setIsSwitchTooltipOpen(false);
            }
        }
    };

    // 바깥 영역 클릭시 툴팁 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${ss.profile_wrap}`)) {
                setIsProfileTooltipOpen(false);
                setIsSwitchTooltipOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleHomeClick = () => {
        window.location.href = '/';  // navigate 대신 location.href 사용하여 페이지 리로드
    };

    const handleMessageClick = () => {
        setShowMessagesModal(true);
    };

    const handleNotificationClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNotificationTooltipOpen(!isNotificationTooltipOpen);
        setIsProfileTooltipOpen(false);
        setIsSwitchTooltipOpen(false);
    };

    return (
        <div className={ss.layout}>
            <header className={ss.header}>
                <div className={ss.logo_wrap} onClick={handleHomeClick}>
                    <HyperLogo />
                </div>

                <div className={ss.search_wrap}>
                    <FaSearch className={ss.search_icon} />
                    <input
                        type="text"
                        placeholder="Search"
                        className={ss.search_input}
                    />
                </div>
                <div className={ss.login_btn_wrap}>
                    {isLoggedIn === true ? (
                        <>
                            <div className={ss.action_buttons}>
                                <button 
                                    className={ss.action_btn} 
                                    onClick={() => navigate('/collections')}
                                    data-tooltip="Collections"
                                >
                                    <FaLayerGroup />
                                </button>
                                <button 
                                    className={ss.action_btn} 
                                    onClick={() => navigate('/jam')}
                                    data-tooltip="Jam"
                                >
                                    <JamIcon />
                                </button>
                                <button 
                                    className={ss.action_btn} 
                                    onClick={handleMessageClick}
                                    data-tooltip="Messages"
                                >
                                    <PaperPlaneIcon />
                                </button>
                                <div className={ss.notification_wrap}>
                                    <button className={ss.action_btn}>
                                        <FaBell />
                                        {notifications.filter(n => !n.isRead).length > 0 && (
                                            <span className={ss.notification_badge}>
                                                {notifications.filter(n => !n.isRead).length}
                                            </span>
                                        )}
                                    </button>
                                    <div className={ss.notification_tooltip}>
                                        <div className={ss.notification_list}>
                                            {notifications.length > 0 ? (
                                                notifications.map(notification => (
                                                    <div 
                                                        key={notification.id} 
                                                        className={`${ss.notification_item} ${!notification.isRead ? ss.unread : ''}`}
                                                    >
                                                        <img 
                                                            src={notification.user.avatar} 
                                                            alt={notification.user.username} 
                                                            className={ss.notification_avatar}
                                                        />
                                                        <div className={ss.notification_content}>
                                                            <div className={ss.notification_header}>
                                                                <span className={ss.notification_username}>
                                                                    {notification.user.username}
                                                                </span>
                                                                <span className={ss.notification_time}>
                                                                    • {notification.time}
                                                                </span>
                                                            </div>
                                                            <span className={ss.notification_text}>
                                                                {notification.content}
                                                                {notification.target && ` - ${notification.target}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={ss.empty_notifications}>
                                                    No notifications yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={ss.profile_wrap}>
                                <div 
                                    className={ss.profile_info}
                                    onClick={() => {
                                        const targetUrl = `/@${currentUser.userName}`;
                                        if (location.pathname === targetUrl) {
                                            window.location.reload();
                                        } else {
                                            navigate(targetUrl);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img 
                                        src={currentUser.avatar ? getAvatarImage(currentUser.avatar) : DEFAULT_PROFILE_IMAGE} 
                                        alt="Profile" 
                                        className={ss.profile_image} 
                                    />
                                    <div className={ss.user_info}>
                                        <span className={ss.username}>{currentUser.userName}</span>
                                        <span className={ss.fullname}>{currentUser.fullName}</span>
                                    </div>
                                    <div className={ss.profile_tooltip}>
                                        <div className={ss.tooltip_header}>
                                            <div className={ss.tooltip_names_container}>
                                                <img 
                                                    src={currentUser.avatar ? getAvatarImage(currentUser.avatar) : DEFAULT_PROFILE_IMAGE}
                                                    alt="Profile"
                                                    className={ss.profile_image}
                                                />
                                                <div className={ss.tooltip_names_wrap}>
                                                    <span className={ss.tooltip_username}>@{currentUser.userName}</span>
                                                    <span className={ss.tooltip_fullname}>{currentUser.fullName}</span>
                                                </div>
                                            </div>
                                            {/* <button
                                                className={ss.upgrade_btn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/pricing');
                                                }}
                                            >
                                                Upgrade to Pro
                                            </button> */}
                                        </div>
                                        <div className={ss.tooltip_stats}>
                                            <div className={ss.stat_item}>
                                                <span className={ss.stat_value}>{currentUser.stats?.followers || 0}</span>
                                                <span className={ss.stat_label}>Followers</span>
                                            </div>
                                            <div className={ss.stat_item}>
                                                <span className={ss.stat_value}>{currentUser.stats?.posts || 0}</span>
                                                <span className={ss.stat_label}>Posts</span>
                                            </div>
                                            <div className={ss.stat_item}>
                                                <span className={ss.stat_value}>{currentUser.stats?.likes || 0}</span>
                                                <span className={ss.stat_label}>Likes</span>
                                            </div>
                                            <div className={ss.stat_item}>
                                                <span className={ss.stat_value}>{currentUser.stats?.views || 0}</span>
                                                <span className={ss.stat_label}>Views</span>
                                            </div>
                                        </div>
                                        {/* <div className={ss.tooltip_credits}>
                                            <div className={ss.tooltip_credits_info}>
                                                <img src={CREDIT_ICON} alt="Credits" className={ss.tooltip_credits_icon} />
                                                <span className={ss.tooltip_credits_value}>
                                                    50
                                                    <span className={ss.tooltip_credits_unit}>credits</span>
                                                </span>
                                                <span className={ss.tooltip_credits_renew}>15 days left</span>
                                            </div>
                                            <button
                                                className={ss.tooltip_credits_btn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/pricing');
                                                }}
                                            >
                                                Get More
                                            </button>
                                        </div> */}
                                        <div className={ss.tooltip_actions}>
                                            <button 
                                                className={ss.logout_btn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLogout();
                                                }}
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className={ss.switch_wrap}>
                                    <span className={ss.switch_text}>Switch</span>
                                    <div className={ss.switch_tooltip}>
                                        <div className={ss.tooltip_header}>
                                            <span>Switch accounts</span>
                                        </div>
                                        <div className={ss.accounts_list}>
                                            <div className={`${ss.account_item} ${ss.active}`}>
                                                <img 
                                                    src={currentUser.avatar ? getAvatarImage(currentUser.avatar) : DEFAULT_PROFILE_IMAGE} 
                                                    alt="Profile" 
                                                />
                                                <div className={ss.account_info}>
                                                    <div className={ss.account_name_wrap}>
                                                        <span className={ss.account_name}>{currentUser.userName}</span>
                                                        {currentUser.isPrivate && <FaLock className={ss.lock_icon} />}
                                                    </div>
                                                    <span className={ss.account_fullname}>{currentUser.fullName}</span>
                                                    <span className={ss.account_label}>Active</span>
                                                </div>
                                            </div>
                                            {accounts.filter(account => account.userId !== currentUser.userId).map((account) => (
                                                <div
                                                    key={account.userId}
                                                    className={ss.account_item}
                                                    onClick={() => handleSwitchAccount(account.userId)}
                                                >
                                                    <img 
                                                        src={account.avatar ? getAvatarImage(account.avatar) : DEFAULT_PROFILE_IMAGE} 
                                                        alt="Profile" 
                                                    />
                                                    <div className={ss.account_info}>
                                                        <div className={ss.account_name_wrap}>
                                                            <span className={ss.account_name}>{account.username}</span>
                                                            {account.isPrivate && <FaLock className={ss.lock_icon} />}
                                                        </div>
                                                        <span className={ss.account_fullname}>{account.fullname}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            className={ss.add_account_btn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/login');
                                            }}
                                        >
                                            Add another account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <button className={ss.login_btn} onClick={() => navigate('/login')}>Login</button>
                            <button className={ss.signup_btn} onClick={() => navigate('/signup')}>Signup</button>
                            <button className={ss.pricing_btn} onClick={() => navigate('/pricing')}>Pricing</button>
                        </>
                    )}
                </div>
            </header>
            <Outlet />
            {location.pathname !== '/jam' && (
                <div className={ss.footer_wrap}>
                    <div className={ss.footer_content}>
                        <a href="#" className={ss.footer_link} onClick={handleTermsClick}>Terms</a>
                        <a href="#" className={ss.footer_link} onClick={handlePrivacyClick}>Privacy</a>
                        <span className={ss.footer_copyright}>© 2025 HEIMLICH INC.</span>
                    </div>
                </div>
            )}

            {modalType && (
                <TermsPrivacy
                    type={modalType}
                    onClose={() => setModalType(null)}
                />
            )}

            {showMessagesModal && (
                <MessagesModal
                    isOpen={showMessagesModal}
                    onClose={() => setShowMessagesModal(false)}
                />
            )}
        </div>
    )
}

export default AppLayout