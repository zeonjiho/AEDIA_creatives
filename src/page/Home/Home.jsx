import React, { useState, useEffect, useRef } from 'react'
import Hyperium from '../../common/Hyperium/Hyperium'
import ss from './Home.module.css'
import img1 from '../../img/image1.jpg'
import img2 from '../../img/image2.jpg'
import img3 from '../../img/image3.jpg'
import img4 from '../../img/image4.jpg'
import img5 from '../../img/image5.jpg'
import img6 from '../../img/image6.jpg'
import img7 from '../../img/image7.jpg'
import img8 from '../../img/image8.jpeg'
import img9 from '../../img/image9.jpg'
import img10 from '../../img/image10.jpg'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeart,
  faChartSimple,
  faCircleInfo,
  faMagnifyingGlass,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons'
import { jwtDecode } from 'jwt-decode'
import api from '../../util/api'
import PlatformIcon from '../../common/SupportedPlatforms/PlatformIcons'
import SupportedPlatformsModal from '../../common/SupportedPlatforms/SupportedPlatformsModal/SupportedPlatformsModal'
import { supportedPlatforms } from '../../common/SupportedPlatforms/PlatformIcons'

const welcomeMessages = [
  {
    text: "Discover and explore the infinite possibilities of creativity.\nCreate your own collections, craft new realities, and let your imagination run wild."
  },
  {
    text: "Welcome to a world where creativity knows no bounds.\nShare your vision, inspire others, and be part of something extraordinary."
  },
  {
    text: "Every pixel tells a story, every creation matters.\nExplore, create, and connect with creators from around the world."
  },
  {
    text: "Your imagination is the only limit.\nBuild your collections, share your perspective, and leave your mark."
  },
  {
    text: "Where ideas come to life and creativity flows freely.\nJoin our community of creators and make something amazing."
  }
];

