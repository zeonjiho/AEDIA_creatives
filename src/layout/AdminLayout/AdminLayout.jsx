import React, { useEffect, useState } from 'react'
import ss from './AdminLayout.module.css'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsers,
    faBars,
    faSignOutAlt,
    faHome,
    faChevronDown,
    faChevronRight,
    faTachometerAlt,
    faCoins,
    faCog,
    faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';

const AdminLayout = () => {

    const location = useLocation()
    const navigate = useNavigate()
    const [menuCollapsed, setMenuCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!sessionStorage.getItem('adminPasswordOk')) {
            setIsAdmin(false);
        } else {
            setIsAdmin(true);
        }

        // 모바일 여부 체크
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            // 모바일에서는 사이드바를 자동으로 접기
            if (window.innerWidth <= 768) {
                setMenuCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, [])

    // 로그아웃 처리
    const handleLogout = () => {
        sessionStorage.removeItem('adminPasswordOk');
        window.location.reload();
    };

    // 메뉴 토글 처리
    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    // 메뉴 접기/펼치기 토글
    const toggleSidebar = () => {
        setMenuCollapsed(!menuCollapsed);
    };

    // 계층적 메뉴 데이터
    const menuData = [
        // {
        //     id: 'manage-home',
        //     name: '홈페이지 관리',
        //     icon: faHome,
        //     submenus: [
        //         { id: 'banners', name: '메인배너', path: '/admin/manage-home/banners' },
        //         { id: 'popups', name: '팝업관리', path: '/admin/manage-home/popups' }
        //     ]
        // },
        {
            id: 'user',
            name: '인력 관리',
            icon: faUsers,
            submenus: [
                { id: 'user-list', name: '직원 목록', path: '/admin/user-list' },
                { id: 'staff-list', name: '스태프 목록', path: '/admin/staff-list' },
                { id: 'deleted-list', name: '삭제된 인력', path: '/admin/deleted-list' },
            ]
        },
        {
            id: 'attendance',
            name: '출석 관리',
            icon: faCalendarCheck,
            submenus: [
                { id: 'attendance-list', name: '출석 현황', path: '/admin/attendance' },
                { id: 'attendance-summary', name: '출석 통계', path: '/admin/attendance/summary' },
            ]
        },
        {
            id: 'finance',
            name: 'finance-management',
            icon: faCoins,
            submenus: [
                { id: 'finance-meal', name: '식사 영수증 관리', path: '/admin/finance/meal' },
                { id: 'finance-taxi', name: '택시비 영수증 관리', path: '/admin/finance/taxi' },
                { id: 'finance-credit-card', name: '법인카드 관리', path: '/admin/finance/credit-card' }
            ]
        },
        {
            id: 'etc',
            name: '기타',
            icon: faCog,
            submenus: [
                { id: 'room', name: '회의실 관리', path: '/admin/room' },
                { id: 'advanced-setting', name: 'Advanced Setting', path: '/admin/advanced-setting' },
            ]
        }
        // {
        //     id: 'products',
        //     name: '상품 관리',
        //     icon: faBox,
        //     submenus: [
        //         { id: 'products-category', name: '카테고리 관리', path: '/admin/products/category' },
        //         { id: 'products-list', name: '상품목록', path: '/admin/products/list' },
        //         { id: 'products-add', name: '상품등록', path: '/admin/products/add' },
        //         { id: 'products-free-designs', name: '무료 디자인 관리', path: '/admin/products/free-designs' }
        //     ]
        // },
        // {
        //     id: 'orders',
        //     name: '주문 관리',
        //     icon: faShoppingCart,
        //     submenus: [
        //         { id: 'orders-list', name: '주문확인', path: '/admin/orders/list' },
        //         { id: 'orders-shipping', name: '배송관리', path: '/admin/orders/shipping' }
        //     ]
        // }
    ];

    // 모바일 네비게이션용 메뉴 데이터 (평면화)
    const mobileMenuData = [
        { id: 'dashboard', name: '대시보드', icon: faTachometerAlt, path: '/admin' },
        { id: 'user-list', name: '직원', icon: faUsers, path: '/admin/user-list' },
        { id: 'staff-list', name: '스태프', icon: faUsers, path: '/admin/staff-list' },
        { id: 'attendance', name: '출석', icon: faCalendarCheck, path: '/admin/attendance' },
        { id: 'finance-meal', name: '식비', icon: faCoins, path: '/admin/finance/meal' },
        { id: 'finance-taxi', name: '택시', icon: faCoins, path: '/admin/finance/taxi' },
    ];

    // 현재 활성화된 대메뉴 확인
    const isActiveMainMenu = (menuId) => {
        const menu = menuData.find(m => m.id === menuId);
        if (!menu || !menu.submenus) return false;

        return menu.submenus.some(submenu => location.pathname.includes(submenu.path));
    };

    // 메뉴 초기 확장 상태 설정 (현재 경로에 따라)
    useEffect(() => {
        const newExpandedState = {};

        menuData.forEach(menu => {
            if (isActiveMainMenu(menu.id)) {
                newExpandedState[menu.id] = true;
            }
        });

        setExpandedMenus(prev => ({ ...prev, ...newExpandedState }));
    }, [location.pathname]);

    // 현재 활성화된 메뉴의 이름 가져오기
    const getCurrentMenuName = () => {
        if (location.pathname === '/admin') return '대시보드';

        for (const menu of menuData) {
            if (menu.submenus) {
                // 정확한 경로 매칭
                const activeSubmenu = menu.submenus.find(sub => location.pathname === sub.path);
                if (activeSubmenu) return activeSubmenu.name;
                
                // 중첩된 경로를 위한 부분 매칭 (예: /admin/attendance/summary)
                const partialMatch = menu.submenus.find(sub => location.pathname.startsWith(sub.path));
                if (partialMatch) return partialMatch.name;
            }
        }
        
        // 출석 관리 페이지들을 위한 추가 처리
        if (location.pathname.startsWith('/admin/attendance')) {
            if (location.pathname === '/admin/attendance') return '출석 현황';
            if (location.pathname === '/admin/attendance/summary') return '출석 통계';
        }
        
        return '대시보드';
    };

    // 메뉴 클릭 처리 함수 수정
    const handleMenuClick = (path, e) => {
        // 현재 경로와 동일한 메뉴를 클릭했을 때 콘텐츠 영역만 새로고침
        if (location.pathname === path) {
            e.preventDefault(); // 기본 링크 동작 방지

            // 콘텐츠 새로고침 키 업데이트
            setRefreshKey(prevKey => prevKey + 1);
            return;
        }

        // 다른 경로면 기본 링크 동작 수행 (navigate는 자동으로 진행됨)
    };

    // 관리자 인증이 안 된 경우
    // if (!isAdmin) {
    //     return (
    //         <div className={ss.authError}>
    //             <h2>접근 권한이 없습니다</h2>
    //             <p>관리자 인증이 필요합니다.</p>
    //             <button onClick={() => window.location.href = '/admin-login'}>
    //                 로그인 페이지로 이동
    //             </button>
    //         </div>
    //     );
    // }

    return (
        <div className={ss.adminContainer}>
            {/* 데스크톱 좌측 메뉴 사이드바 */}
            {!isMobile && (
                <div className={`${ss.sidebar} ${menuCollapsed ? ss.collapsed : ''}`}>
                    <div className={ss.sidebarHeader}>
                        {!menuCollapsed && (
                            <>
                                <h2 className={ss.title}>AEDIASTUDIO</h2>
                                <h3 className={ss.subtitle}>관리자 페이지</h3>
                            </>
                        )}
                        <button
                            className={ss.toggleBtn}
                            onClick={toggleSidebar}
                            aria-label="메뉴 접기/펼치기"
                        >
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </div>

                    <nav className={ss.navigation}>
                        <ul className={ss.mainMenu}>
                            <li className={`${location.pathname === '/admin' ? ss.active : ''} ${ss.menuLi}`}>
                                <Link
                                    to="/admin"
                                    className={ss.menuItem}
                                    onClick={(e) => handleMenuClick('/admin', e)}
                                >
                                    <div className={ss.iconWrapper}>
                                        <FontAwesomeIcon icon={faTachometerAlt} />
                                    </div>
                                    {!menuCollapsed && <span className={ss.menuText}>대시보드</span>}
                                </Link>
                            </li>

                            {menuData.map((menu) => (
                                <li
                                    key={menu.id}
                                    className={`${isActiveMainMenu(menu.id) ? ss.active : ''} ${expandedMenus[menu.id] ? ss.expanded : ''} ${ss.menuLi}`}
                                >
                                    <div
                                        className={ss.menuItem}
                                        onClick={() => menuCollapsed ? navigate(menu.submenus[0].path) : toggleMenu(menu.id)}
                                    >
                                        <div className={ss.iconWrapper}>
                                            <FontAwesomeIcon icon={menu.icon} />
                                        </div>
                                        {!menuCollapsed && (
                                            <>
                                                <span className={ss.menuText}>{menu.name}</span>
                                                <FontAwesomeIcon
                                                    className={ss.chevron}
                                                    icon={expandedMenus[menu.id] ? faChevronDown : faChevronRight}
                                                />
                                            </>
                                        )}
                                    </div>

                                    {!menuCollapsed && expandedMenus[menu.id] && (
                                        <ul className={ss.submenu}>
                                            {menu.submenus.map(submenu => (
                                                <li
                                                    key={submenu.id}
                                                    className={`${location.pathname === submenu.path ? ss.active : ''} ${ss.submenuItem}`}
                                                >
                                                    <Link
                                                        to={submenu.path}
                                                        className={ss.submenuLink}
                                                        onClick={(e) => handleMenuClick(submenu.path, e)}
                                                    >
                                                        <span>{submenu.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className={ss.sidebarFooter}>
                        <button className={`${ss.homeBtn} ${ss.footerBtn}`} onClick={() => navigate('/')}>
                            <div className={ss.iconWrapper}>
                                <FontAwesomeIcon icon={faHome} className={ss.footerIcon} />
                            </div>
                            {!menuCollapsed && <span className={ss.menuText}>메인 사이트</span>}
                        </button>
                        <button className={`${ss.logoutBtn} ${ss.footerBtn}`} onClick={handleLogout}>
                            <div className={ss.iconWrapper}>
                                <FontAwesomeIcon icon={faSignOutAlt} className={ss.footerIcon} />
                            </div>
                            {!menuCollapsed && <span className={ss.menuText}>로그아웃</span>}
                        </button>
                    </div>
                </div>
            )}

            {/* 메인 컨텐츠 영역 */}
            <div className={`${ss.mainContent} ${menuCollapsed ? ss.expanded : ''} ${isMobile ? ss.mobile : ''}`}>
                {/* 모바일 헤더 */}
                {isMobile && (
                    <header className={ss.mobileHeader}>
                        <div className={ss.mobileHeaderContent}>
                            <h2 className={ss.mobileTitle}>AEDIA Studio</h2>
                            <div className={ss.mobileSubtitle}>{getCurrentMenuName()}</div>
                        </div>
                        <button className={ss.mobileLogoutBtn} onClick={handleLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </header>
                )}

                {/* 데스크톱 헤더 */}
                {!isMobile && (
                    <header className={ss.header}>
                        <div className={ss.headerLeft}>
                            <h2>{getCurrentMenuName()}</h2>
                        </div>
                        <div className={ss.headerRight}>
                            <div className={ss.adminInfo}>
                                <span className={ss.adminName}>관리자</span>
                            </div>
                        </div>
                    </header>
                )}

                <main className={ss.content}>
                    {/* refreshKey를 key로 사용하여 Outlet 컴포넌트 다시 마운트 */}
                    <Outlet key={refreshKey} context={{ refreshKey, setRefreshKey }} />
                </main>
            </div>

            {/* 모바일 하단 네비게이션 */}
            {isMobile && (
                <nav className={ss.mobileNav}>
                    <div className={ss.mobileNavContent}>
                        {mobileMenuData.map((item) => (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`${ss.mobileNavItem} ${location.pathname === item.path ? ss.active : ''}`}
                                onClick={(e) => handleMenuClick(item.path, e)}
                            >
                                <FontAwesomeIcon icon={item.icon} className={ss.mobileNavIcon} />
                                <span className={ss.mobileNavText}>{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
            )}
        </div>
    );
}

export default AdminLayout
