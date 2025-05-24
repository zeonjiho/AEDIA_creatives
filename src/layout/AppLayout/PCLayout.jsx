import React, { useState, useEffect } from 'react'
import ss from './PCLayout.module.css'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    FaUserCircle,
    FaBell,
    FaSearch,
} from 'react-icons/fa'
import { users, notifications, currentUser } from '../../data/mockDatabase'
import AediaLogo from '../../components/AediaLogo/AediaLogo'
import SearchModal from '../../components/SearchModal/SearchModal'
import { openSearchModal } from '../../utils/searchUtils'

const PCLayout = ({ user }) => {
    const navigate = useNavigate()
    const location = useLocation()

    // 테마 상태 관리 (읽기 전용)
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'light'
    })

    // 테마 변경 감지
    useEffect(() => {
        const handleStorageChange = () => {
            const savedTheme = localStorage.getItem('theme') || 'light'
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        }

        // 초기 테마 설정
        document.documentElement.setAttribute('data-theme', theme)

        // 로컬스토리지 변경 감지
        window.addEventListener('storage', handleStorageChange)
        
        // 페이지 포커스 시에도 확인 (같은 탭에서 변경된 경우)
        const checkTheme = () => {
            const currentTheme = localStorage.getItem('theme') || 'light'
            if (currentTheme !== theme) {
                setTheme(currentTheme)
                document.documentElement.setAttribute('data-theme', currentTheme)
            }
        }
        
        window.addEventListener('focus', checkTheme)
        const interval = setInterval(checkTheme, 1000)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('focus', checkTheme)
            clearInterval(interval)
        }
    }, [theme])

    // 프로필 메뉴 토글
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    // 알림 메뉴 토글
    const [showNotifications, setShowNotifications] = useState(false)

    // 메뉴 아이템
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: null },
        { path: '/attendance', label: 'Attendance', icon: null },
        { path: '/todo', label: 'Todo', icon: null },
        { path: '/calendar', label: 'Calendar', icon: null },
        { path: '/room-reservation', label: 'Rooms', icon: null },
        { path: '/projects', label: 'Projects', icon: null },
        { path: '/contact', label: 'Contact', icon: null },
        { path: '/receipts', label: 'Receipts', icon: null },
    ]

    // 프로필 메뉴 아이템
    const profileMenuItems = [
        { label: '내 프로필', action: () => navigate('/profile') },
        { label: '설정', action: () => navigate('/settings') },
        {
            label: '로그아웃', action: () => {
                // 로그아웃 처리
                localStorage.removeItem('token')
                window.location.reload()
            }
        }
    ]

    // 알림 데이터
    const [notificationsList, setNotificationsList] = useState([])

    // 알림 데이터 로드
    useEffect(() => {
        // 읽지 않은 알림만 표시
        setNotificationsList(notifications.filter(n => !n.read).slice(0, 5))
    }, [])

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            // 클래스 이름을 직접 확인하는 헬퍼 함수
            const hasClass = (element, className) => {
                if (!element) return false;
                return element.classList.contains(className);
            };

            // 부모 요소 중에 특정 클래스를 가진 요소가 있는지 확인
            const hasParentWithClass = (element, className) => {
                let currentElement = element;
                while (currentElement) {
                    if (hasClass(currentElement, className)) {
                        return true;
                    }
                    currentElement = currentElement.parentElement;
                }
                return false;
            };

            // 프로필 메뉴 외부 클릭 시 닫기
            if (showProfileMenu && !hasParentWithClass(event.target, ss.profile_menu_container)) {
                setShowProfileMenu(false);
            }

            // 알림 메뉴 외부 클릭 시 닫기
            if (showNotifications && !hasParentWithClass(event.target, ss.notifications_container)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu, showNotifications, ss]);

    // 알림 시간 포맷팅
    const formatNotificationTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) {
            return `${diffMins}분 전`
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`
        } else {
            return `${diffDays}일 전`
        }
    }

    // 검색 핸들러 - 검색 모달 열기로 변경
    const handleSearchClick = () => {
        openSearchModal();
    }

    return (
        <div className={ss.app_container}>
            {/* 검색 모달 컴포넌트 */}
            <SearchModal />

            {/* 헤더 */}
            <header className={ss.header}>
                <div className={ss.header_left}>
                    {/* 로고 */}
                    <div className={ss.logo_wrap} onClick={() => navigate('/')}>
                        <AediaLogo
                            width={40}
                            height={42}
                            color="#000000"
                            secondaryColor="#4A90E2"
                            theme={theme}
                            className={ss.logo}
                        />
                        {/* <h1 className={ss.logo_text}>AEDIA STUDIO <span className={ss.logo_text_sub}>Creatives</span></h1> */}
                    </div>
                </div>

                {/* 헤더 중앙 - 네비게이션 */}
                <nav className={ss.main_nav}>
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) =>
                                `${ss.nav_item} ${isActive ? ss.active : ''}`
                            }
                            end={item.path === '/'}
                        >
                            <span className={ss.nav_label}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* 헤더 오른쪽 - 검색, 알림, 프로필 */}
                <div className={ss.header_right}>
                    {/* 검색 버튼 (아이콘으로 변경) */}
                    <button className={ss.search_button_icon} onClick={handleSearchClick}>
                        <FaSearch />
                    </button>

                    {/* 알림 버튼 */}
                    <div className={ss.notifications_container}>
                        <div
                            className={ss.notification_button}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FaBell />
                            {/* {user.notifications > 0 && (
                                <span className={ss.notification_badge}>{user.notifications}</span>
                            )} */}
                        </div>

                        {/* 알림 드롭다운 */}
                        {showNotifications && (
                            <div className={ss.notifications_dropdown}>
                                <div className={ss.notifications_header}>
                                    <h3>알림</h3>
                                    <button className={ss.clear_all}>모두 읽음</button>
                                </div>
                                <div className={ss.notifications_list}>
                                    {notificationsList.length > 0 ? (
                                        notificationsList.map(notification => (
                                            <div key={notification.id} className={ss.notification_item}>
                                                <div className={ss.notification_content}>
                                                    <h4 className={ss.notification_title}>{notification.title}</h4>
                                                    <p className={ss.notification_text}>{notification.message}</p>
                                                </div>
                                                <span className={ss.notification_time}>
                                                    {formatNotificationTime(notification.createdAt)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={ss.no_notifications}>새로운 알림이 없습니다.</p>
                                    )}
                                </div>
                                <div className={ss.notifications_footer}>
                                    <button
                                        className={ss.view_all}
                                        onClick={() => {
                                            navigate('/notifications')
                                            setShowNotifications(false)
                                        }}
                                    >
                                        모든 알림 보기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 프로필 영역 */}
                    <div className={ss.profile_menu_container}>
                        <div
                            className={ss.profile_button}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user?.name} className={ss.avatar} />
                            ) : (
                                <FaUserCircle className={ss.avatar_icon} />
                            )}
                            <span className={ss.user_name}>{user?.name}</span>
                        </div>

                        {/* 프로필 드롭다운 */}
                        {showProfileMenu && (
                            <div className={ss.profile_dropdown}>
                                <div className={ss.profile_header}>
                                    <div className={ss.profile_avatar_section}>
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user?.name} className={ss.profile_avatar} />
                                        ) : (
                                            <FaUserCircle className={ss.profile_avatar_placeholder} />
                                        )}
                                    </div>
                                    <div className={ss.profile_info}>
                                        <h3 className={ss.profile_name}>{user?.name}</h3>
                                        <p className={ss.profile_role}>{user?.role}</p>
                                        <p className={ss.profile_email}>{user?.email}</p>
                                    </div>
                                </div>
                                <div className={ss.profile_divider}></div>
                                <div className={ss.profile_menu}>
                                    {profileMenuItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className={ss.profile_menu_item}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                item.action();
                                                setShowProfileMenu(false);
                                            }}
                                        >
                                            <span className={ss.menu_item_text}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className={ss.content_area}>
                <Outlet />
            </main>
        </div>
    )
}

export default PCLayout 