import React, { useState, useEffect } from 'react'
import ss from './MobileLayout.module.css'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    FaUserCircle,
    FaSearch,
    FaTasks,
    FaDoorOpen,
    FaProjectDiagram,
    FaUserClock,
    FaAddressBook,
} from 'react-icons/fa'
import { users, currentUser } from '../../data/mockDatabase'
import AediaLogo from '../../components/AediaLogo/AediaLogo'
import SearchModal from '../../components/SearchModal/SearchModal'
import { openSearchModal } from '../../utils/searchUtils'
import getProjectThumbnail from '../../utils/getProjectThumbnail'

const MobileLayout = ({ user }) => {
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





    // 메뉴 아이템 (하단 네비게이션용)
    const menuItems = [
        { path: '/attendance', label: '출석', icon: <FaUserClock /> },
        { path: '/todo', label: '할일', icon: <FaTasks /> },
        { path: '/room-reservation', label: '회의실', icon: <FaDoorOpen /> },
        { path: '/projects', label: '프로젝트', icon: <FaProjectDiagram /> },
        { path: '/contact', label: '연락처', icon: <FaAddressBook /> },
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




        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu, ss]);



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
                            width={34}
                            height={34}
                            color="#000000"
                            secondaryColor="#4A90E2"
                            theme={theme}
                            className={ss.logo}
                        />
                        {/* <h1 className={ss.logo_text}>AEDIA <span className={ss.logo_text_sub}>Creatives</span></h1> */}
                    </div>
                </div>

                {/* 헤더 오른쪽 - 검색, 알림, 프로필 */}
                <div className={ss.header_right}>
                    {/* 검색 버튼 (아이콘으로 변경) */}
                    <button className={ss.search_button_icon} onClick={handleSearchClick}>
                        <FaSearch />
                    </button>



                    {/* 프로필 영역 */}
                    <div className={ss.profile_menu_container}>
                        <div
                            className={ss.profile_button}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            {user?.avatar ? (
                                <img src={getProjectThumbnail(user?.avatar)} alt={user?.name} className={ss.avatar} />
                            ) : (
                                <FaUserCircle className={ss.avatar_icon} />
                            )}
                            {/* <span className={ss.user_name}>{user?.name}</span> */}
                        </div>

                        {/* 프로필 드롭다운 */}
                        {showProfileMenu && (
                            <div className={ss.profile_dropdown}>
                                <div className={ss.profile_header}>
                                    <div className={ss.profile_avatar_section}>
                                        {user?.avatar ? (
                                            <img src={getProjectThumbnail(user?.avatar)} alt={user?.name} className={ss.profile_avatar} />
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

            {/* 하단 네비게이션 바 (인스타그램 스타일) */}
            <nav className={ss.bottom_nav}>
                {menuItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) =>
                            `${ss.bottom_nav_item} ${isActive ? ss.active : ''}`
                        }
                        end={item.path === '/'}
                    >
                        <div className={ss.bottom_nav_icon}>
                            {item.icon}
                        </div>
                        <span className={ss.bottom_nav_label}></span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}

export default MobileLayout 