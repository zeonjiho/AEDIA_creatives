import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEllipsisV,
  faGlobe,
  faLock,
  faUserGroup,
  faPencil,
  faPlus,
  faMagicWandSparkles,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import ss from './CollectionDetailModal.module.css';
import Sidebar from '../Sidebar/Sidebar';
import MasonryGrid from '../Hyperium/Hyperium';
import getAvatarImage from '../../util/getAvatarImage';
import getThumbnailImage from '../../util/getThumbnailImage';
import api from '../../util/api'; 
import ImageEditor from '../Images/ImageEditor/ImageEditor';
import ImageUploader from '../Images/ImageUploader/ImageUploader';

/**
 * 컬렉션 상세 모달 컴포넌트
 * @param {Object} props
 * @param {Object} props.collection - 현재 확인 중인 컬렉션 데이터
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Object} props.currentUser - 현재 사용자 정보
 */
const CollectionDetailModal = ({ collection, onClose, currentUser }) => {
  // =========================================
  // 1) 상태 정의
  // =========================================
  const [collectionData, setCollectionData] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  const [myCollections, setMyCollections] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [rating, setRating] = useState(0);

  const [isVisible, setIsVisible] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    title: collection?.title || '',
    description: collection?.description || '',
    thumbnail: getThumbnailImage(collection?.thumbnail) || ''
  });

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);

  // =========================================
  // 2) 임시 컬렉션 목록 (데모/테스트용)
  // =========================================
  const tempCollections = [
    {
      _id: '1',
      title: "Liked Items",
      thumbnail: "https://i.scdn.co/image/ab67706f00000003e4eadd417a05b2546e866934",
      type: "collection",
      count: 71,
      pinned: true,
      owner: "zeonjiho",
      dateAdded: new Date('2024-01-15')
    },
    {
      _id: '2',
      title: "Design Inspiration",
      thumbnail: "https://i.scdn.co/image/ab67706f000000034863e3c84ccd4cf12c6718e6",
      type: "collection",
      owner: "zeonjiho",
      count: 156
    },
    {
      _id: '3',
      title: "Development Resources",
      thumbnail: "https://i.scdn.co/image/ab67706f00000003e0f6b34ca2bb90ea36866ff4",
      type: "collection",
      owner: "zeonjiho",
      count: 178
    },
    {
      _id: '4',
      title: "UI References",
      thumbnail: "https://i.scdn.co/image/ab67706f00000003e435ce0a86a8b9dc24527618",
      type: "collection",
      owner: "zeonjiho",
      count: 134
    },
    {
      _id: '5',
      title: "Reading List",
      thumbnail: "https://i.scdn.co/image/ab67706f00000003b0fe40a6e1692822f5a9d8f1",
      type: "collection",
      owner: "zeonjiho",
      count: 245
    }
  ];

  // =========================================
  // 3) 컬렉션 상세 데이터 로드
  // =========================================
  useEffect(() => {
    fetchCollectionDetails();
    // 데모용 데이터
    setMyCollections(tempCollections);
  }, [collection._id]);

  // =========================================
  // 4) 화면 크기 변경 대응
  // =========================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  /**
   * 서버로부터 컬렉션 정보 및 아이템을 불러오는 함수
   */
  const fetchCollectionDetails = async () => {
    try {
      const collectionResponse = await api.get(`/collections/${collection._id}`);
      const collectionData = {
        ...collectionResponse.data,
        thumbnail: getThumbnailImage(collectionResponse.data.thumbnail),
        poster: {
          ...collectionResponse.data.poster,
          avatar: getAvatarImage(collectionResponse.data.poster?.avatar)
        }
      };
      
      setCollectionData(collectionData);
      // 편집 데이터도 업데이트
      setEditedData({
        title: collectionData.title,
        description: collectionData.description,
        thumbnail: collectionData.thumbnail
      });

      const itemsResponse = await api.get(`/collections/${collection._id}/items`);
      const items = itemsResponse.data.map(item => ({
        ...item,
        img: getThumbnailImage(item.thumbnail),
        thumbnail: getThumbnailImage(item.thumbnail),
        poster: {
          userName: item.poster.userName,
          avatar: getAvatarImage(item.poster.avatar)
        }
      }));
      setCollectionItems(items);
    } catch (error) {
      console.error('Failed to fetch collection details:', error);
      // 에러 시 기본 데이터로 설정
      const fallbackData = {
        ...collection,
        thumbnail: getThumbnailImage(collection.thumbnail),
        poster: {
          ...collection.poster,
          avatar: getAvatarImage(collection.poster?.avatar)
        }
      };
      setCollectionData(fallbackData);
      setEditedData({
        title: fallbackData.title,
        description: fallbackData.description,
        thumbnail: fallbackData.thumbnail
      });
    }
  };

  // =========================================
  // 5) 이벤트 핸들러
  // =========================================
  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // 여기서 저장 로직 구현
      console.log('Save changes:', editedData);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditThumbnail = () => {
    setShowImageEditor(true);
    setShowImageUploader(false);
  };

  const handleImageUpload = (imageData) => {
    console.log('이미지 업로드됨:', imageData);
    setShowImageUploader(false);
    
    // thumbnail 상태 설정
    setEditedData(prev => ({
      ...prev, 
      thumbnail: imageData
    }));
    
    setShowImageEditor(true);
  };

  const handleSaveEditedImage = (editedImage) => {
    console.log('에디터에서 이미지 수신됨:', editedImage);
    
    if (editedImage && editedImage.url) {
      // 상태 업데이트
      setEditedData(prev => ({
        ...prev,
        thumbnail: editedImage.url
      }));
      
      // 이미지 에디터 상태 초기화
      setShowImageEditor(false);
    }
  };

  const handleRatingClick = (value) => {
    // 현재 선택된 rating을 다시 클릭하면 rating 해제
    if (rating === value) {
      setRating(0);
    } else {
      setRating(value);
    }
  };

  // 컬렉션 데이터가 아직 로딩되지 않았다면
  if (!collectionData) return null;

  // =========================================
  // 6) 렌더링
  // =========================================
  return (
    <div className={`${ss.modalContainer} ${isVisible ? ss.visible : ''}`}>
      {/* 백그라운드 블러 이미지 */}
      <div
        className={ss.backgroundImage}
        style={{ backgroundImage: `url(${collectionData.thumbnail})` }}
      />

      <div className={ss.modalContent}>
        {/* 사이드바 */}
        {!isMobile && (
          <Sidebar
            collections={myCollections}
            activeCollectionId={collection._id}
            onCollectionSelect={(col) => {
              console.log('Selected collection:', col.title);
            }}
          />
        )}

        {/* 메인 콘텐츠 */}
        <div className={ss.mainContent}>
          {/* 헤더를 여기로 이동 */}
          <header className={ss.header}>
            <div className={ss.headerLeft}>
              <FontAwesomeIcon icon={faLayerGroup} className={ss.titleIcon} />
              <h1 className={ss.title}>Collection</h1>
            </div>
            <button onClick={handleBack} className={ss.backButton}>
              Back
            </button>
          </header>

          {/* 나머지 콘텐츠 */}
          <div className={ss.collectionInfo}>
            <div className={ss.collectionHeader}>
              {/* 컬렉션 썸네일 */}
              <div className={ss.coverArtContainer}>
                <img
                  src={editedData.thumbnail}
                  alt={editedData.title}
                  className={ss.coverArt}
                />
                {isEditing && (
                  <div 
                    className={ss.thumbnailEdit}
                    onClick={handleEditThumbnail}
                  >
                    <FontAwesomeIcon icon={faPencil} />
                    <span>Edit</span>
                  </div>
                )}
              </div>

              {/* 컬렉션 정보 */}
              <div className={ss.headerInfo}>
                <div className={ss.titleRow}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={ss.titleInput}
                    />
                  ) : (
                    <h2 className={ss.collectionTitle}>{editedData.title}</h2>
                  )}
                  <div className={ss.buttonGroup}>
                    {isEditing ? (
                      <button className={`${ss.aiButton}`}>
                        <FontAwesomeIcon icon={faMagicWandSparkles} />
                        <span>AI</span>
                      </button>
                    ) : (
                      <button className={ss.addButton}>
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Add</span>
                      </button>
                    )}
                    <button 
                      className={`${ss.editButton} ${isEditing ? ss.editing : ''}`}
                      onClick={handleEditClick}
                    >
                      <FontAwesomeIcon icon={faPencil} />
                      <span>{isEditing ? 'Save' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={ss.descriptionInput}
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className={ss.description}>{editedData.description}</p>
                )}

                <div className={ss.meta}>
                  {/* 작성자 */}
                  <div className={ss.owner}>
                    <img
                      src={collectionData.poster?.avatar}
                      alt={collectionData.poster?.userName}
                      className={ss.ownerAvatar}
                    />
                    <span className={ss.ownerName}>
                      @{collectionData.poster?.userName}
                    </span>
                    <button
                      className={`${ss.followButton} ${
                        isFollowing
                          ? isHoveringFollow
                            ? ss.unfollow
                            : ss.following
                          : ss.follow
                      }`}
                      onClick={handleFollowClick}
                      onMouseEnter={() => setIsHoveringFollow(true)}
                      onMouseLeave={() => setIsHoveringFollow(false)}
                    >
                      {isFollowing
                        ? isHoveringFollow
                          ? 'Unfollow'
                          : 'Following'
                        : 'Follow'}
                    </button>
                  </div>

                  {/* 공개 범위 */}
                  <div className={ss.visibility}>
                    <FontAwesomeIcon
                      icon={
                        collectionData.visibility === 'public'
                          ? faGlobe
                          : collectionData.visibility === 'shared'
                          ? faUserGroup
                          : faLock
                      }
                    />
                    <span>
                      {collectionData.visibility?.charAt(0).toUpperCase() +
                        collectionData.visibility?.slice(1)}
                    </span>
                    <button className={ss.menuButton}>
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                  </div>
                </div>

                {/* 통계 데이터 */}
                <div className={ss.stats}>
                  <div className={ss.statItem}>
                    <span className={ss.statValue}>
                      {collectionData.stats?.views || 0}
                    </span>
                    <span className={ss.statLabel}>Views</span>
                  </div>
                  <div className={ss.statItem}>
                    <span className={ss.statValue}>
                      {collectionItems.length}
                    </span>
                    <span className={ss.statLabel}>Hyperlinks</span>
                  </div>
                  <div className={ss.statItem}>
                    <span className={ss.statValue}>
                      {collectionData.stats?.followers || 0}
                    </span>
                    <span className={ss.statLabel}>Followers</span>
                  </div>

                  {/* 좋아요 버튼 */}
                  <button
                    className={`${ss.likeButton} ${isLiked ? ss.liked : ''}`}
                    onClick={handleLikeClick}
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
                           2 5.42 4.42 3 7.5 3c1.74 0 
                           3.41.81 4.5 2.09C13.09 3.81
                           14.76 3 16.5 3 19.58 3 
                           22 5.42 22 8.5c0 3.78-3.4
                           6.86-8.55 11.54L12 21.35z"
                      />
                    </svg>
                    {(collectionData.stats?.likes || 0).toLocaleString()}
                  </button>
                </div>

                {/* 선호도(평점) 표시 */}
                <div className={ss.ratingContainer}>
                  <span className={ss.ratingTitle}>Preference</span>
                  <div className={ss.dotRating}>
                    <div className={ss.dots}>
                      {[1, 2, 3, 4, 5].map(dot => (
                        <div
                          key={dot}
                          className={`${ss.dot} ${dot <= rating ? ss.active : ''}`}
                          onClick={() => handleRatingClick(dot)}
                        />
                      ))}
                    </div>
                    <span className={ss.ratingLabel}>
                      {rating ? `${rating}/5` : 'Rate this collection'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 컬렉션 아이템(하이퍼링크) 그리드 */}
          <div className={ss.content}>
            <div className={ss.contentHeader}>
              <button className={ss.contentTypeButton}>Collection</button>
              <button className={ss.contentTypeButton}>Similar</button>
            </div>
            <MasonryGrid
              cards={collectionItems}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>

      {/* 이미지 에디터 모달 */}
      {showImageEditor && (
        <div style={{position: 'fixed', inset: 0, zIndex: 2500}}>
          <ImageEditor
            image={editedData.thumbnail}
            onSave={handleSaveEditedImage}
            onClose={() => setShowImageEditor(false)}
            onRequestUpload={() => {
              setShowImageEditor(false);
              setShowImageUploader(true);
            }}
          />
        </div>
      )}

      {/* 이미지 업로더 모달 */}
      {showImageUploader && (
        <ImageUploader
          onImageSelect={handleImageUpload}
          onClose={() => {
            setShowImageUploader(false);
          }}
        />
      )}
    </div>
  );
};

export default CollectionDetailModal;