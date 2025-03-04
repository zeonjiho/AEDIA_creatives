import React, { useState, useEffect, useRef } from 'react'
import ss from './MyPage.module.css'
import SettingModal from './components/SettingModal/SettingModal'
import Profile from './components/Profile/Profile'
import Posts from './components/Posts/Posts'
import Likes from './components/Likes/Likes'
import Collections from './components/Collections/Collections'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../util/api'
import CollectionSelector from '../../common/CollectionSelector/CollectionSelector'
import { jwtDecode } from 'jwt-decode'
import SortFilter from './components/SortFilter/SortFilter'
import defaultProfileImage from '../../Assets/default-profile.svg'
import CollectionDetailModal from '../../common/CollectionDetailModal/CollectionDetailModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import PasteModal from '../../common/PasteModal/PasteModal'
import CreateCollectionModal from '../../common/CollectionSelector/CreateCollectionModal/CreateCollectionModal'

const DEFAULT_PROFILE_IMAGE = defaultProfileImage;

const MyPage = () => {
    const { userNameOnUrl } = useParams()
    const navigate = useNavigate()
    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('posts')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [coverImage, setCoverImage] = useState(null)
    const [userData, setUserData] = useState({})
    const fileInputRef = useRef(null)
    const coverInputRef = useRef(null)
    const [isMasterHandleModalOpen, setIsMasterHandleModalOpen] = useState(false)
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isCollectionSelectorOpen, setIsCollectionSelectorOpen] = useState(false);
    const [sortBy, setSortBy] = useState('latest');
    const [visibility, setVisibility] = useState('public');
    const [isCollectionDetailModalOpen, setIsCollectionDetailModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const pasteModalRef = useRef(null);
    const [collectionSelectorCreateMode, setCollectionSelectorCreateMode] = useState(false);
    const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'))

        if (!userNameOnUrl?.startsWith('@')) {
            navigate('/')
            return
        }

        getUserInfo()
    }, [userNameOnUrl, navigate])

    // PasteModal에서 발생한 refreshPageData 이벤트를 감지하여 페이지 데이터 새로고침
    useEffect(() => {
        // 페이지 데이터 새로고침 이벤트 리스너
        const handleRefreshPageData = (event) => {
            console.log('MyPage에서 refreshPageData 이벤트 감지:', event.detail);
            // 현재 페이지가 마이페이지인 경우에만 새로고침
            if (window.location.pathname.includes('/user/')) {
                getUserInfo();
                // 현재 활성화된 탭에 따라 다른 데이터 새로고침
                if (activeTab === 'posts') {
                    // Posts 컴포넌트 새로고침 로직
                    const postsRefreshEvent = new CustomEvent('refreshPosts');
                    window.dispatchEvent(postsRefreshEvent);
                } else if (activeTab === 'collections') {
                    // Collections 컴포넌트 새로고침 로직
                    const collectionsRefreshEvent = new CustomEvent('refreshCollections');
                    window.dispatchEvent(collectionsRefreshEvent);
                } else if (activeTab === 'likes') {
                    // Likes 컴포넌트 새로고침 로직
                    const likesRefreshEvent = new CustomEvent('refreshLikes');
                    window.dispatchEvent(likesRefreshEvent);
                }
            }
        };

        // 전역 함수로 등록하여 다른 컴포넌트에서도 접근 가능하게 함
        window.refreshPageData = () => {
            getUserInfo();
            // 현재 활성화된 탭에 따라 다른 데이터 새로고침
            if (activeTab === 'posts') {
                const postsRefreshEvent = new CustomEvent('refreshPosts');
                window.dispatchEvent(postsRefreshEvent);
            } else if (activeTab === 'collections') {
                const collectionsRefreshEvent = new CustomEvent('refreshCollections');
                window.dispatchEvent(collectionsRefreshEvent);
            } else if (activeTab === 'likes') {
                const likesRefreshEvent = new CustomEvent('refreshLikes');
                window.dispatchEvent(likesRefreshEvent);
            }
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('refreshPageData', handleRefreshPageData);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 및 전역 함수 제거
        return () => {
            window.removeEventListener('refreshPageData', handleRefreshPageData);
            delete window.refreshPageData;
        };
    }, [activeTab]);

    const getUserInfo = async () => {
        try {
            const userName = userNameOnUrl.substring(1)
            const response = await api.get(`/user/get-info-by-userName?userName=${userName}`)
            if (response.status === 200) {
                setUserData(response.data)
            }
        } catch (err) {
            console.error(err)
            if (err.response?.status === 404) {
                navigate('/')
            }
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return <Posts />
            case 'likes':
                return <Likes />
            case 'collections':
                return <Collections />
            default:
                return <Posts />
        }
    }

    const handleCoverImageClick = () => {
        coverInputRef.current.click()
    }

    const handleCoverImageChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            try {
                const imageUrl = URL.createObjectURL(file)
                setCoverImage(imageUrl)
            } catch (error) {
                console.error('Failed to update cover image:', error)
            }
        }
    }

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isMasterHandleModalOpen) {
                setMousePosition({
                    x: e.clientX,
                    y: e.clientY
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMasterHandleModalOpen]);

    const handleKeyDown = async (e) => {
        if (e.code === 'Space' && !e.target.closest('input, textarea')) {
            e.preventDefault();
            if (isMasterHandleModalOpen) {
                setIsMasterHandleModalOpen(false);
            } else {
                setModalPosition(mousePosition);
                setIsMasterHandleModalOpen(true);
            }
        }
        if (e.key === 'Escape' && isMasterHandleModalOpen) {
            setIsMasterHandleModalOpen(false);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isMasterHandleModalOpen, mousePosition]);

    const handleCloseMasterHandleModal = () => {
        setIsMasterHandleModalOpen(false)
    }

    const handleOpenCollectionSelector = () => {
        setIsCollectionSelectorOpen(true);
        setIsMasterHandleModalOpen(false);
    };

    const handleCollectionSelect = (collection) => {
        console.log('Selected collection:', collection);
    };

    const handleCollectionClick = (collection) => {
        setSelectedCollection(collection);
        setIsCollectionDetailModalOpen(true);
    };

    const handleCloseCollectionDetail = () => {
        setIsCollectionDetailModalOpen(false);
        setSelectedCollection(null);
    };

    const isCurrentUserProfile = isLoggedIn && userData._id === jwtDecode(localStorage.getItem('token')).userId;

    const handleOpenPasteModal = () => {
        setIsPasteModalOpen(true);
    };

    const handleClosePasteModal = () => {
        setIsPasteModalOpen(false);
    };

    const handleMinimizePasteModal = (modalId, modalData) => {
        console.log('Minimizing PasteModal:', modalId, modalData);
    };

    const handleMaximizePasteModal = (modalId) => {
        console.log('Maximizing PasteModal:', modalId);
    };

    const handleOpenCollectionSelectorForCreate = () => {
        setIsCollectionSelectorOpen(true);
        setCollectionSelectorCreateMode(true);
    };

    const handleCloseCollectionSelector = () => {
        setIsCollectionSelectorOpen(false);
        setCollectionSelectorCreateMode(false);
    };

    const handleOpenCreateCollectionModal = () => {
        setIsCreateCollectionModalOpen(true);
    };

    const handleCloseCreateCollectionModal = () => {
        setIsCreateCollectionModalOpen(false);
    };

    const handleCollectionCreated = () => {
        setIsCreateCollectionModalOpen(false);
    };

    if (!userData._id) {
        return <div>Loading...</div>
    }

    return (
        <div className={ss.container}>
            <Profile
                targetUserData={userData}
                isLoggedIn={isLoggedIn}
                setIsSettingModalOpen={setIsSettingModalOpen}
                onCoverImageClick={handleCoverImageClick}
                coverImage={coverImage}
            />

            <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverImageChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <div className={ss.tabsContainer}>
                <div className={ss.tabs}>
                    <button
                        className={`${ss.tab} ${activeTab === 'collections' ? ss.active : ''}`}
                        onClick={() => setActiveTab('collections')}
                    >
                        Collections
                    </button>
                    <button
                        className={`${ss.tab} ${activeTab === 'posts' ? ss.active : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        Posts
                    </button>
                    {isLoggedIn && userData._id === jwtDecode(localStorage.getItem('token')).userId && (
                        <>
                            <button
                                className={`${ss.tab} ${activeTab === 'likes' ? ss.active : ''}`}
                                onClick={() => setActiveTab('likes')}
                            >
                                Likes
                            </button>
                            <button
                                className={`${ss.tab} ${activeTab === 'archives' ? ss.active : ''}`}
                                onClick={() => setActiveTab('archives')}
                            >
                                Archives
                            </button>
                        </>
                    )}
                </div>
                <div className={ss.actionsContainer}>
                    {(activeTab === 'collections' || activeTab === 'posts') && (
                        <button 
                            className={ss.createButton}
                            onClick={
                                activeTab === 'collections' 
                                    ? handleOpenCreateCollectionModal
                                    : handleOpenPasteModal
                            }
                        >
                            <FontAwesomeIcon icon={faPlus} className={ss.createIcon} />
                            <span className={ss.createText}>
                                {activeTab === 'collections' ? 'New Collection' : 'New Hyperlink'}
                            </span>
                        </button>
                    )}
                    <SortFilter
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        visibility={visibility}
                        setVisibility={setVisibility}
                    />
                </div>
            </div>

            <div className={ss.content}>
                <div className={ss.tabContent}>
                    {activeTab === 'collections' && (
                        <Collections onCollectionClick={handleCollectionClick} sidebarWidth={0} />
                    )}
                    {activeTab === 'posts' && (
                        <Posts sidebarWidth={0} />
                    )}
                    {activeTab === 'likes' && (
                        <Likes sidebarWidth={0} />
                    )}
                </div>
            </div>

            {isSettingModalOpen && (
                <SettingModal
                    userData={userData}
                    onClose={() => setIsSettingModalOpen(false)}
                    refreshUserInfo={getUserInfo}
                />
            )}

            <CollectionSelector
                isOpen={isCollectionSelectorOpen}
                onClose={handleCloseCollectionSelector}
                onSelect={handleCollectionSelect}
                initialCreateMode={collectionSelectorCreateMode}
            />

            {isCollectionDetailModalOpen && selectedCollection && (
                <CollectionDetailModal
                    collection={selectedCollection}
                    onClose={handleCloseCollectionDetail}
                    currentUser={userData}
                />
            )}

            {isPasteModalOpen && (
                <PasteModal
                    ref={pasteModalRef}
                    onClose={handleClosePasteModal}
                    onMinimize={handleMinimizePasteModal}
                    onMaximize={handleMaximizePasteModal}
                    modalId="mypage-paste-modal"
                    initialData={{
                        contentType: 'link',
                        pastedContent: '',
                        title: '',
                        isPublic: true,
                        tags: [],
                        description: '',
                        isAIEnabled: true
                    }}
                />
            )}

            <CreateCollectionModal
                isOpen={isCreateCollectionModalOpen}
                onClose={handleCloseCreateCollectionModal}
                onCreated={handleCollectionCreated}
            />
        </div>
    )
}

export default MyPage 