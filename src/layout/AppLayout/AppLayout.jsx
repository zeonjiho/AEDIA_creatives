// ----------------------------------------------------------
// Imports
// ----------------------------------------------------------
import React, { useEffect, useState, useRef } from 'react';
import ss from './AppLayout.module.css';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaLock, FaHome, FaCompass, FaImages, FaPlus, FaBell, FaExchangeAlt, FaLayerGroup, FaEdit } from 'react-icons/fa';
import TermsPrivacy from '../../common/TermsPrivacy/TermsPrivacy';
import api from '../../util/api';
import { jwtDecode } from 'jwt-decode';
import { ReactComponent as HyperLogo } from '../../Assets/logos/hyper-logo-title-w.svg';

// ----------------------------------------------------------
// Child Components
// ----------------------------------------------------------
import PC from './components/PC';
import MOBILE from './components/MOBILE';
import PasteModal from '../../common/PasteModal/PasteModal';
import MasterHandleModal from '../../common/MasterHandleModal/MasterHandleModal';
import MinimizedModal from '../../common/PasteModal/components/MinimizedModal/MinimizedModal';
import PasteDetector from '../../common/PasteDetector/PasteDetector';
import DragDropHandler from './components/DragDropHandler';

// ----------------------------------------------------------
// Constants (Images, Icons)
// ----------------------------------------------------------
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
        xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 10V20H9V14H15V20H20V10L12 4Z" fill="#FFFFFF"/>
    </svg>
`)}`;

