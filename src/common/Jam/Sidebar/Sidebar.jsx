import React, { useState, useEffect, useRef } from 'react';
import ss from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight,
  faLayerGroup,
  faHeart,
  faBoxArchive,
  faUser,
  faGripVertical,
  faSearch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import SideMenuHyperium from './SidebarHyperium/SidebarHyperium';
import HyperlinkCard from '../HyperlinkCard/HyperlinkCard';
import { jwtDecode } from 'jwt-decode';
import api from '../../../util/api';
import DraggableHyperlink from '../DraggableHyperlink/DraggableHyperlink';

const Sidebar = ({ isOpen, toggleSidebar, cards = [], currentUser }) => {
  const [activeTab, setActiveTab] = useState('collections');
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const sidebarRef = useRef(null);
  const [resizing, setResizing] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 360, height: 700 });
  const [position, setPosition] = useState({ top: 150, left: 20 });
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [gridColumns, setGridColumns] = useState(2);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const resizeTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [contentData, setContentData] = useState([]);
  const [filteredContentData, setFilteredContentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hyperlinks, setHyperlinks] = useState([]);
  const [isDraggableLoading, setIsDraggableLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef(null);
  const scrollThumbRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const filterRef = useRef(null);

  const handleCardClick = (card) => {
    // Card click handler implementation
    console.log('Card clicked:', card);
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Filter content based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContentData(contentData);
    } else {
      const filtered = contentData.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.poster?.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContentData(filtered);
    }
  }, [searchTerm, contentData]);

  // 사이드바 너비에 따라 그리드 열 수 업데이트
  useEffect(() => {
    const calculateGridColumns = () => {
      if (dimensions.width < 300) return 1;
      if (dimensions.width < 400) return 2;
      return 3;
    };
    
    setGridColumns(calculateGridColumns());
  }, [dimensions.width]);

  // 사이드바가 화면 경계를 넘어가지 않도록 위치 조정
  useEffect(() => {
    const adjustSidebarPosition = () => {
      // 현재 사이드바 위치와 크기
      const { width, height } = dimensions;
      const { top, left } = position;
      
      // 화면 경계 계산
      const maxRight = windowSize.width;
      const maxBottom = windowSize.height;
      
      let newTop = top;
      let newLeft = left;
      
      // 오른쪽 경계 체크
      if (left + width > maxRight) {
        newLeft = Math.max(0, maxRight - width);
      }
      
      // 하단 경계 체크
      if (top + height > maxBottom) {
        newTop = Math.max(0, maxBottom - height);
      }
      
      // 왼쪽 경계 체크
      if (left < 0) {
        newLeft = 0;
      }
      
      // 상단 경계 체크
      if (top < 0) {
        newTop = 0;
      }
      
      // 위치가 변경되었다면 업데이트
      if (newTop !== top || newLeft !== left) {
        setPosition({ top: newTop, left: newLeft });
      }
    };
    
    adjustSidebarPosition();
  }, [dimensions, position, windowSize]);

  // 윈도우 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // 기존 클린업 코드 유지
      setMounted(false);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 커스텀 스크롤바 업데이트
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && scrollThumbRef.current && scrollTrackRef.current) {
        updateScrollThumbPosition();
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // 초기 스크롤 정보 설정
      handleScroll();
      
      // 윈도우 리사이즈 이벤트 처리
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
    };
  }, [filteredContentData]);

  // 스크롤바 드래그 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingThumb && scrollContainerRef.current && scrollThumbRef.current && scrollTrackRef.current) {
        e.preventDefault();
        const trackHeight = scrollTrackRef.current.clientHeight;
        const thumbHeight = scrollThumbRef.current.clientHeight;
        const scrollContainer = scrollContainerRef.current;
        const { scrollHeight, clientHeight } = scrollContainer;
        
        // 마우스 이동 거리 계산
        const deltaY = e.clientY - startY;
        const maxScrollTop = scrollHeight - clientHeight;
        
        // 스크롤 위치 계산 (트랙 내에서의 비율)
        const ratio = deltaY / (trackHeight - thumbHeight);
        const newScrollTop = Math.max(0, Math.min(maxScrollTop, startScrollTop + ratio * maxScrollTop));
        
        // 스크롤 위치 설정
        scrollContainer.scrollTop = newScrollTop;
      }
    };

    const handleMouseUp = () => {
      setIsDraggingThumb(false);
    };

    if (isDraggingThumb) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingThumb, startY, startScrollTop]);

  // 스크롤바 썸 위치 업데이트 함수
  const updateScrollThumbPosition = () => {
    if (scrollContainerRef.current && scrollThumbRef.current && scrollTrackRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const trackHeight = scrollTrackRef.current.clientHeight;
      
      // 스크롤이 필요 없는 경우
      if (scrollHeight <= clientHeight) {
        scrollThumbRef.current.style.display = 'none';
        scrollTrackRef.current.style.display = 'none';
        return;
      }
      
      // 스크롤바 표시
      scrollThumbRef.current.style.display = 'block';
      scrollTrackRef.current.style.display = 'block';
      
      // 썸 높이 계산 (컨테이너 높이의 비율)
      const thumbHeightPercent = (clientHeight / scrollHeight) * 100;
      const thumbHeight = Math.max(30, (thumbHeightPercent / 100) * trackHeight);
      scrollThumbRef.current.style.height = `${thumbHeight}px`;
      
      // 썸 위치 계산
      const scrollRatio = scrollTop / (scrollHeight - clientHeight);
      const thumbTop = scrollRatio * (trackHeight - thumbHeight);
      scrollThumbRef.current.style.top = `${thumbTop}px`;
    }
  };

  // 스크롤바 썸 드래그 시작
  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingThumb(true);
    setStartY(e.clientY);
    setStartScrollTop(scrollContainerRef.current.scrollTop);
  };

  // 스크롤바 트랙 클릭 처리
  const handleTrackClick = (e) => {
    if (scrollContainerRef.current && scrollThumbRef.current && scrollTrackRef.current) {
      const { top: trackTop } = scrollTrackRef.current.getBoundingClientRect();
      const thumbHeight = scrollThumbRef.current.clientHeight;
      const clickPosition = e.clientY - trackTop;
      const trackHeight = scrollTrackRef.current.clientHeight;
      
      // 클릭 위치가 썸 위치보다 위인지 아래인지 확인
      const thumbTop = parseFloat(scrollThumbRef.current.style.top) || 0;
      const direction = clickPosition < thumbTop ? -1 : 1;
      
      // 페이지 단위로 스크롤
      const scrollContainer = scrollContainerRef.current;
      const { clientHeight } = scrollContainer;
      const newScrollTop = scrollContainer.scrollTop + direction * clientHeight * 0.9;
      
      // 스크롤 애니메이션
      scrollContainer.scrollTo({
        top: newScrollTop,
        behavior: 'smooth'
      });
    }
  };

  const startResize = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const startTop = position.top;
    const startLeft = position.left;
    
    setResizing(direction);

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      if (direction.includes('right')) {
        const newWidth = Math.max(360, startWidth + deltaX);
        setDimensions(prev => ({ ...prev, width: newWidth }));
        setSidebarWidth(newWidth);
      }
      
      if (direction.includes('left')) {
        const newWidth = Math.max(360, startWidth - deltaX);
        const newLeft = startLeft + deltaX;
        if (newWidth >= 360 && newWidth <= 480) {
          setDimensions(prev => ({ ...prev, width: newWidth }));
          setSidebarWidth(newWidth);
          setPosition(prev => ({ ...prev, left: newLeft }));
        }
      }
      
      if (direction.includes('bottom')) {
        const newHeight = Math.max(300, startHeight + deltaY);
        setDimensions(prev => ({ ...prev, height: newHeight }));
      }
      
      if (direction.includes('top')) {
        const newHeight = Math.max(300, startHeight - deltaY);
        const newTop = startTop + deltaY;
        if (newHeight >= 300) {
          setDimensions(prev => ({ ...prev, height: newHeight }));
          setPosition(prev => ({ ...prev, top: newTop }));
        }
      }
    };

    const onMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    fetchContentData();
  }, [activeTab]);

  const fetchContentData = async () => {
    try {
      setIsLoading(true);
      if (!localStorage.getItem('token')) {
        setContentData([]);
        setFilteredContentData([]);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const currentUserId = jwtDecode(token).userId;
      let endpoint = '';

      switch (activeTab) {
        case 'collections':
          endpoint = `/get-all-hyperlinks?from=collections&target=${currentUserId}&currentUserId=${currentUserId}`;
          break;
        case 'likes':
          endpoint = `/get-all-hyperlinks?from=likes&target=${currentUserId}&currentUserId=${currentUserId}`;
          break;
        case 'posts':
          endpoint = `/get-all-hyperlinks?from=posts&target=${currentUserId}&currentUserId=${currentUserId}`;
          break;
        default:
          endpoint = `/get-all-hyperlinks?from=collections&target=${currentUserId}&currentUserId=${currentUserId}`;
      }

      const response = await api.get(endpoint);
      if (response.status === 200) {
        const data = response.data.reverse();
        setContentData(data);
        setFilteredContentData(data);
      } else {
        setContentData([]);
        setFilteredContentData([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentData([]);
      setFilteredContentData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSearchTerm(''); // 탭 변경 시 검색어 초기화
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색창 초기화 핸들러
  const clearSearch = () => {
    setSearchTerm('');
  };

  // 인풋필드 키 이벤트 핸들러 추가
  const handleSearchKeyDown = (e) => {
    // Ctrl+A (또는 Command+A) 키가 눌렸을 때
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // 이벤트가 인풋필드에서 발생한 경우에만 기본 동작 허용
      // 다른 곳에서는 이벤트 전파 중지
      e.stopPropagation();
    }
  };

  // 사이드바 전체 키 이벤트 핸들러 추가
  const handleSidebarKeyDown = (e) => {
    // Ctrl+A (또는 Command+A) 키가 눌렸을 때
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // 인풋필드가 아닌 다른 곳에서는 기본 동작 방지
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
  };

  // 필터 옵션 정의
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorite', label: 'Favorites' },
    { id: 'shared', label: 'Shared' },
    { id: 'archived', label: 'Archived' }
  ];
  
  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    setActiveFilter(e.target.value);
  };
  
  // 현재 선택된 필터 옵션 가져오기
  const getSelectedFilterLabel = () => {
    const selectedFilter = filterOptions.find(option => option.id === activeFilter);
    return selectedFilter ? selectedFilter.label : 'All';
  };
  
  // 필터 컨테이너 스타일 계산
  const getFilterContainerStyle = () => {
    const selectedLabel = getSelectedFilterLabel();
    // 선택된 필터 라벨의 길이에 따라 너비 조정
    const baseWidth = 100; // 기본 너비
    const charWidth = 8; // 글자당 추가 너비
    const extraWidth = Math.min(selectedLabel.length * charWidth, 40); // 최대 40px 추가
    
    return {
      width: `${baseWidth + extraWidth}px`
    };
  };
  
  // 필터링 로직 추가
  const filterContent = (items) => {
    if (activeFilter === 'all') return items;
    
    return items.filter(item => {
      switch(activeFilter) {
        case 'recent':
          return item.lastAccessed && new Date(item.lastAccessed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        case 'favorite':
          return item.isFavorite;
        case 'shared':
          return item.isShared;
        case 'archived':
          return item.isArchived;
        default:
          return true;
      }
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="sidebar-loading">
          <div className={ss.loadingContainer}>
            <div className={ss.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    if (filteredContentData.length === 0) {
      return (
        <div className={ss.emptyState}>
          <p>No results found</p>
          {searchTerm && (
            <button className={ss.clearSearchButton} onClick={clearSearch}>
              Clear Search
            </button>
          )}
        </div>
      );
    }

    // 검색 및 필터링 적용
    let filteredItems = [...filteredContentData];
    
    // 필터 적용
    filteredItems = filterContent(filteredItems);
    
    // 검색어 적용
    if (searchTerm.trim()) {
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return <SideMenuHyperium 
      cards={filteredItems} 
      currentUser={currentUser}
      onDragStart={(card) => console.log('Dragging card:', card)}
    />;
  };

  const sidebarStyle = {
    width: isOpen ? `${dimensions.width}px` : '60px',
    height: isOpen ? `${dimensions.height}px` : 'auto',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transition: resizing ? 'none' : 'width 0.3s ease, transform 0.3s ease',
    maxWidth: `${windowSize.width * 0.8}px`,
    maxHeight: isOpen ? `${windowSize.height * 0.9}px` : 'fit-content',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '360px',
    minHeight: '400px'
  };

  // 헤더 드래그 시작 핸들러
  const handleHeaderMouseDown = (e) => {
    // 리사이즈 핸들에서 시작된 이벤트는 무시
    if (e.target.classList.contains(ss.resizeHandle)) return;
    
    setIsDraggingHeader(true);
    setDragStart({
      x: e.clientX - position.left,
      y: e.clientY - position.top
    });
  };

  // 헤더 드래그 중 핸들러
  const handleHeaderDrag = (e) => {
    if (!isDraggingHeader) return;
    
    // 새 위치 계산
    let newLeft = e.clientX - dragStart.x;
    let newTop = e.clientY - dragStart.y;
    
    // 화면 경계 체크
    const maxRight = windowSize.width - dimensions.width;
    const maxBottom = windowSize.height - dimensions.height;
    
    // 경계 제한
    newLeft = Math.max(0, Math.min(newLeft, maxRight));
    newTop = Math.max(0, Math.min(newTop, maxBottom));
    
    // 위치 업데이트
    setPosition({
      left: newLeft,
      top: newTop
    });
  };

  // 헤더 드래그 종료 핸들러
  const handleHeaderMouseUp = () => {
    setIsDraggingHeader(false);
  };

  // 헤더 드래그 이벤트 리스너 등록
  useEffect(() => {
    if (isDraggingHeader) {
      document.addEventListener('mousemove', handleHeaderDrag);
      document.addEventListener('mouseup', handleHeaderMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleHeaderDrag);
      document.removeEventListener('mouseup', handleHeaderMouseUp);
    };
  }, [isDraggingHeader, dragStart, position, dimensions, windowSize]);

  // 사이드바 토글 애니메이션 처리를 위한 래퍼 함수
  const handleToggleSidebar = () => {
    setAnimating(true);
    toggleSidebar();
    
    // 애니메이션이 완료된 후 animating 상태 해제
    setTimeout(() => {
      setAnimating(false);
    }, 300); // 애니메이션 지속 시간과 일치시킴
  };

  return (
    <div 
      ref={sidebarRef}
      className={`${ss.sidebar} ${mounted ? ss.mounted : ''} ${isOpen ? ss.open : ss.closed} ${resizing ? ss.resizing : ''} ${isDraggingHeader ? ss.dragging : ''} ${animating ? ss.animating : ''}`}
      style={sidebarStyle}
      onKeyDown={handleSidebarKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Resize handles */}
      {isOpen && (
        <>
          <div className={`${ss.resizeHandle} ${ss.top}`} onMouseDown={(e) => startResize('top', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.right}`} onMouseDown={(e) => startResize('right', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.bottom}`} onMouseDown={(e) => startResize('bottom', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.left}`} onMouseDown={(e) => startResize('left', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.topRight}`} onMouseDown={(e) => startResize('top-right', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.bottomRight}`} onMouseDown={(e) => startResize('bottom-right', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.bottomLeft}`} onMouseDown={(e) => startResize('bottom-left', e)}></div>
          <div className={`${ss.resizeHandle} ${ss.topLeft}`} onMouseDown={(e) => startResize('top-left', e)}></div>
        </>
      )}

      <div 
        className={ss.sidebarHeader}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className={ss.sidebarHeaderTitle}>
          {isOpen && <span>HYPERlink</span>}
        </div>
        <button 
          className={ss.toggleButton} 
          onClick={handleToggleSidebar}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon={isOpen ? faChevronLeft : faChevronRight} />
        </button>
      </div>
      
      {isOpen ? (
        <>
          {currentUser && (
            <div className={ss.userInfo}>
              <div className={ss.userAvatar}>
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className={ss.userName}>
                {currentUser.userName || 'User'}
              </div>
            </div>
          )}
          
          <div className={ss.tabsContainer}>
            <div className={ss.tabs}>
              <button
                className={`${ss.tab} ${activeTab === 'collections' ? ss.active : ''}`}
                onClick={() => handleTabClick('collections')}
              >
                <FontAwesomeIcon icon={faLayerGroup} className={ss.tabIcon} />
                <span className={ss.tabText}>Collections</span>
              </button>
              <button
                className={`${ss.tab} ${activeTab === 'likes' ? ss.active : ''}`}
                onClick={() => handleTabClick('likes')}
              >
                <FontAwesomeIcon icon={faHeart} className={ss.tabIcon} />
                <span className={ss.tabText}>Likes</span>
              </button>
              <button
                className={`${ss.tab} ${activeTab === 'posts' ? ss.active : ''}`}
                onClick={() => handleTabClick('posts')}
              >
                <FontAwesomeIcon icon={faBoxArchive} className={ss.tabIcon} />
                <span className={ss.tabText}>Posts</span>
              </button>
            </div>
          </div>
          
          {/* 검색 기능 추가 */}
          <div className={ss.searchContainer}>
            <div className={ss.searchInputWrapper}>
              <span className={ss.searchIcon}>
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className={ss.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm && (
                <button className={ss.clearButton} onClick={clearSearch}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
              
            {/* 필터 드롭다운 추가 - 검색창 옆에 배치 */}
            <div 
              className={ss.filterContainer} 
              style={getFilterContainerStyle()}
            >
              <select 
                className={ss.filterSelect}
                value={activeFilter}
                onChange={handleFilterChange}
                aria-label="Filter content"
                title={getSelectedFilterLabel()} // 툴팁 추가
              >
                {filterOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={ss.filterArrow}>
                <i className="fas fa-chevron-down"></i>
              </span>
            </div>
          </div>
          
          <div className={ss.scrollWrapper}>
            <div 
              className={ss.customScrollContainer} 
              ref={scrollContainerRef}
            >
              {renderContent()}
            </div>
            
            {/* 커스텀 스크롤바 */}
            <div 
              className={ss.scrollTrack} 
              ref={scrollTrackRef}
              onClick={handleTrackClick}
            >
              <div 
                className={ss.scrollThumb} 
                ref={scrollThumbRef}
                onMouseDown={handleThumbMouseDown}
              />
            </div>
          </div>
        </>
      ) : (
        <div className={ss.closedIcons}>
          <button 
            className={`${ss.iconButton} ${activeTab === 'collections' ? ss.active : ''}`}
            onClick={() => {
              handleTabClick('collections');
              if (!isOpen) toggleSidebar();
            }}
          >
            <FontAwesomeIcon icon={faLayerGroup} />
          </button>
          <button 
            className={`${ss.iconButton} ${activeTab === 'likes' ? ss.active : ''}`}
            onClick={() => {
              handleTabClick('likes');
              if (!isOpen) toggleSidebar();
            }}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button 
            className={`${ss.iconButton} ${activeTab === 'posts' ? ss.active : ''}`}
            onClick={() => {
              handleTabClick('posts');
              if (!isOpen) toggleSidebar();
            }}
          >
            <FontAwesomeIcon icon={faBoxArchive} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 