const Home = () => {
  const [loadedImages, setLoadedImages] = useState([])
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLongHover, setIsLongHover] = useState(false);
  const [blurredCard, setBlurredCard] = useState(null);
  const hoverTimerRef = useRef(null);
  const [likedCards, setLikedCards] = useState(new Set());
  const [cards, setCards] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    username: '',
    fullname: ''
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const navigate = useNavigate();
  const [cardsData, setCardsData] = useState([]);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [visiblePlatforms, setVisiblePlatforms] = useState(8);

  // Use a fallback object ({}), so it won't crash if undefined.
  const {
    isPasteModalOpen = false,
    isMasterHandleModalOpen = false,
    modalPosition = { x: 0, y: 0 },
    activeModalId,
    activeModalData,
    minimizedModals,
    handleCloseModal = () => {},
    handleMinimizeModal = () => {},
    handleMaximizeModal = () => {},
    handleCloseMasterHandleModal = () => {},
    handleOpenPaste = () => {}
  } = useOutletContext() ?? {};

  const breakpointColumns = {
    default: 4,
    1024: 3,
    768: 2,
    500: 2
  }

  const generateRandomLikes = () => {
    // 0.7 확률로 큰 수 (1,000 ~ 1,000,000)
    // 0.3 확률로 작은 수 (1 ~ 999)
    if (Math.random() > 0.3) {
      return Math.floor(Math.random() * 999000) + 1000;  // 큰 수
    } else {
      return Math.floor(Math.random() * 998) + 1;  // 작은 수
    }
  }

  useEffect(() => {
    // 이미지 순차 로딩
    const loadImages = async () => {
      for (const card of cardsData) {
        const image = new Image()
        image.src = card.img
        await new Promise((resolve) => {
          image.onload = resolve
        })
        setLoadedImages(prev => [...prev, card.id])
      }
    }
    loadImages()
  }, [])

  useEffect(() => {
    fetchCardsData()
  }, [])

  // PasteModal에서 발생한 refreshPageData 이벤트를 감지하여 페이지 데이터 새로고침
  useEffect(() => {
    // 페이지 데이터 새로고침 이벤트 리스너
    const handleRefreshPageData = (event) => {
      console.log('Home 페이지에서 refreshPageData 이벤트 감지:', event.detail);
      // 현재 페이지가 홈 페이지인 경우에만 새로고침
      if (window.location.pathname === '/' || window.location.pathname === '/home') {
        fetchCardsData();
      }
    };

    // 전역 함수로 등록하여 다른 컴포넌트에서도 접근 가능하게 함
    window.refreshPageData = fetchCardsData;
    
    // 이벤트 리스너 등록
    window.addEventListener('refreshPageData', handleRefreshPageData);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 전역 함수 제거
    return () => {
      window.removeEventListener('refreshPageData', handleRefreshPageData);
      delete window.refreshPageData;
    };
  }, []);

  // 카드 마우스 오버 이벤트
  const handleCardMouseEnter = (cardId) => {
    setHoveredCard(cardId);
    // 기존 타이머 제거
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    // 새로운 타이머 설정
    hoverTimerRef.current = setTimeout(() => {
      setIsLongHover(true);
    }, 5000);
  };

  const handleCardMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredCard(null);
    setIsLongHover(false);
    setBlurredCard(null);
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // 정보 아이콘 클릭 핸들러 추가
  const handleInfoClick = (cardId, e) => {
    e.stopPropagation();  // 이벤트 버블링 방지
    setBlurredCard(blurredCard === cardId ? null : cardId);  // 토글 기능
  };

  // 좋아요 처리 함수
  const handleLike = (cardId, e) => {
    e.stopPropagation();
    setLikedCards(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(cardId)) {
        newLiked.delete(cardId);
      } else {
        newLiked.add(cardId);
      }
      return newLiked;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoaded(true);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await api.post('/user/validation-user-status-and-update-last-visit',
          { userId: jwtDecode(token).userId }
        );

        if (response.status === 200) {
          setCurrentUser({
            username: response.data.userName?.toLowerCase() || 'username',
            fullname: response.data.fullname?.toUpperCase() || 'Full Name'
          });
        }
      } catch (err) {
        console.log(err);
        localStorage.removeItem('token');
      } finally {
        setIsLoaded(true);
      }
    };

    fetchUserData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const isLoggedIn = localStorage.getItem('token');

    let timeGreeting;
    if (hour >= 5 && hour < 12) {
      timeGreeting = "Good Morning";
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = "Good Afternoon";
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = "Good Evening";
    } else {
      timeGreeting = "Good Night";
    }

    return isLoggedIn ? `${timeGreeting} @${currentUser.username}.` : `${timeGreeting}.`;
  };

  useEffect(() => {
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    setWelcomeMessage(randomMessage.text);
  }, []);

  const fetchCardsData = async () => {
    try {
      // 최신순으로 정렬하기 위해 sort 파라미터 추가
      const response = await api.get('/get-all-hyperlinks?from=home&sort=latest')
      if (response.status === 200) {
        setCardsData(response.data.reverse())
      }
    } catch (err) {
      console.log(err)
    }
  }

  // 툴팁 위치 계산 함수
  const calculateTooltipPosition = (event) => {
    const x = event.clientX;
    const y = event.clientY;
    
    return {
      x: x + 10, // 마우스 커서에서 약간 오른쪽으로
      y: y + 10  // 마우스 커서에서 약간 아래로
    };
  };

  // 플랫폼 아이콘 호버 핸들러
  const handlePlatformHover = (event, platformName) => {
    const position = calculateTooltipPosition(event);
    setTooltipPosition(position);
    setTooltipContent(platformName);
    setIsTooltipVisible(true);
  };

  // 플랫폼 아이콘 호버 아웃 핸들러
  const handlePlatformHoverEnd = () => {
    setIsTooltipVisible(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > 1200) setVisiblePlatforms(8);
      else if (width > 992) setVisiblePlatforms(6);
      else if (width > 768) setVisiblePlatforms(5);
      else if (width > 576) setVisiblePlatforms(4);
      else setVisiblePlatforms(3);
    };

    handleResize(); // 초기 실행
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 기존 애니메이션 효과 유지
    if (isLoaded) {
      // 플랫폼 아이콘 애니메이션 추가
      const platformIcons = document.querySelector(`.${ss.platform_icons}`);
      if (platformIcons) {
        setTimeout(() => {
          platformIcons.classList.add(ss.animate);
        }, 300); // 텍스트 애니메이션 이후에 실행
      }
    }
  }, [isLoaded]);

  return (
    <div className={ss.container}>

      <div className={`${ss.welcome_message} ${isLoaded ? ss.animate : ''}`}>
        <h1 className={ss.greeting}>{getGreeting()}</h1>
        <p className={ss.welcome_text}>
          Welcome to <span className={ss.hyper_text}>HYPER</span><span className={ss.trademark}>™</span>
        </p>
        <p className={ss.sub_text}>
          {welcomeMessage.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < welcomeMessage.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
        <div className={ss.supported_platforms}>
          <div className={ss.platform_icons}>
            {supportedPlatforms
              .slice(0, visiblePlatforms)
              .map(platform => (
                <div 
                  key={platform.key}
                  className={ss.platform_icon_wrapper}
                  onMouseMove={(e) => handlePlatformHover(e, platform.name)}
                  onMouseLeave={handlePlatformHoverEnd}
                >
                  <PlatformIcon 
                    url={`https://${platform.domains[0]}`}
                    className={ss.platform_icon}
                  />
                </div>
              ))}
            <button 
              className={ss.more_platforms_button}
              onClick={() => setShowPlatformsModal(true)}
            >
              <span>and more</span>
              <FontAwesomeIcon icon={faEllipsisH} />
            </button>
          </div>
        </div>
      </div>

      <Hyperium cards={cardsData} />

      <SupportedPlatformsModal 
        isOpen={showPlatformsModal}
        onClose={() => setShowPlatformsModal(false)}
      />

      {/* 툴팁 렌더링 */}
      {isTooltipVisible && (
        <div 
          className={`${ss.platform_tooltip} ${isTooltipVisible ? ss.visible : ''}`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  )
}

export default Home

