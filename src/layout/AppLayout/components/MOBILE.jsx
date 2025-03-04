import React, { useState } from 'react'
import ss from './MOBILE.module.css'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FaSearch, FaLock, FaHome, FaCompass, FaImages, FaPlus, FaBell, FaExchangeAlt } from 'react-icons/fa'
import { ReactComponent as HyperLogo } from '../../../Assets/logos/hyper-logo-title-w.svg'
import MasterHandleModal from '../../../common/MasterHandleModal/MasterHandleModal'
import PasteModal from '../../../common/PasteModal/PasteModal'
import getAvatarImage from '../../../util/getAvatarImage'
import TermsPrivacy from '../../../common/TermsPrivacy/TermsPrivacy'
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

// Custom SVG Icons
const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L4 9V21H9V14H15V21H20V9L12 3Z"
            fill="currentColor"
        />
    </svg>
);

const SearchIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
        />
        <path
            d="M16.5 16.5L20 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const MessageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20V16H5.17L4 17.17V4ZM4 2C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2H4Z"
            fill="currentColor"
        />
    </svg>
);

const ExploreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
        />
        <path d="M15 9L13.5 14.5L9 15.5L10.5 10L15 9Z"
            fill="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CreateIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 4V20M4 12H20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const PaperPlaneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.7 2.3C21.5 2.1 21.2 2 21 2C20.8 2 20.6 2.1 20.4 2.2L2.4 11.2C2.1 11.4 2 11.7 2 12C2 12.3 2.2 12.6 2.5 12.7L8 15.5L15.5 8L12.7 14.8L18.8 17.8C18.9 17.9 19.1 17.9 19.2 17.9C19.4 17.9 19.6 17.8 19.8 17.7C20 17.5 20.1 17.3 20.1 17L22.1 3C22.1 2.7 22 2.5 21.7 2.3Z" 
            fill="currentColor"/>
    </svg>
);

const NotificationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" 
            fill="currentColor"/>
    </svg>
);

const MOBILE = ({ isLoggedIn, currentUser, accounts, handleLogout, handleSwitchAccount }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [searchModalPosition, setSearchModalPosition] = useState({ x: 0, y: 0 });
    const [modalType, setModalType] = useState(null);
    const [showMessagesModal, setShowMessagesModal] = useState(false);

    const handleSearchClick = (event) => {
        if (showSearchModal) {
            setShowSearchModal(false);
        } else {
            const searchButton = event.currentTarget;
            const rect = searchButton.getBoundingClientRect();
            setSearchModalPosition({
                x: rect.left,
                y: rect.top
            });
            setShowSearchModal(true);
        }
    };

    const handleCreateClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPasteModal(true);
    };

    const handleLogoClick = () => {
        if (location.pathname === '/') {
            window.location.reload();
        } else {
            navigate('/');
        }
    };

    const handleTermsClick = (e) => {
        e.preventDefault();
        setModalType('terms');
    };

    const handlePrivacyClick = (e) => {
        e.preventDefault();
        setModalType('privacy');
    };

    const handleMessageClick = () => {
        setShowMessagesModal(true);
    };

    return (
        <div className={ss.layout}>
            {/* 상단 네비게이션 */}
            <div className={ss.top_header}>
                <div className={ss.top_header_content}>
                    <div
                        className={ss.logo_wrap}
                        onClick={handleLogoClick}
                        style={{ cursor: 'pointer' }}
                    >
                        <HyperLogo />
                    </div>
                    {isLoggedIn && (
                        <div className={ss.action_buttons}>
                            <button
                                className={ss.action_btn}
                                onClick={handleMessageClick}
                            >
                                <PaperPlaneIcon />
                            </button>
                            <button
                                className={ss.action_btn}
                                onClick={() => navigate('/notifications')}
                            >
                                <NotificationIcon />
                                {currentUser?.notifications > 0 && (
                                    <span className={ss.notification_badge}>
                                        {currentUser.notifications}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 네비게이션 */}
            <div className={ss.bottom_header}>
                <nav className={ss.nav_menu}>
                    <button
                        className={`${ss.nav_btn} ${location.pathname === '/' ? ss.active : ''}`}
                        onClick={() => navigate('/')}
                    >
                        <HomeIcon />
                    </button>
                    <button
                        className={ss.nav_btn}
                        onClick={() => navigate('/explore')}
                    >
                        <ExploreIcon />
                    </button>
                    <button
                        className={ss.nav_btn}
                        onClick={handleCreateClick}
                    >
                        <CreateIcon />
                    </button>
                    <button
                        className={`${ss.nav_btn} ${showSearchModal ? ss.active : ''}`}
                        onClick={handleSearchClick}
                    >
                        <SearchIcon />
                    </button>
                    {isLoggedIn ? (
                        <div className={ss.profile_wrap}>
                            <img
                                src={currentUser.avatar ? getAvatarImage(currentUser.avatar) : DEFAULT_PROFILE_IMAGE}
                                alt="Profile"
                                className={ss.profile_image}
                                onClick={() => {
                                    const userProfilePath = `/@${currentUser.userName}`;
                                    if (location.pathname === userProfilePath) {
                                        window.location.reload();
                                    } else {
                                        navigate(userProfilePath);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className={ss.login_btn_wrap}>
                            <button
                                className={ss.login_btn}
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </button>
                        </div>
                    )}
                </nav>
            </div>

            {/* 메인 컨텐츠 */}
            <main className={ss.main_content}>
                <Outlet />
            </main>

            {/* 푸터 추가 */}
            <div className={ss.footer_wrap}>
                <div className={ss.footer_content}>
                    <a href="#" className={ss.footer_link} onClick={handleTermsClick}>Terms</a>
                    <a href="#" className={ss.footer_link} onClick={handlePrivacyClick}>Privacy</a>
                    <span className={ss.footer_copyright}>© 2025 HEIMLICH INC.</span>
                </div>
            </div>

            {/* Modals */}
            {showSearchModal && (
                <MasterHandleModal
                    onClose={() => setShowSearchModal(false)}
                    position={searchModalPosition}
                    onOpenPaste={() => {
                        setShowSearchModal(false);
                        setShowPasteModal(true);
                    }}
                />
            )}

            {showPasteModal && (
                <PasteModal
                    onClose={() => setShowPasteModal(false)}
                />
            )}

            {showMessagesModal && (
                <MessagesModal
                    isOpen={showMessagesModal}
                    onClose={() => setShowMessagesModal(false)}
                />
            )}

            {/* Terms/Privacy Modal 추가 */}
            {modalType && (
                <TermsPrivacy
                    type={modalType}
                    onClose={() => setModalType(null)}
                />
            )}
        </div>
    )
}

export default MOBILE