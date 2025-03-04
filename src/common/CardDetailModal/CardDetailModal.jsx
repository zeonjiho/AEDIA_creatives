import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane, faLink, faThumbtack,
  faChevronLeft, faComment, faImages,
  faEllipsisVertical, faFlag, faTrash, faShare,
  faGlobe, faCode, faPlus
} from '@fortawesome/free-solid-svg-icons';
import PlatformIcon, { supportedPlatforms } from '../SupportedPlatforms/PlatformIcons';
import ss from './CardDetailModal.module.css';
import Masonry from 'react-masonry-css';
import getAvatarImage from '../../util/getAvatarImage';
import getThumbnailImage from '../../util/getThumbnailImage';
import CodeEditor from '../Components/CodeEditor/CodeEditor';
import Hyperium from '../Hyperium/Hyperium';
import defaultProfileImage from '../../Assets/default-profile.svg';
import VideoPlayer from '../Components/VideoPlayer';

// 추후 전역으로 관리
const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
  <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="75" r="75" fill="#2C2C2C"/>
      <circle cx="75" cy="55" r="25" fill="#525252"/>
      <circle cx="75" cy="135" r="45" fill="#525252"/>
  </svg>
`)}`;

const CardDetailModal = ({ card, onClose, isOpen }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savedCards, setSavedCards] = useState(new Set());
  const [likedCards, setLikedCards] = useState(new Set());
  const [cardLikes, setCardLikes] = useState({});
  const [isLikeProcessing, setIsLikeProcessing] = useState({});
  const [showSettings, setShowSettings] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('comments');
  const [pathHistory, setPathHistory] = useState([card]);
  const [selectedCard, setSelectedCard] = useState(card);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPositions, setScrollPositions] = useState({});

  const infoSectionRef = useRef(null);
  const commentsListRef = useRef(null);
  const similarContentRef = useRef(null);
  const modalRef = useRef(null);

  // 브레드크럼 ref 추가
  const breadcrumbRef = useRef(null);

  const [similarItems, setSimilarItems] = useState([
    {
      id: 'similar1',
      title: '유사한 콘텐츠 1',
      description: '이것은 유사한 콘텐츠 1에 대한 설명입니다.',
      img: 'https://picsum.photos/id/1/800/600',
      author: {
        name: '사용자1',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      tags: ['디자인', 'UI', 'UX'],
      type: 'image',
      content: 'https://example.com/1'
    },
    {
      id: 'similar2',
      title: '유사한 콘텐츠 2',
      description: '이것은 유사한 콘텐츠 2에 대한 설명입니다.',
      img: 'https://picsum.photos/id/2/800/600',
      author: {
        name: '사용자2',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      tags: ['코딩', '개발', 'JavaScript'],
      type: 'image',
      content: 'https://example.com/2'
    },
    {
      id: 'similar3',
      title: '유사한 콘텐츠 3',
      description: '이것은 유사한 콘텐츠 3에 대한 설명입니다.',
      img: 'https://picsum.photos/id/3/800/600',
      author: {
        name: '사용자3',
        avatar: 'https://i.pravatar.cc/150?img=3'
      },
      tags: ['사진', '풍경', '자연'],
      type: 'image',
      content: 'https://example.com/3'
    },
    {
      id: 'similar4',
      title: '유사한 콘텐츠 4',
      description: '이것은 유사한 콘텐츠 4에 대한 설명입니다.',
      img: 'https://picsum.photos/id/4/800/600',
      author: {
        name: '사용자4',
        avatar: 'https://i.pravatar.cc/150?img=4'
      },
      tags: ['비즈니스', '마케팅', '전략'],
      type: 'image',
      content: 'https://example.com/4'
    },
    {
      id: 'similar5',
      title: '유사한 콘텐츠 5',
      description: '이것은 유사한 콘텐츠 5에 대한 설명입니다.',
      img: 'https://picsum.photos/id/5/800/600',
      author: {
        name: '사용자5',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      tags: ['음악', '아트', '창작'],
      type: 'image',
      content: 'https://example.com/5'
    },
    {
      id: 'similar6',
      title: '유사한 콘텐츠 6',
      description: '이것은 유사한 콘텐츠 6에 대한 설명입니다.',
      img: 'https://picsum.photos/id/6/800/600',
      author: {
        name: '사용자6',
        avatar: 'https://i.pravatar.cc/150?img=6'
      },
      tags: ['여행', '모험', '경험'],
      type: 'image',
      content: 'https://example.com/6'
    },
    {
      id: 'similar7',
      title: '유사한 콘텐츠 7',
      description: '이것은 유사한 콘텐츠 7에 대한 설명입니다.',
      img: 'https://picsum.photos/id/7/800/600',
      author: {
        name: '사용자7',
        avatar: 'https://i.pravatar.cc/150?img=7'
      },
      tags: ['영화', '드라마', '연기'],
      type: 'image',
      content: 'https://example.com/7'
    },
    {
      id: 'similar8',
      title: '유사한 콘텐츠 8',
      description: '이것은 유사한 콘텐츠 8에 대한 설명입니다.',
      img: 'https://picsum.photos/id/8/800/600',
      author: {
        name: '사용자8',
        avatar: 'https://i.pravatar.cc/150?img=8'
      },
      tags: ['음악', '아트', '창작'],
      type: 'image',
      content: 'https://example.com/8'
    },
    {
      id: 'similar9',
      title: '유사한 콘텐츠 9',
      description: '이것은 유사한 콘텐츠 9에 대한 설명입니다.',
      img: 'https://picsum.photos/id/9/800/600',
      author: {
        name: '사용자9',
        avatar: 'https://i.pravatar.cc/150?img=9'
      },
      tags: ['영화', '드라마', '연기'],
      type: 'image',
      content: 'https://example.com/9'
    }

  ]);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 스크롤 위치 상태 초기화
    setScrollPositions({
      infoSection: 0,
      commentsList: 0,
      similarContent: 0
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 모달이 DOM에 마운트된 직후에 visible 클래스 추가
      requestAnimationFrame(() => {
        setIsVisible(true);

        // 저장된 스크롤 위치 복원
        setTimeout(() => {
          if (infoSectionRef.current && scrollPositions.infoSection) {
            infoSectionRef.current.scrollTop = scrollPositions.infoSection;
          }
          if (commentsListRef.current && scrollPositions.commentsList) {
            commentsListRef.current.scrollTop = scrollPositions.commentsList;
          }
          if (similarContentRef.current && scrollPositions.similarContent) {
            similarContentRef.current.scrollTop = scrollPositions.similarContent;
          }
        }, 100); // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤 위치 복원
      });
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 설정 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // 설정 메뉴가 열려있으면 닫기
        if (showSettings) {
          setShowSettings(false);
        } else {
          // 모달 외부 클릭 시 애니메이션과 함께 모달 닫기
          setIsVisible(false);
          setTimeout(() => {
            handleClose();
          }, 300); // 애니메이션 지속 시간에 맞춰 조정
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // 키보드 단축키 처리 함수 추가
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();

        // 브레드크럼에 이전 항목이 있는지 확인
        if (pathHistory.length > 1) {
          // 이전 항목으로 이동
          const newPathHistory = [...pathHistory];
          newPathHistory.pop(); // 현재 항목 제거
          const previousCard = newPathHistory[newPathHistory.length - 1];

          setPathHistory(newPathHistory);
          setSelectedCard(previousCard);

          // 애니메이션 효과를 위해 상태 업데이트
          setIsVisible(true);
        } else {
          // 이전 항목이 없을 때 애니메이션과 함께 모달 닫기
          setIsVisible(false);
          setTimeout(() => {
            handleClose();
          }, 300); // 애니메이션 지속 시간에 맞춰 조정
        }
      } else if (e.key === 'Tab') {
        // 기존 탭키 단축키 유지
        e.preventDefault();

        const tabs = ['comments', 'similar'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeTab, pathHistory]);

  const handleClose = useCallback(() => {
    // 모달을 닫기 전에 스크롤 위치 저장
    const newScrollPositions = { ...scrollPositions };

    if (activeTab === 'comments') {
      if (infoSectionRef.current) {
        newScrollPositions.infoSection = infoSectionRef.current.scrollTop;
      }
      if (commentsListRef.current) {
        newScrollPositions.commentsList = commentsListRef.current.scrollTop;
      }
    } else if (activeTab === 'similar' && similarContentRef.current) {
      newScrollPositions.similarContent = similarContentRef.current.scrollTop;
    }

    setScrollPositions(newScrollPositions);
    onClose();
  }, [activeTab, scrollPositions, onClose]);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    // 댓글 추가 로직
    const newComment = {
      id: Date.now(),
      text: comment,
      author: {
        name: "You",
        avatar: "https://via.placeholder.com/32",
      },
      replies: []
    };

    setComments([...comments, newComment]);
    setComment('');

    // 댓글 추가 후 스크롤 자동 이동
    setTimeout(() => {
      const commentsList = document.querySelector(`.${ss.commentsList}`);
      if (commentsList) {
        commentsList.scrollTop = commentsList.scrollHeight;
      }
    }, 100);
  };

  const handleReplyToggle = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');

    // 입력 필드에 포커스를 주기 위해 setTimeout 사용
    setTimeout(() => {
      const replyInput = document.querySelector(`.${ss.replyInput}`);
      if (replyInput) {
        replyInput.focus();
      }
    }, 0);
  };

  const handleReplySubmit = (commentId) => {
    if (!replyText.trim()) return;

    // 답글 추가 로직
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newReply = {
          id: Date.now(),
          text: replyText,
          author: {
            name: "You",
            avatar: "https://via.placeholder.com/32"
          }
        };

        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    });

    setComments(updatedComments);
    setReplyText('');
    setReplyingTo(null);

    // 답글 추가 후 스크롤 자동 이동
    setTimeout(() => {
      const repliesList = document.querySelector(`.${ss.repliesList}`);
      if (repliesList) {
        repliesList.scrollTop = repliesList.scrollHeight;
      }
    }, 100);
  };

  const handleAction = (type) => (e) => {
    e.stopPropagation();
    switch (type) {
      case 'save':
        setSavedCards(prev => {
          const newSaved = new Set(prev);
          newSaved.has(selectedCard.id) ? newSaved.delete(selectedCard.id) : newSaved.add(selectedCard.id);
          return newSaved;
        });
        break;
      case 'like':
        handleLike(selectedCard.id, e);
        break;
      case 'collection':
        // 콜렉션 추가 로직 구현
        console.log('Add to collection:', selectedCard.id);
        // 여기에 콜렉션 선택 모달을 표시하는 로직을 추가할 수 있습니다.
        // 예: setShowCollectionModal(true);
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: selectedCard.title,
            url: `${window.location.origin}/artwork/${selectedCard.id}`
          });
        } else {
          console.log('Web Share API not supported');
        }
        break;
      case 'copy':
        const url = `${window.location.origin}/artwork/${selectedCard.id}`;
        navigator.clipboard.writeText(url);
        break;
      default:
        break;
    }
  };

  const handleLike = (cardId, e) => {
    // 이미 처리 중이면 무시
    if (isLikeProcessing[cardId]) {
      return;
    }

    try {
      // 처리 시작 표시
      setIsLikeProcessing(prev => ({ ...prev, [cardId]: true }));

      // 좋아요 상태 토글
      setLikedCards(prev => {
        const newLikedCards = new Set(prev);
        if (newLikedCards.has(cardId)) {
          newLikedCards.delete(cardId);
        } else {
          newLikedCards.add(cardId);
        }
        return newLikedCards;
      });

      // 좋아요 수 업데이트
      setCardLikes(prev => {
        const currentLikes = prev[cardId] || 0;
        const isLiked = likedCards.has(cardId);
        return {
          ...prev,
          [cardId]: isLiked ? currentLikes - 1 : currentLikes + 1
        };
      });

      // 실제 API 호출은 여기에 추가 (백엔드 연동 시)
      // const response = await api.post('/toggle-like', { hyperlinkId: cardId });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      // 처리 완료 표시
      setTimeout(() => {
        setIsLikeProcessing(prev => ({ ...prev, [cardId]: false }));
      }, 200); // 200ms 딜레이로 연속 클릭 방지
    }
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // 현재 메뉴가 열려있다면 닫기
    if (showSettings === selectedCard.id) {
      setShowSettings(null);
      return;
    }

    // 버튼의 위치 정보 저장
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.right,
      y: rect.top
    });

    setShowSettings(selectedCard.id);
  };

  const handleSettingsAction = (e, action) => {
    e.stopPropagation();
    setShowSettings(null);

    switch (action) {
      case 'delete':
        // 삭제 로직 구현
        console.log('Delete card:', selectedCard.id);
        break;
      case 'report':
        // 신고 로직 구현
        console.log('Report card:', selectedCard.id);
        break;
      default:
        break;
    }
  };

  const handleSimilarItemClick = (item) => {
    // 새로운 카드로 이동할 때 경로 히스토리에 추가
    setPathHistory(prev => [...prev, item]);

    // 카드 데이터 형식 변환 (Hyperium 카드 형식 -> 모달 카드 형식)
    const formattedCard = {
      id: item.id,
      title: item.title,
      description: item.description,
      img: item.img,
      poster: {
        userName: item?.author?.name || '사용자',
        avatar: item?.author?.avatar || ''
      },
      tags: item.tags || [],
      type: item.type || 'image',
      content: item.content || ''
    };

    // 선택된 카드 정보 업데이트 (한 번만 호출)
    setSelectedCard(formattedCard);

    // Comments 탭으로 전환
    setActiveTab('comments');

    // 스크롤 위치 초기화
    requestAnimationFrame(() => {
      if (infoSectionRef.current) {
        infoSectionRef.current.scrollTop = 0;
      }
      if (commentsListRef.current) {
        commentsListRef.current.scrollTop = 0;
      }
    });
  };

  const handleBreadcrumbClick = (index) => {
    // 경로의 특정 지점으로 이동
    if (index < pathHistory.length - 1) {
      setPathHistory(prev => prev.slice(0, index + 1));
      setSelectedCard(pathHistory[index]);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);

    // 첫 글자가 입력되었을 때만 댓글 탭으로 전환
    if (value.length === 1) {
      setActiveTab('comments');
    }
  };

  // 디바운스 함수
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  };

  // 디바운스된 스크롤 위치 저장 함수
  const debouncedSaveScrollPositions = useCallback(
    debounce(() => {
      const newScrollPositions = { ...scrollPositions };

      if (infoSectionRef.current) {
        newScrollPositions.infoSection = infoSectionRef.current.scrollTop;
      }
      if (commentsListRef.current) {
        newScrollPositions.commentsList = commentsListRef.current.scrollTop;
      }
      if (similarContentRef.current) {
        newScrollPositions.similarContent = similarContentRef.current.scrollTop;
      }

      setScrollPositions(newScrollPositions);
    }, 100),
    []
  );

  // 스크롤 위치 저장 함수
  const saveScrollPositions = () => {
    if (activeTab === 'comments') {
      setScrollPositions(prev => ({ ...prev, comments: infoSectionRef.current?.scrollTop || 0 }));
    } else if (activeTab === 'similar') {
      setScrollPositions(prev => ({ ...prev, similar: similarContentRef.current?.scrollTop || 0 }));
    }
  };

  const renderMediaSection = () => (
    <section className={ss.mediaSection}>
      {selectedCard.contentType === 'code' && (
        <div className={ss.codePreview}>
          <div className={ss.codePreviewHeader}>
            <span className={ss.codeLanguage}>
              {selectedCard.codeLanguage || 'Text'}
            </span>
            <span className={ss.codeLineCount}>
              {selectedCard.content?.split('\n').length || 0} lines
            </span>
          </div>
          <div className={ss.codeEditorContainer}>
            <CodeEditor
              code={selectedCard.content || ''}
              language={selectedCard.codeLanguage || 'text'}
              readOnly={true}
              showLineNumbers={true}
              theme="dark"
              fontSize="16px"
            />
          </div>
        </div>
      )}
      {selectedCard.contentType === 'image' && (
        <img
          src={getThumbnailImage(selectedCard.thumbnail)}
          alt={selectedCard.title}
          className={ss.mainImage}
        />
      )}
      {selectedCard.contentType === 'video' && (() => {
        let videoType = '';
        let videoId = '';
        let videoUrl = selectedCard?.content.trim();
        let isShorts = false;

        // YouTube URL 인식
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          videoType = 'youtube';

          // YouTube URL에서 videoId 추출
          if (videoUrl.includes('youtube.com/watch')) {
            const urlObj = new URL(videoUrl);
            videoId = urlObj.searchParams.get('v');
          } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
          }
          // YouTube Shorts URL 인식 추가
          else if (videoUrl.includes('youtube.com/shorts/')) {
            // 형식: youtube.com/shorts/VIDEO_ID
            const shortsRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/;
            const match = videoUrl.match(shortsRegex);

            if (match && match[1]) {
              videoId = match[1];
              isShorts = true;
            }
          }

          if (!videoId) {
            return;
          }
        }
        // TikTok URL 인식 추가
        else if (videoUrl.includes('tiktok.com')) {
          videoType = 'tiktok';

          // TikTok URL에서 videoId 추출
          // 형식: https://www.tiktok.com/@username/video/1234567890123456789
          // 또는: https://vm.tiktok.com/XXXXXXXX/
          const tiktokRegex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
          const tiktokShortRegex = /vm\.tiktok\.com\/([A-Za-z0-9]+)/;

          let match = videoUrl.match(tiktokRegex);
          let shortMatch = videoUrl.match(tiktokShortRegex);

          if (match && match[1]) {
            videoId = match[1];
          } else if (shortMatch && shortMatch[1]) {
            videoId = shortMatch[1]; // 짧은 URL 형식
          } else {
            return;
          }
        }
        // Vimeo URL 인식
        else if (videoUrl.includes('vimeo.com')) {
          videoType = 'vimeo';

          // Vimeo URL에서 videoId 추출
          const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
          const match = videoUrl.match(vimeoRegex);

          if (match && match[1]) {
            videoId = match[1];
          } else {
            return;
          }
        }
        // Bilibili URL 인식 (추가)
        else if (videoUrl.includes('bilibili.com')) {
          videoType = 'bilibili';

          // Bilibili URL에서 videoId 추출
          // BV 형식: https://www.bilibili.com/video/BV1xx411c7mD
          // AV 형식: https://www.bilibili.com/video/av170001
          const bvRegex = /bilibili\.com\/video\/(BV\w+)/;
          const avRegex = /bilibili\.com\/video\/av(\d+)/;

          let bvMatch = videoUrl.match(bvRegex);
          let avMatch = videoUrl.match(avRegex);

          if (bvMatch && bvMatch[1]) {
            videoId = bvMatch[1];
          } else if (avMatch && avMatch[1]) {
            videoId = 'av' + avMatch[1];
          } else {
            return;
          }
        }
        // 로컬 비디오 URL 인식
        else if (videoUrl.startsWith('http') || videoUrl.startsWith('blob:')) {
          videoType = 'local';
          videoId = '';
        } else {
          return;
        }

        // 비디오 데이터 설정
        const newVideoData = {
          type: videoType,
          videoId: videoId,
          url: videoType === 'local' ? videoUrl : '',
          isShorts: isShorts,
          originalUrl: videoUrl // 원본 URL 저장
        };

        return <VideoPlayer videoData={newVideoData} />;
      })()}
    </section>
  );

  // 브레드크럼 오버플로우 체크 useEffect 추가
  useEffect(() => {
    const checkOverflow = () => {
      if (breadcrumbRef.current) {
        // 브레드크럼 요소의 너비를 확인
        const containerWidth = breadcrumbRef.current.parentElement.clientWidth - 100; // 닫기 버튼 공간 고려

        // 모든 브레드크럼 아이템의 총 너비 계산
        let totalWidth = 0;
        const items = breadcrumbRef.current.querySelectorAll(`.${ss.breadcrumbItem}, .${ss.breadcrumbSeparator}`);

        items.forEach(item => {
          totalWidth += item.offsetWidth;
        });

        // 총 너비가 컨테이너 너비보다 크면 오버플로우 클래스 추가
        if (totalWidth > containerWidth) {
          breadcrumbRef.current.classList.add(ss.overflow);
        } else {
          breadcrumbRef.current.classList.remove(ss.overflow);
        }
      }
    };

    // 초기 로드 시 확인
    setTimeout(checkOverflow, 100); // DOM이 완전히 렌더링된 후 체크

    // 윈도우 크기 변경 시 확인
    window.addEventListener('resize', checkOverflow);

    // pathHistory가 변경될 때마다 확인
    if (breadcrumbRef.current) {
      setTimeout(checkOverflow, 100); // DOM 업데이트 후 체크
    }

    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [pathHistory]);

  const renderBreadcrumb = () => {
    return (
      <div className={ss.breadcrumb} ref={breadcrumbRef}>
        {pathHistory.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className={ss.breadcrumbSeparator}>/</span>}
            <span
              className={`${ss.breadcrumbItem} ${index === pathHistory.length - 1 ? ss.breadcrumbCurrent : ''}`}
              onClick={() => handleBreadcrumbClick(index)}
            >
              {item.title}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // 탭 변경 시 스크롤 위치 저장
  const handleTabChange = (tab) => {
    if (tab === activeTab) return; // 같은 탭을 클릭한 경우 무시

    // 현재 탭의 스크롤 위치 저장
    const newScrollPositions = { ...scrollPositions };

    if (activeTab === 'comments') {
      if (infoSectionRef.current) {
        newScrollPositions.infoSection = infoSectionRef.current.scrollTop;
      }
      if (commentsListRef.current) {
        newScrollPositions.commentsList = commentsListRef.current.scrollTop;
      }
    } else if (activeTab === 'similar' && similarContentRef.current) {
      newScrollPositions.similarContent = similarContentRef.current.scrollTop;
    }

    // 상태 업데이트
    setScrollPositions(newScrollPositions);
    setActiveTab(tab);

    // 탭 변경 후 저장된 스크롤 위치 복원
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (tab === 'comments') {
          if (infoSectionRef.current) {
            infoSectionRef.current.scrollTop = newScrollPositions.infoSection || 0;
          }
          if (commentsListRef.current) {
            commentsListRef.current.scrollTop = newScrollPositions.commentsList || 0;
          }
        } else if (tab === 'similar' && similarContentRef.current) {
          similarContentRef.current.scrollTop = newScrollPositions.similarContent || 0;
        }
      }, 50);
    });
  };

  // URL 유효성 검사 함수
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

      // TLD(최상위 도메인)을 제외한 마지막 부분 사용
      // 예: beta.hyper.bz -> hyper
      //     sub.example.com -> example
      const mainDomain = parts[parts.length - 2] || parts[0];

      // 첫 글자 대문자로 변환
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      className={`${ss.overlay} ${isVisible ? ss.overlayVisible : ''}`}
      onClick={handleClose}
      ref={modalRef}
    >
      <div className={`${ss.modal} ${isVisible ? ss.modalVisible : ''}`} onClick={e => e.stopPropagation()}>
        <div className={ss.tabContainer}>
          <button
            className={`${ss.topTabButton} ${activeTab === 'comments' ? ss.active : ''}`}
            onClick={() => handleTabChange('comments')}
            title="댓글 탭 (Tab 키로 전환)"
          >
            <FontAwesomeIcon icon={faComment} style={{ marginRight: '8px' }} />
            Comments
          </button>
          <button
            className={`${ss.topTabButton} ${activeTab === 'similar' ? ss.active : ''}`}
            onClick={() => handleTabChange('similar')}
            title="유사 콘텐츠 탭 (Tab 키로 전환)"
          >
            <FontAwesomeIcon icon={faImages} style={{ marginRight: '8px' }} />
            Similar
          </button>
        </div>

        <div className={ss.modalHeader}>
          <div className={ss.breadcrumbContainer}>
            <button className={ss.closeButton} onClick={handleClose}>
              <FontAwesomeIcon icon={faChevronLeft} />
              Back
            </button>

            {renderBreadcrumb()}
          </div>
        </div>

        <main className={ss.content}>
          {activeTab === 'similar' ? (
            <div
              className={ss.similarContent}
              ref={similarContentRef}
              onScroll={saveScrollPositions}
            >
              <Hyperium
                cards={similarItems.map(item => {
                  // 임의의 좋아요 수 생성
                  const likesCount = Math.floor(Math.random() * 100);
                  // 좋아요 배열 생성 (빈 객체를 likesCount 개수만큼 포함하는 배열)
                  const likesArray = Array(likesCount).fill({});
                  // 임의의 댓글 수 생성
                  const commentsCount = Math.floor(Math.random() * 20);
                  // 임의의 저장 수 생성
                  const savesCount = Math.floor(Math.random() * 50);

                  return {
                    id: item.id,
                    _id: item.id,
                    title: item.title,
                    description: item.description,
                    thumbnail: item.img,
                    poster: {
                      userName: item.author.name,
                      avatar: item.author.avatar,
                      id: `user-${Math.floor(Math.random() * 1000)}`
                    },
                    tags: item.tags,
                    type: item.type || 'image',
                    content: item.content || '',
                    img: item.img,
                    likes: likesArray,
                    comments: commentsCount,
                    saves: savesCount,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    stats: {
                      likes: likesCount,
                      comments: commentsCount,
                      saves: savesCount,
                      views: Math.floor(Math.random() * 500)
                    }
                  };
                })}
                currentUser={{
                  id: 'current-user',
                  name: '현재 사용자',
                  avatar: 'https://i.pravatar.cc/150?img=10'
                }}
                containerWidth={similarContentRef.current?.clientWidth || 800}
                onCardClick={(cardId) => {
                  // 클릭한 카드 찾기
                  const clickedCard = similarItems.find(item => item.id === cardId);
                  if (clickedCard) {
                    handleSimilarItemClick(clickedCard);
                  }
                }}
              />
            </div>
          ) : (
            <>
              {renderMediaSection()}
              <div
                className={ss.infoSection}
                ref={infoSectionRef}
                onScroll={saveScrollPositions}
              >
                <header className={ss.header}>
                  <div className={ss.authorInfo}>
                    <img
                      src={selectedCard?.poster?.avatar ? getAvatarImage(selectedCard?.poster?.avatar) : DEFAULT_PROFILE_IMAGE}
                      alt={selectedCard?.poster?.userName || '사용자'}
                      className={ss.authorAvatar}
                    />
                    <span className={ss.authorName}>{selectedCard?.poster?.userName || '사용자'}</span>
                  </div>

                  <button
                    className={ss.settingsButton}
                    onClick={handleSettingsClick}
                  >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  </button>

                  {showSettings === selectedCard.id && (
                    <div
                      className={ss.settingsMenu}
                      style={{
                        top: `${menuPosition.y}px`,
                        left: `${menuPosition.x}px`,
                        transform: 'translateX(-100%)'
                      }}
                    >
                      <button
                        className={ss.settingsMenuItem}
                        onClick={(e) => handleSettingsAction(e, 'report')}
                      >
                        <FontAwesomeIcon icon={faFlag} />
                        <span>신고하기</span>
                      </button>
                      <button
                        className={ss.settingsMenuItem}
                        onClick={(e) => handleSettingsAction(e, 'delete')}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>삭제하기</span>
                      </button>
                    </div>
                  )}
                </header>

                <div className={ss.description}>
                  <h2 className={ss.title}>{selectedCard.title}</h2>

                  {selectedCard.content && (
                    <div className={ss.sourceContainer}>
                      <div className={ss.sourceIcon}>
                        <PlatformIcon
                          url={selectedCard.content}
                          className={ss.sourceFavicon}
                        />
                      </div>
                      <div className={ss.sourceInfo}>
                        <span className={ss.sourceDomain}>
                          {getDomainDisplay(selectedCard.content)}
                        </span>
                        <a
                          href={selectedCard.content}
                          className={ss.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {selectedCard.content}
                        </a>
                      </div>
                    </div>
                  )}

                  <p className={ss.fullDescription}>{selectedCard.description}</p>
                  <div className={ss.tags}>
                    {selectedCard.tags.map((tag, i) => (
                      <span key={i} className={ss.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className={ss.actions}>
                  <button
                    onClick={(e) => handleAction('like')(e)}
                    className={`${ss.likeButton} ${likedCards.has(selectedCard.id) ? ss.liked : ''}`}
                    disabled={isLikeProcessing[selectedCard.id]}
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
                    <span className={ss.actionCount}>
                      {cardLikes[selectedCard.id] || 0}
                    </span>
                  </button>

                  <button
                    onClick={(e) => handleAction('collection')(e)}
                    className={ss.actionButton}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span className={ss.actionTooltip}>add to collection</span>
                  </button>

                  <button
                    onClick={(e) => handleAction('share')(e)}
                    className={ss.actionButton}
                  >
                    <FontAwesomeIcon icon={faShare} />
                    <span className={ss.actionTooltip}>share</span>
                  </button>

                  <button
                    onClick={(e) => handleAction('copy')(e)}
                    className={ss.actionButton}
                  >
                    <FontAwesomeIcon icon={faLink} />
                    <span className={ss.actionTooltip}>copy link</span>
                  </button>

                  <button
                    onClick={(e) => handleAction('save')(e)}
                    className={`${ss.actionButton} ${savedCards.has(selectedCard.id) ? ss.saved : ''}`}
                  >
                    <FontAwesomeIcon icon={faThumbtack} />
                    <span className={ss.actionTooltip}>save</span>
                  </button>
                </div>

                <div
                  className={ss.commentsList}
                  ref={commentsListRef}
                  onScroll={saveScrollPositions}
                >
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className={ss.commentItem}>
                        <div className={ss.commentHeader}>
                          <div className={ss.commentUserInfo}>
                            <img
                              src={getAvatarImage(comment.author.avatar) || defaultProfileImage}
                              alt="Profile"
                              className={ss.commentAvatar}
                            />
                            <span className={ss.commentAuthor}>{comment.author.name}</span>
                          </div>
                        </div>
                        <p className={ss.commentText}>{comment.text}</p>

                        <div className={ss.commentActions}>
                          <button
                            className={ss.replyButton}
                            onClick={() => handleReplyToggle(comment.id)}
                          >
                            Reply
                          </button>
                        </div>

                        {replyingTo === comment.id && (
                          <div className={ss.replyForm}>
                            <input
                              type="text"
                              className={ss.replyInput}
                              autoFocus
                              placeholder="place to reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button
                              className={ss.replySubmitButton}
                              onClick={() => handleReplySubmit(comment.id)}
                            >
                              reply
                            </button>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className={ss.repliesList}>
                            {comment.replies.map(reply => (
                              <div key={reply.id} className={ss.replyItem}>
                                <div className={ss.replyHeader}>
                                  <div className={ss.replyUserInfo}>
                                    <img
                                      src={getAvatarImage(reply.author.avatar) || defaultProfileImage}
                                      alt="Profile"
                                      className={ss.replyAvatar}
                                    />
                                    <span className={ss.replyAuthor}>{reply.author.name}</span>
                                  </div>
                                </div>
                                <p className={ss.replyText}>{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={ss.emptyComments}>
                      <p>No comments yet. Add a comment!</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitComment} className={ss.commentForm}>
                  <input
                    type="text"
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    className={ss.commentInput}
                  />
                  <button type="submit" className={ss.submitButton}>Submit</button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CardDetailModal; 