// ----------------------------------------------------------
// AppLayout Component
// ----------------------------------------------------------
const AppLayout = () => {
  // ----------------------------------------------------------
  // State & Ref
  // ----------------------------------------------------------
  const navigate = useNavigate();
  const location = useLocation();

  const [modalType, setModalType] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isMasterHandleModalOpen, setIsMasterHandleModalOpen] = useState(false);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [activeModalId, setActiveModalId] = useState(null);
  const [activeModalData, setActiveModalData] = useState(null);
  const [minimizedModals, setMinimizedModals] = useState([]);

  const modalIdCounter = useRef(0);

  const [currentUser, setCurrentUser] = useState({
    userId: '',
    username: 'Username',
    fullname: '',
    profileImage: DEFAULT_PROFILE_IMAGE,
    isPrivate: true,
    stats: {
      followers: 1200,
      views: 5000,
      likes: 3500,
      uploads: 120,
      exp: 750,
      level: 5,
    },
  });

  const [accounts, setAccounts] = useState([
    {
      userId: 'user1',
      username: 'zeonjiho',
      fullname: 'JIHO JEON®',
      profileImage: '',
      isPrivate: false,
      isActive: true,
    },
    {
      userId: 'user2',
      username: 'other_account',
      fullname: 'Other User',
      profileImage: DEFAULT_PROFILE_IMAGE,
      isPrivate: true,
      isActive: false,
    },
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
        avatar: DEFAULT_PROFILE_IMAGE,
      },
      content: 'liked your post',
      target: 'Beautiful sunset photo',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: 2,
      type: 'follow',
      user: {
        username: 'jane_smith',
        avatar: DEFAULT_PROFILE_IMAGE,
      },
      content: 'started following you',
      time: '1 day ago',
      isRead: false,
    },
    {
      id: 3,
      type: 'comment',
      user: {
        username: 'mike_wilson',
        avatar: DEFAULT_PROFILE_IMAGE,
      },
      content: 'commented on your post',
      target: 'Code snippet',
      time: '2 days ago',
      isRead: true,
    },
  ]);
  const [isNotificationTooltipOpen, setIsNotificationTooltipOpen] = useState(false);

  // ----------------------------------------------------------
  // Lifecycle & Effects
  // ----------------------------------------------------------
  useEffect(() => {
    autoLoginAndLogout();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMasterHandleModalOpen) {
        setMousePosition({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMasterHandleModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPasteModalOpen, isMasterHandleModalOpen]);

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleKeyDown = async (e) => {
    const isInputActive =
      e.target.matches('input, textarea, [contenteditable="true"]') ||
      e.target.closest('input, textarea, [contenteditable="true"]');

    // 스페이스바: 마스터 핸들 모달 열기/닫기
    if (e.code === 'Space' && !isInputActive) {
      e.preventDefault();
      if (isMasterHandleModalOpen) {
        setIsMasterHandleModalOpen(false);
      } else {
        setModalPosition(mousePosition);
        setIsMasterHandleModalOpen(true);
      }
    }

    // ESC 키: 마스터 핸들 모달 닫기
    if (e.key === 'Escape' && isMasterHandleModalOpen) {
      setIsMasterHandleModalOpen(false);
    }
  };

  // 복사된 콘텐츠 감지 처리 함수
  const handlePasteDetected = (pasteData) => {
    const newModalId = modalIdCounter.current++;
    setActiveModalId(newModalId);
    
    // 데이터 처리 및 모달 데이터 구성
    const modalData = {
      ...pasteData,
      contentType: pasteData.contentType,
      pastedContent: pasteData.pastedContent,
      code: pasteData.contentType === 'code' ? pasteData.code || pasteData.pastedContent : '',
      language: pasteData.contentType === 'code' ? pasteData.language || 'javascript' : 'javascript',
      thumbnailImage: pasteData.thumbnailImage || null
    };
    
    setActiveModalData(modalData);
    setIsPasteModalOpen(true);
    setIsMasterHandleModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsPasteModalOpen(false);
  };

  const handleMinimizeModal = (modalId, modalData) => {
    console.log('handleMinimizeModal - modalData:', modalData);
    
    // 모든 필요한 데이터를 저장합니다
    const minimizedModalData = {
      id: modalId,
      contentType: modalData.contentType,
      selectedCollections: modalData.selectedCollections,
      pastedContent: modalData.pastedContent,
      title: modalData.title || '',
      // 추가 데이터 저장
      isPublic: modalData.isPublic,
      tags: modalData.tags,
      description: modalData.description,
      isAIEnabled: modalData.isAIEnabled,
      thumbnailImage: modalData.thumbnailImage,
      code: modalData.code,
      language: modalData.language
    };
    
    console.log('handleMinimizeModal - minimizedModalData:', minimizedModalData);

    setMinimizedModals((prev) => [...prev, minimizedModalData]);
    setActiveModalId(null);
    setActiveModalData(null);
    setIsPasteModalOpen(false);
  };

  const handleMaximizeModal = (modalId) => {
    const modalToMaximize = minimizedModals.find((modal) => modal.id === modalId);
    console.log('handleMaximizeModal - modalToMaximize:', modalToMaximize);
    
    // localStorage에서 추가 데이터 불러오기 시도
    let storedData = null;
    try {
      const storedDataString = localStorage.getItem(`minimizedModal_${modalId}`);
      if (storedDataString) {
        storedData = JSON.parse(storedDataString);
        console.log('handleMaximizeModal - storedData from localStorage:', storedData);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    
    // 모달에서 필요한 모든 데이터를 포함시킵니다
    const fullModalData = {
      id: modalId,
      contentType: modalToMaximize.contentType,
      selectedCollections: modalToMaximize.selectedCollections || (storedData?.selectedCollections || []),
      pastedContent: modalToMaximize.pastedContent,
      title: modalToMaximize.title || '',
      // 기타 필요한 데이터도 추가
      isPublic: modalToMaximize.isPublic !== undefined ? modalToMaximize.isPublic : true,
      tags: modalToMaximize.tags || [],
      description: modalToMaximize.description || '',
      isAIEnabled: modalToMaximize.isAIEnabled !== undefined ? modalToMaximize.isAIEnabled : true,
      thumbnailImage: modalToMaximize.thumbnailImage || null,
      code: modalToMaximize.code || '',
      language: modalToMaximize.language || 'javascript'
    };
    
    console.log('handleMaximizeModal - fullModalData:', fullModalData);
    
    setMinimizedModals((prev) => prev.filter((modal) => modal.id !== modalId));
    setActiveModalId(modalId);
    setActiveModalData(fullModalData);
    setIsPasteModalOpen(true);
  };

  const handleRemoveModal = (modalId) => {
    console.log('handleRemoveModal - modalId:', modalId);
    setMinimizedModals((prev) => prev.filter((modal) => modal.id !== modalId));
    // localStorage에서도 삭제
    localStorage.removeItem(`minimizedModal_${modalId}`);
  };

  const handleCloseMasterHandleModal = () => {
    setIsMasterHandleModalOpen(false);
  };

  const handleOpenPaste = () => {
    const newModalId = modalIdCounter.current++;
    setActiveModalId(newModalId);
    setActiveModalData(null);
    setIsPasteModalOpen(true);
    setIsMasterHandleModalOpen(false);
  };

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
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await api.post('/user/validation-user-status-and-update-last-visit', {
        userId: jwtDecode(localStorage.getItem('token')).userId,
      });

      if (response.status === 200) {
        setIsLoggedIn(true);

        // 프로필 이미지가 없을 경우 기본 이미지로 설정
        if (!response.data.profileImage) {
          response.data.profileImage = DEFAULT_PROFILE_IMAGE;
        }
        setCurrentUser(response.data);
      } else if (response.status === 201) {
        handleLogout('no-reload');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = (reload) => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);

    if (reload === 'no-reload') {
      return;
    }
    window.location.reload();
  };

  const handleSwitchAccount = async (userId) => {
    try {
      const response = await api.post('/user/switch-account', { userId });
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        await autoLoginAndLogout();
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
        setIsSwitchTooltipOpen(false);
        setIsProfileTooltipOpen(true);
      } else {
        setIsProfileTooltipOpen(false);
        navigate('/mypage');
      }
    } else {
      navigate('/mypage');
    }
  };

  const handleSwitchClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      if (!isSwitchTooltipOpen) {
        setIsProfileTooltipOpen(false);
        setIsSwitchTooltipOpen(true);
      } else {
        setIsSwitchTooltipOpen(false);
      }
    }
  };

  const handleHomeClick = () => {
    window.location.href = '/'; // navigate 대신 새로고침
  };

  const handleNotificationClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNotificationTooltipOpen(!isNotificationTooltipOpen);
    setIsProfileTooltipOpen(false);
    setIsSwitchTooltipOpen(false);
  };

  // 드롭된 파일 처리 함수
  const handleDroppedFiles = (files) => {
    if (files.length === 0) return;
    
    const file = files[0]; // 첫 번째 파일만 처리
    const newModalId = modalIdCounter.current++;
    setActiveModalId(newModalId);
    
    if (file.type.startsWith('image/')) {
      // 이미지 파일 처리
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const modalData = {
            contentType: 'image',
            pastedContent: '',
            thumbnailImage: {
              src: img.src,
              width: img.width,
              height: img.height
            }
          };
          setActiveModalData(modalData);
          setIsPasteModalOpen(true);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      // 비디오 파일 처리
      const modalData = {
        contentType: 'video',
        pastedContent: file.name,
        file: file
      };
      setActiveModalData(modalData);
      setIsPasteModalOpen(true);
    } else if (file.type.startsWith('audio/')) {
      // 오디오 파일 처리
      const modalData = {
        contentType: 'music',
        pastedContent: file.name,
        file: file
      };
      setActiveModalData(modalData);
      setIsPasteModalOpen(true);
    } else {
      // 텍스트 파일 처리 (코드 파일 등)
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        
        // 파일 확장자에 따른 언어 감지
        const fileExtension = file.name.split('.').pop().toLowerCase();
        let language = 'javascript'; // 기본값
        
        // 파일 확장자에 따른 언어 매핑
        const extensionToLanguage = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'c': 'c',
          'cpp': 'cpp',
          'cs': 'csharp',
          'php': 'php',
          'rb': 'ruby',
          'go': 'go',
          'rs': 'rust',
          'swift': 'swift',
          'kt': 'kotlin',
          'html': 'html',
          'css': 'css',
          'scss': 'scss',
          'json': 'json',
          'md': 'markdown',
          'sql': 'sql',
          'sh': 'bash',
          'vex': 'vex'
        };
        
        if (extensionToLanguage[fileExtension]) {
          language = extensionToLanguage[fileExtension];
        }
        
        const modalData = {
          contentType: 'code',
          pastedContent: file.name,
          code: content,
          language: language
        };
        
        setActiveModalData(modalData);
        setIsPasteModalOpen(true);
      };
      reader.readAsText(file);
    }
  };

  // 드롭된 텍스트 처리 함수
  const handleDroppedText = (text) => {
    if (!text) return;
    
    const newModalId = modalIdCounter.current++;
    setActiveModalId(newModalId);
    
    // URL 형식 조정
    let pastedData = text.trim();
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    const isUrl = urlPattern.test(pastedData);
    
    if (isUrl && !pastedData.startsWith('http://') && !pastedData.startsWith('https://')) {
      pastedData = 'https://' + pastedData;
    }
    
    // 기본 콘텐츠 타입 설정
    let contentType = 'link';
    let detectedLanguage = 'javascript'; // 기본 언어
    
    // 유튜브, 비메오 등 비디오 URL 감지
    const videoUrlPattern = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|tiktok\.com|vm\.tiktok\.com)/i;
    if (isUrl && videoUrlPattern.test(pastedData)) {
      contentType = 'video';
    }
    
    // 음악 URL 감지
    const musicUrlPattern = /(spotify\.com|soundcloud\.com|apple\.com\/music|music\.apple\.com|tidal\.com)/i;
    if (isUrl && musicUrlPattern.test(pastedData)) {
      contentType = 'music';
    }
    
    // 이미지 URL 감지
    const imageUrlPattern = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i;
    if (isUrl && imageUrlPattern.test(pastedData)) {
      contentType = 'image';
      
      // 이미지 URL인 경우 썸네일 정보 추가
      try {
        const img = new Image();
        img.onload = () => {
          const modalData = {
            pastedContent: pastedData,
            contentType: 'image',
            thumbnailImage: {
              src: pastedData,
              width: img.width,
              height: img.height
            }
          };
          setActiveModalData(modalData);
          setIsPasteModalOpen(true);
        };
        img.onerror = () => {
          // 이미지 로드 실패 시 일반 URL로 처리
          const modalData = {
            pastedContent: pastedData,
            contentType: 'link'
          };
          setActiveModalData(modalData);
          setIsPasteModalOpen(true);
        };
        img.src = pastedData;
        return; // 이미지 로드 중이므로 여기서 종료
      } catch (error) {
        console.error('이미지 로드 실패:', error);
        // 실패 시 일반 URL로 처리
        contentType = 'link';
      }
    }
    
    // 코드 감지 로직
    const isMultiline = pastedData.includes('\n');
    const hasBraces = /[{}\[\]();]/.test(pastedData);
    const isCode = isMultiline || hasBraces;
    
    if (isCode && !isUrl) {
      contentType = 'code';
    }
    
    // 모달 데이터 설정 및 모달 열기
    const modalData = {
      pastedContent: pastedData,
      contentType: contentType,
      code: contentType === 'code' ? pastedData : '',
      language: detectedLanguage
    };
    
    setActiveModalData(modalData);
    setIsPasteModalOpen(true);
  };

  // ----------------------------------------------------------
  // Common Props (자식 컴포넌트에 넘길 공통 데이터 및 함수)
  // ----------------------------------------------------------
  const commonProps = {
    isLoggedIn,
    currentUser,
    accounts,
    handleLogout,
    handleSwitchAccount,
    handleProfileClick,
    handleSwitchClick,
    isProfileTooltipOpen,
    isSwitchTooltipOpen,
    setIsProfileTooltipOpen,
    setIsSwitchTooltipOpen,
    notifications,
    isNotificationTooltipOpen,
    setIsNotificationTooltipOpen,
    handleNotificationClick,
    isPasteModalOpen,
    isMasterHandleModalOpen,
    modalPosition,
    activeModalId,
    activeModalData,
    minimizedModals,
    handleCloseModal,
    handleMinimizeModal,
    handleMaximizeModal,
    handleCloseMasterHandleModal,
    handleOpenPaste,
    handleRemoveModal,
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className={ss.layout}>
      {isMobile ? (
        <MOBILE {...commonProps} />
      ) : (
        <PC {...commonProps} />
      )}

      {/* PasteDetector 컴포넌트 추가 */}
      <PasteDetector 
        onPasteDetected={handlePasteDetected} 
        isActive={!isPasteModalOpen} 
      />

      {/* DragDropHandler 컴포넌트 추가 */}
      <DragDropHandler
        onFilesDrop={handleDroppedFiles}
        onTextDrop={handleDroppedText}
        isActive={!isPasteModalOpen}
      />

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <PasteModal
          modalId={activeModalId}
          initialData={activeModalData}
          onClose={handleCloseModal}
          onMinimize={handleMinimizeModal}
          onMaximize={handleMaximizeModal}
        />
      )}

      {/* Master Handle Modal */}
      {isMasterHandleModalOpen && (
        <MasterHandleModal
          onClose={handleCloseMasterHandleModal}
          position={modalPosition}
          onOpenPaste={handleOpenPaste}
        />
      )}

      {/* Minimized Modals */}
      <div className={ss.minimizedModalsContainer}>
        {minimizedModals.map((modal, index) => (
          <MinimizedModal
            key={modal.id}
            modalId={modal.id}
            index={index}
            contentType={modal.contentType}
            selectedCollections={modal.selectedCollections}
            title={modal.title}
            pastedContent={modal.pastedContent}
            onMaximize={handleMaximizeModal}
            onRemove={handleRemoveModal}
          />
        ))}
      </div>

      {/* Outlet (자식 라우트가 렌더링되는 부분)
      <Outlet context={{
        isLoggedIn,
        currentUser,
        accounts,
        handleLogout,
        handleSwitchAccount,
        handleProfileClick,
        handleSwitchClick,
        isProfileTooltipOpen,
        isSwitchTooltipOpen,
        setIsProfileTooltipOpen,
        setIsSwitchTooltipOpen,
        notifications,
        isNotificationTooltipOpen,
        setIsNotificationTooltipOpen,
        handleNotificationClick,
        isPasteModalOpen,
        isMasterHandleModalOpen,
        modalPosition,
        activeModalId,
        activeModalData,
        minimizedModals,
        handleCloseModal,
        handleMinimizeModal,
        handleMaximizeModal,
        handleCloseMasterHandleModal,
        handleOpenPaste
      }} /> */}
    </div>
  );
};

export default AppLayout;