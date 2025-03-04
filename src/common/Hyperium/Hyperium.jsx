import React, { useState, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faChartSimple,
  faCircleInfo,
  faPaperPlane,
  faLink,
  faThumbtack,
  faDownload,
  faFolder,
  faGlobe,
  faBoxArchive,
  faFolderOpen,
  faArrowUpRightFromSquare,
  faLayerGroup,
  faPlus,
  faShare,
  faLock,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons';
import { FaEllipsisV } from 'react-icons/fa';  // 세로 점 3개 아이콘
import ss from './Hyperium.module.css';
import CardDetailModal from '../CardDetailModal/CardDetailModal';
import HyperExtensions from './HyperExtensions/HyperExtensions';
import { useNavigate } from 'react-router-dom';
import CollectionSelector from '../CollectionSelector/CollectionSelector';
import PlatformIcon from '../SupportedPlatforms/PlatformIcons';
import getAvatarImage from '../../util/getAvatarImage';
import getThumbnailImage from '../../util/getThumbnailImage';
import baseURL from '../../util/baseURL';
import defaultProfileImage from '../../Assets/default-profile.svg';
import DeleteWarning from './Components/DeleteWarning/DeleteWarning';
import api from '../../util/api';
import { jwtDecode } from 'jwt-decode';

import NotificationStack from './Components/NotificationStacks/NotificationStack';
import { supportedPlatforms } from '../SupportedPlatforms/PlatformIcons';
import SettingsMenu from './Components/SettingMenu/SettingsMenu';
import ActionMenu from './Components/ActionMenu/ActionMenu';

const MasonryGrid = ({
  cards,
  breakpointColumns = {
    default: 4,
    1024: 3,
    768: 2, // 최소 2열로 설정
  },
  currentUser,
  onCardClick,
  containerWidth // 컨테이너 너비를 props로 받음
}) => {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // State & Ref
  // ----------------------------------------------------------
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLongHover, setIsLongHover] = useState(false);
  const [blurredCard, setBlurredCard] = useState(null);
  const [likedCards, setLikedCards] = useState(new Set());
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLongPress, setIsLongPress] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showSettings, setShowSettings] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // ----- 타이머 관련 Ref -----
  const longPressTimerRef = useRef(null);    //  (1) 드래그 시도 타이머 (300ms)
  const dragActivationTimerRef = useRef(null); // (2) 실제 드래그 활성화 타이머 (예: 500ms)

  const cursorPosition = useRef({ x: 0, y: 0 });
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDragAttempt, setIsDragAttempt] = useState(false);
  const clickTimeoutRef = useRef(null);
  const [savedCards, setSavedCards] = useState(new Set());
  const [mobileHoveredCard, setMobileHoveredCard] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // 모바일 여부 상태로 관리

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [cardLikes, setCardLikes] = useState({}); // 각 카드별 좋아요 수
  const [showExtensions, setShowExtensions] = useState(false);
  const [queue, setQueue] = useState([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [notifications, setNotifications] = useState([]); // 여러 알림을 관리하기 위한 배열
  const [showCardDetailModal, setShowCardDetailModal] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isLikeProcessing, setIsLikeProcessing] = useState({}); // 좋아요 처리 중인 상태 추가
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showMobileMenu, setShowMobileMenu] = useState(null);

  // Add new state for action menu
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  // 모바일 여부 감지를 위한 이벤트 리스너 추가
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 로드 시 한 번 실행

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // (A) 코드/링크 타입은 로드 없이 바로 loadedImages에 추가
  useEffect(() => {
    cards.forEach(card => {
      if (card.contentType === 'code' || card.contentType === 'link') {
        setLoadedImages(prev => new Set([...prev, card._id]));
      }
    });
  }, [cards]);

  // (B) 모바일 호버 해제 처리
  useEffect(() => {
    if (!isMobile) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${ss.card}`)) {
        setMobileHoveredCard(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile]);

  // (C) 드래그 중이면 전역 mousemove/mouseup 등록
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // (D) 마운트/언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearAllDragTimers();
    };
  }, []);

  // 설정 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${ss.settingsMenu}`)) {
        setShowSettings(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 최초 로딩 시 해당 유저가 좋아요 누른 카드 있는지 판별 후 likedCards에 추가
  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    cards.forEach(card => {
      if (card.likes.includes(currentUserId)) {
        setLikedCards(prev => new Set([...prev, card._id]));
      }
    });
  }, [cards, currentUserId]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return;
    }
    setCurrentUserId(jwtDecode(localStorage.getItem('token')).userId);
  }, []);

  // ----------------------------------------------------------
  // Common Handlers
  // ----------------------------------------------------------
  // 이미지 로드 핸들러
  const handleImageLoad = (cardId) => {
    setLoadedImages(prev => new Set([...prev, cardId]));
  };

  // 카드 클릭 => 상세 모달 (단, 드래그 중이면 방지)
  const handleCardClick = (cardId) => {
    if (isDragging || isDragAttempt) return;
    navigate(`/artwork/${cardId}`);
  };

  // 마우스 Enter/Leave
  const handleCardMouseEnter = (cardId) => {
    // 모바일 환경은 Long Hover 미적용
    if (!isMobile) {
      setHoveredCard(cardId);
      // 5초 뒤 long hover 시작
      clickTimeoutRef.current = setTimeout(() => {
        setIsLongHover(true);
      }, 5000);
    }
  };

  const handleCardMouseLeave = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    setHoveredCard(null);
    setIsLongHover(false);
    setBlurredCard(null);
  };

  // 카드 Info Click
  const handleInfoClick = (cardId, e) => {
    e.stopPropagation();
    setBlurredCard(blurredCard === cardId ? null : cardId);
  };

  // ----------------------------------------------------------
  // Like / Share / Copy / Save
  // ----------------------------------------------------------
  const handleLike = async (cardId, e, initialLikes) => {
    e.stopPropagation();

    // 이미 처리 중이면 무시
    if (isLikeProcessing[cardId]) {
      return;
    }

    // 로그인 체크
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userId = jwtDecode(token).userId;

    try {
      // 처리 시작 표시
      setIsLikeProcessing(prev => ({ ...prev, [cardId]: true }));

      const response = await api.post('/toggle-like', {
        hyperlinkId: cardId,
        userId
      });

      if (response.status === 200) {
        const { likes, isLiked } = response.data;

        setLikedCards(prev => {
          const newLikedCards = new Set(prev);
          if (isLiked) {
            newLikedCards.add(cardId);
          } else {
            newLikedCards.delete(cardId);
          }
          return newLikedCards;
        });

        setCardLikes(prev => ({
          ...prev,
          [cardId]: likes
        }));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // 에러 처리 (예: 토스트 메시지 표시)
    } finally {
      // 처리 완료 표시
      setTimeout(() => {
        setIsLikeProcessing(prev => ({ ...prev, [cardId]: false }));
      }, 200); // 200ms 딜레이로 연속 클릭 방지
    }
  };

  const handleShare = (cardId, e) => {
    e.stopPropagation();
    // 공유 로직
    if (navigator.share) {
      navigator.share({
        title: 'Share Artwork',
        url: `${window.location.origin}/artwork/${cardId}`
      });
    } else {
      console.log('Web Share API not supported');
    }
  };

  const handleCopy = (cardId, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/artwork/${cardId}`;
    navigator.clipboard.writeText(url);
    // 복사 완료 알림 등 추가 가능
  };

  const handleSave = (cardId, e) => {
    e.stopPropagation();
    setSavedCards(prev => {
      const newSaved = new Set(prev);
      newSaved.has(cardId) ? newSaved.delete(cardId) : newSaved.add(cardId);
      return newSaved;
    });
  };

  const handleDirectMessage = (cardId, e) => {
    e.stopPropagation();
    console.log('Send DM for card:', cardId);
    // DM 모달 또는 채팅 인터페이스 표시 가능
  };

  // ----------------------------------------------------------
  // 드래그 로직
  // ----------------------------------------------------------
  // 기존 드래그 타이머/상태 모두 초기화
  const clearAllDragTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (dragActivationTimerRef.current) {
      clearTimeout(dragActivationTimerRef.current);
      dragActivationTimerRef.current = null;
    }
  };

  // 마우스 다운 시
  const handleMouseDown = (e, cardId) => {
    // 드래그 중 또는 타이머 동작 중이면 먼저 정리
    if (isDragging) handleMouseUp();
    clearAllDragTimers();

    const card = e.currentTarget;
    cursorPosition.current = { x: e.clientX, y: e.clientY };
    setIsDragAttempt(false);

    // (1) 300ms 후 '드래그 시도' 상태로 전환
    longPressTimerRef.current = setTimeout(() => {
      setIsDragAttempt(true);
      setIsLongPress(true);
      setShowExtensions(true); // Extensions 열기
      card.classList.add(ss.timerBorder);
      card.classList.add(ss.grabbing);

      // (2) 추가로 500ms 뒤에 실제 드래그 시작
      dragActivationTimerRef.current = setTimeout(() => {
        setShowTimer(false);
        const rect = card.getBoundingClientRect();

        // placeholder 생성
        const placeholder = document.createElement('div');
        placeholder.className = ss.placeholder;
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        card.parentNode.insertBefore(placeholder, card);

        // 드래그 오프셋 계산
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });

        // 카드 위치 고정
        card.style.position = 'fixed';
        card.style.zIndex = '1000';
        card.style.width = `${rect.width}px`;
        card.style.left = `${rect.left}px`;
        card.style.top = `${rect.top}px`;

        // 클래스 전환
        card.classList.remove(ss.grabbing);
        card.classList.add(ss.dragging);

        setDraggedCard(card);
        setIsDragging(true);
      }, 500);

      setShowTimer(true);
    }, 300);
  };

  // 실제 드래그 이동
  const updateCardPosition = (clientX, clientY) => {
    if (!draggedCard) return;
    draggedCard.style.transition = 'none';
    draggedCard.style.left = `${clientX - dragOffset.x}px`;
    draggedCard.style.top = `${clientY - dragOffset.y}px`;
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggedCard) {
      e.preventDefault();
      updateCardPosition(e.clientX, e.clientY);
    }
  };

  // 마우스 업 시
  const handleMouseUp = () => {
    clearAllDragTimers();

    // 드래그가 진행 중이었다면 모두 정리
    if (draggedCard) {
      draggedCard.classList.remove(ss.timerBorder, ss.grabbing, ss.dragging);

      // placeholder 제거
      const placeholder = document.querySelector(`.${ss.placeholder}`);
      if (placeholder) {
        placeholder.parentNode.removeChild(placeholder);
      }

      // 원래 위치 복귀
      draggedCard.style.position = '';
      draggedCard.style.zIndex = '';
      draggedCard.style.left = '';
      draggedCard.style.top = '';
      draggedCard.style.width = '';

      setDraggedCard(null);
    }

    setIsDragging(false);
    setIsLongPress(false);
    setShowTimer(false);
  };

  // ----------------------------------------------------------
  // Tooltip
  // ----------------------------------------------------------
  const handleIconMouseMove = (e, type) => {
    e.stopPropagation();
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setTooltipContent(type === 'collection' ? 'Collection' : 'Hyperlink');
  };

  const handleIconMouseEnter = (e, type) => {
    e.stopPropagation();
    setShowTooltip(true);
    setTooltipContent(type === 'collection' ? 'Collection' : 'Hyperlink');
  };

  const handleIconMouseLeave = (e) => {
    e.stopPropagation();
    setShowTooltip(false);
  };

  // ----------------------------------------------------------
  // 컬렉션 / 확장 기능
  // ----------------------------------------------------------
  const handleCollectionClick = (e, cardId) => {
    e.stopPropagation(); // 부모 클릭 막기
    setSelectedCard(cards.find(card => card._id === cardId));
    setShowCollectionSelector(true);
  };

  const handleExtensionsDrop = (cardId) => {
    const originalCard = cards.find(card => card._id === cardId);
    if (originalCard) {
      const newQueueItem = {
        id: Date.now(),
        card: originalCard,
        status: 'pending'
      };
      setQueue(prev => [...prev, newQueueItem]);
    }
  };

  // ----------------------------------------------------------
  // Notification
  // ----------------------------------------------------------
  const handleNotificationClose = (id) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target?.timeoutId) {
        clearTimeout(target.timeoutId);
      }
      return prev.map(n =>
        n.id === id
          ? { ...n, isCancelled: true }
          : n
      );
    });

    // 애니메이션 딜레이(0.7s) + 애니메이션 시간(0.3s) = 1초 후에 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 1000);
  };

  const showNotification = (message) => {
    const id = Date.now();
    const newNotification = { id, message, timeoutId: null };
    setNotifications(prev => [...prev, newNotification]);

    // 5초 후 자동으로 닫힘 타이머
    const timeoutId = setTimeout(() => {
      handleNotificationClose(id);
    }, 5000);

    // timeoutId를 저장
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, timeoutId } : notif
      )
    );
  };

  // ----------------------------------------------------------
  // CollectionSelector Callback
  // ----------------------------------------------------------
  const handleCollectionSelect = (selectedCollections, notification) => {
    // 알림 추가
    if (notification) {
      setNotifications(prev => [...prev, {
        ...notification,
        isCancelled: false
      }]);

      // 5초 후 자동으로 알림 제거
      setTimeout(() => {
        handleNotificationClose(notification.id);
      }, 5000);
    }
  };

  // ----------------------------------------------------------
  // Masonry에 빈 카드 채우기
  // ----------------------------------------------------------
  const fillEmptyCards = (cards) => {
    const currentWidth = window.innerWidth;
    let maxColumns;

    if (currentWidth > 1024) {
      maxColumns = 4;
    } else if (currentWidth > 768) {
      maxColumns = 3;
    } else if (currentWidth > 480) {
      maxColumns = 2;
    } else {
      maxColumns = 2;
    }

    // 현재 행이 완전히 채워지지 않았을 때 필요한 빈 카드 수 계산
    const remainder = cards.length % maxColumns;
    if (remainder === 0) return cards;

    // 마지막 행을 채우기 위해 필요한 빈 카드 생성
    const emptyCards = Array(maxColumns - remainder)
      .fill(null)
      .map((_, index) => ({
        id: `empty-${index}`,
        isEmpty: true,
        width: '100%',
        height: '0',
        margin: '0',  // 마진 제거
        padding: '0', // 패딩 제거
        border: 'none', // 테두리 제거
        boxSizing: 'border-box',
        minHeight: '0', // 최소 높이 제거
        maxHeight: '0', // 최대 높이 제거
        overflow: 'hidden' // 내용 숨기기
      }));

    return [...cards, ...emptyCards];
  };

  const filledCards = fillEmptyCards(cards);

  // Settings 관련 핸들러 추가
  const handleSettingsClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();

    // console.log('Settings Click:', {
    //   clickedCardId: cardId,
    //   currentShowSettings: showSettings,
    //   willSetTo: showSettings === cardId ? null : cardId
    // });

    // 현재 메뉴가 열려있다면 닫기
    if (showSettings === cardId) {
      setShowSettings(null);
      return;
    }

    // 버튼의 위치 정보 저장
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.right,
      y: rect.top
    });

    setShowSettings(cardId);
  };

  const handleSettingsAction = (e, card, action) => {
    e.stopPropagation();
    setShowSettings(null);

    if (action === 'delete') {
      setCardToDelete(card);
      setShowDeleteWarning(true);
    } else if (action === 'report') {
      // Handle report action
      console.log('Report card:', card._id);
      // Additional report handling logic would go here
    }
    // ... other actions
  };

  const handleDeleteConfirm = () => {
    // 삭제 로직
    console.log('Delete card:', cardToDelete?._id);
    setShowDeleteWarning(false);
    setCardToDelete(null);
  };

  // URL 유효성 검사 함수 추가
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (err) {
      return false;
    }
  };

  const getDomainDisplay = (url) => {
    try {
      // URL이 유효한지 먼저 확인
      if (!isValidUrl(url)) {
        return '';
      }

      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // 플랫폼 매칭 먼저 시도
      const platform = supportedPlatforms.find(p =>
        p.domains.some(domain => hostname.includes(domain))
      );

      if (platform) {
        return platform.name;
      }

      // 도메인 파싱
      const parts = hostname
        .replace(/^www\./, '')  // www. 제거
        .split('.');            // 점으로 분리

      // TLD(최상위 도메인)를 제외한 마지막 부분 사용
      // 예: beta.hyper.bz -> hyper
      //     sub.example.com -> example
      const mainDomain = parts[parts.length - 2] || parts[0];

      // 첫 글자 대문자로 변환
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);

    } catch (e) {
      return '';
    }
  };

  // 모바일 메뉴 토글 함수
  const toggleMobileMenu = (e, cardId) => {
    e.stopPropagation();
    setShowMobileMenu(showMobileMenu === cardId ? null : cardId);
  };

  // 모바일 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${ss.mobileActionMenu}`) &&
        !e.target.closest(`.${ss.settingsButton}`)) {
        setShowMobileMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Action menu toggle function - only for mobile
  const toggleActionMenu = (e, cardId) => {
    if (!isMobile) return; // Only show on mobile

    e.stopPropagation();

    // If menu is already open for this card, close it
    if (showActionMenu === cardId) {
      setShowActionMenu(null);
      return;
    }

    // Get button position for menu placement
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      x: rect.right,
      y: rect.top
    });

    setShowActionMenu(cardId);
  };

  // Handle action menu item clicks
  const handleActionMenuClick = (e, card, action) => {
    e.stopPropagation();
    setShowActionMenu(null);

    switch (action) {
      case 'collection':
        handleCollectionClick(e, card._id);
        break;
      case 'copy':
        handleCopy(card._id, e);
        break;
      case 'share':
        handleShare(card._id, e);
        break;
      case 'message':
        handleDirectMessage(card._id, e);
        break;
      default:
        break;
    }
  };

  // 카드 좌측 하단 LINK, IMAGE 등 구분. 추후에 utils 폴더로 이동될 수도 있음
  const getContentType = (card) => {
    if (card.dataType === 'collection') {
      return 'Collection'
    } else if (card.dataType === 'hyperlink') {
      switch (card.contentType) {
        case 'image':
          return 'IMAGE'
        case 'link':
          return 'LINK'
        case 'code':
          return 'CODE'
        case 'video':
          return 'VIDEO'
        case 'music':
          return 'MUSIC'
        default:
          return 'UNKNOWN'
      }
    }
  }

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${ss.actionMenu}`) &&
        !e.target.closest(`.${ss.actionButton}`)) {
        setShowActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 컨테이너 너비에 따라 동적으로 열 수 계산
  const calculateColumns = (width) => {
    if (!width) return breakpointColumns.default;
    if (width < 300) return 1;
    if (width < 400) return 2;
    if (width < 600) return 3;
    return 4;
  };

  // 동적 breakpoint 설정
  const dynamicBreakpoints = {
    default: calculateColumns(containerWidth),
    1024: Math.min(calculateColumns(containerWidth), 3),
    768: Math.min(calculateColumns(containerWidth), 2)
  };

  // 실제 사용할 breakpoints
  const effectiveBreakpoints = containerWidth ? dynamicBreakpoints : breakpointColumns;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  // console.log('MasonryGrid currentUser:', currentUser);

  return (
    <>
      <Masonry
        breakpointCols={effectiveBreakpoints}
        className={ss.masonry}
        columnClassName={ss.masonry_column}
      >
        {filledCards.map((card, idx) => (
          card.isEmpty ? (
            <div key={idx} className={ss.emptyCard} />
          ) : (
            <div
              key={idx}
              className={`
                ${ss.card} 
                ${loadedImages.has(card._id) ? ss.loaded : ''} 
                ${(isLongPress && draggedCard === card) ? ss.grabbing : ''}
                ${(isDragging && draggedCard === card) ? ss.dragging : ''}
                ${(isLongHover && hoveredCard === card._id) || (isMobile && mobileHoveredCard === card._id) ? ss.cardHovered : ''}
                ${(isLongHover && hoveredCard !== card._id) || (isMobile && mobileHoveredCard && mobileHoveredCard !== card._id) ? ss.cardDimmed : ''}
                ${blurredCard === card._id ? ss.cardBlurred : ''}
              `}
              onMouseDown={(e) => handleMouseDown(e, card._id)}
              onMouseUp={handleMouseUp}
              onMouseEnter={() => !isMobile && handleCardMouseEnter(card._id)}
              onMouseLeave={() => !isMobile && handleCardMouseLeave()}
              data-type={card.contentType}
              onClick={() => {
                // 모달 열기(이동)
                if (!isDragging && !isDragAttempt) {
                  if (onCardClick) {
                    // 외부에서 제공된 onCardClick 함수가 있으면 호출
                    onCardClick(card._id);
                    // 기본 동작 방지
                    return;
                  }

                  // 기본 동작: 카드 상세 모달 열기
                  if (card.dataType === 'collection') {
                    // 컬렉션 클릭 핸들러 호출
                  } else {
                    setSelectedCard(card);
                    setShowCardDetailModal(true);
                  }
                }
              }}
            >
              {/* 이미지 / 코드 / 링크 영역 */}
              <div className={ss.imageContainer}>
                {(card.contentType === 'image' || card.contentType === 'video') && (
                  card.thumbnail && (
                    <img
                      src={getThumbnailImage(card.thumbnail, 'mini')}
                      alt={card.title}
                      onLoad={() => handleImageLoad(card._id)}
                    />
                  )
                )}
                {card.contentType === 'link' && (
                  <div className={ss.linkPreview}>
                    {card.thumbnail && (
                      <img
                        src={getThumbnailImage(card.thumbnail, 'mini')}
                        alt={card.title}
                        onLoad={() => handleImageLoad(card._id)}
                        loading="lazy"
                      />
                    )}
                  </div>
                )}
                {card.contentType === 'code' && (
                  <div className={ss.codePreview}>
                    <div className={ss.codeHeader}>
                      <span className={ss.language}>
                        {card.codeLanguage || 'Text'}
                      </span>
                      <span className={ss.lineCount}>
                        {(card.content?.split('\n')?.length || 0)} lines
                      </span>
                    </div>
                    <pre className={ss.code}>
                      {(card.content?.split('\n') || []).slice(0, 8).map((line, i) => (
                        <div key={i} className={ss.codeLine}>
                          <span className={ss.lineNumber}>{i + 1}</span>
                          <code className={ss.codeContent}>{line}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                )}

                {/* Source Info */}
                {card.content && (
                  <div className={ss.sourceInfo}>
                    {/* URL인 경우 아이콘 표시 */}
                    {card.content && (
                      isValidUrl(card.content) ? (
                        <PlatformIcon
                          url={card.content}
                          className={ss.sourceFavicon}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faGlobe}
                          className={ss.sourceFavicon}
                        />
                      )
                    )}
                    <a
                      href={isValidUrl(card.content) ? card.content : '#'}
                      className={ss.sourceDomain}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isValidUrl(card.content)) {
                          e.preventDefault();
                        }
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getDomainDisplay(card.content) || 'Link'}
                    </a>
                  </div>
                )}
                {/* 오버레이 */}
                <div className={ss.overlay}>
                  <div className={ss.tags}>
                    {card.tags.map((tag, index) => (
                      <span key={index} className={ss.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className={ss.overlayButtons}>
                    <button
                      onClick={(e) => handleCollectionClick(e, card._id)}
                      className={ss.overlayButton}
                      title="Add to Collection"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button
                      onClick={(e) => handleCopy(card._id, e)}
                      className={ss.overlayButton}
                      title="Copy Link"
                    >
                      <FontAwesomeIcon icon={faLink} />
                    </button>
                    <button
                      onClick={(e) => handleShare(card._id, e)}
                      className={ss.overlayButton}
                      title="Share"
                    >
                      <FontAwesomeIcon icon={faShare} />
                    </button>
                    <button
                      onClick={(e) => handleDirectMessage(card._id, e)}
                      className={ss.overlayButton}
                      title="Direct Message"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 카드 텍스트 / 메타 영역 */}
              <div className={ss.titleContainer}>
                {/* 소스 링크 (URL이 있는 경우만) - 타이틀 위에 표시 (모바일에서만) */}
                {isMobile && card.content && isValidUrl(card.content) && (
                  <div className={ss.sourceLinkContainer}>
                    <a
                      href={card.content}
                      className={ss.sourceLinkButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(card.content, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <PlatformIcon url={card.content} className={ss.sourceLinkIcon} />
                      <span className={ss.sourceLinkText}>{getDomainDisplay(card.content) || 'Link'}</span>
                    </a>
                  </div>
                )}

                <div className={ss.titleRow}>
                  <div className={ss.titleInfo}>
                    <div className={ss.titleWrapper}>
                      {card.visibility === 'private' && (
                        <FontAwesomeIcon
                          icon={faLock}
                          className={ss.privacyIcon}
                        />
                      )}
                      <h3 className={ss.title}>{card.title}</h3>
                      <div className={ss.iconWrapper}>
                        <div
                          className={ss.typeIcon}
                          onMouseMove={(e) => handleIconMouseMove(e, card.dataType)}
                          onMouseEnter={(e) => handleIconMouseEnter(e, card.dataType)}
                          onMouseLeave={handleIconMouseLeave}
                        >
                          <FontAwesomeIcon
                            icon={card.dataType === 'collection' ? faLayerGroup : faArrowUpRightFromSquare}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={ss.actionButtonsWrapper}>
                    {/* Only show action button on mobile */}
                    {isMobile && (
                      <button
                        className={ss.actionButton}
                        onClick={(e) => toggleActionMenu(e, card._id)}
                      >
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </button>
                    )}

                    <button
                      className={ss.settingsButton}
                      onClick={(e) => isMobile ? toggleMobileMenu(e, card._id) : handleSettingsClick(e, card._id)}
                    >
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>

                <div className={ss.authorInfo} onClick={() => navigate(`/@${card.poster.userName}`)}>
                  <img
                    src={card.poster.avatar ? getAvatarImage(card.poster.avatar) : defaultProfileImage}
                    alt={card.poster.userName}
                    className={ss.authorAvatar}
                    loading="lazy"
                  />
                  <span className={ss.authorName}>@ {card.poster.userName}</span>
                </div>

                {card.description && (
                  <p className={ss.description}>{card.description}</p>
                )}

                <div className={ss.cardMeta}>
                  <div className={ss.metaContent}>
                    <span className={ss.itemType}>{getContentType(card)}</span>
                    <div className={ss.metaButtons}>
                      <button
                        className={`
                          ${ss.likeButton} 
                          ${likedCards.has(card._id) ? ss.liked : ''}
                        `}
                        onClick={(e) => handleLike(card._id, e, card.likes.length)}
                      >
                        <svg
                          className={ss.likeIcon}
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                               C13.09 3.81 14.76 3 16.5 3 
                               19.58 3 22 5.42 22 8.5
                               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="currentColor"
                          />
                        </svg>
                        {(
                          cardLikes[card._id] !== undefined
                            ? cardLikes[card._id]
                            : card.likes.length
                        ).toLocaleString()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
      </Masonry>

      {/* 확장 기능 (드롭존) */}
      <HyperExtensions
        isVisible={showExtensions}
        onDrop={handleExtensionsDrop}
        onClose={() => setShowExtensions(false)}
      />

      {/* 길게 누름 시 타이머 UI (원형 애니메이션 등) */}
      {showTimer && (
        <div
          className={ss.dragTimer}
          style={{
            left: `${cursorPosition.current.x + 20}px`,
            top: `${cursorPosition.current.y + 20}px`
          }}
        />
      )}

      {/* 아이콘 Tooltip */}
      {showTooltip && (
        <div
          className={ss.tooltip}
          style={{
            left: `${tooltipPosition.x + 15}px`,
            top: `${tooltipPosition.y + 15}px`
          }}
        >
          {tooltipContent}
        </div>
      )}

      <NotificationStack
        notifications={notifications}
        onClose={handleNotificationClose}
      />

      {/* 카드 상세 모달 */}
      {showCardDetailModal && selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setShowCardDetailModal(false)}
          isOpen={showCardDetailModal}
          currentUser={currentUser}
        />
      )}

      {/* 컬렉션 선택 모달 */}
      <CollectionSelector
        isOpen={showCollectionSelector}
        onClose={() => setShowCollectionSelector(false)}
        onSelect={handleCollectionSelect}
        currentUser={currentUser}
      />

      <DeleteWarning
        isOpen={showDeleteWarning}
        onClose={() => {
          setShowDeleteWarning(false);
          setCardToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={cardToDelete?.title || 'this item'}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={showSettings !== null}
        position={menuPosition}
        onClose={() => setShowSettings(null)}
        onAction={handleSettingsAction}
        card={cards.find(card => card._id === showSettings)}
        currentUserId={currentUserId}
      />

      {/* Action Menu - Only render if mobile */}
      {isMobile && (
        <ActionMenu
          isOpen={showActionMenu !== null}
          position={actionMenuPosition}
          onClose={() => setShowActionMenu(null)}
          onAction={handleActionMenuClick}
          card={cards.find(card => card._id === showActionMenu)}
        />
      )}
    </>
  );
};

// 하나의 방식으로만 export 합니다
export default function Hyperium({ cards, currentUser, containerWidth, onCardClick }) {
  return (
    <div className={ss.hyperiumContainer}>
      <MasonryGrid
        cards={cards}
        currentUser={currentUser}
        containerWidth={containerWidth}
        onCardClick={onCardClick}
      />
    </div>
  );
}