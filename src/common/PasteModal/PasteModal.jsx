import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ss from './PasteModal.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen, faMagicWandSparkles, faMagic, faChevronDown, faLayerGroup, faXmark, faMaximize, faFolder, faTimes, faMinimize } from '@fortawesome/free-solid-svg-icons'
import TypeSelector from './components/TypeSelector/TypeSelector'
import LinkInput from './components/LinkInput/LinkInput'
import ImageUploader from './components/ImageUploader/ImageUploader'
import CodeEditor from '../Components/CodeEditor/CodeEditor'
import TagEditor from './components/TagEditor/TagEditor'
import DescriptionEditor from './components/DescriptionEditor/DescriptionEditor'
import api from '../../util/api'
import ImagePreview from './components/ImagePreview/ImagePreview'
import CollectionSelector from '../CollectionSelector/CollectionSelector'
import MinimizedModal from './components/MinimizedModal/MinimizedModal'
import MetadataFetcher from './components/MetadataFetcher/MetadataFetcher'
import { jwtDecode } from 'jwt-decode'
import VideoUploader from './components/VideoUploader/VideoUploader'
import MusicUploader from './components/MusicUploader/MusicUploader'
import LocationInput from './components/LocationInput/LocationInput'
import ClipboardAnalyzer from './components/ClipboardAnalyzer/ClipboardAnalyzer'
import ClipboardNotification from './components/ClipboardAnalyzer/ClipboardNotification'
import CodeUploader from './components/CodeUploader/CodeUploader'

const PasteModal = forwardRef(({ onClose, onMinimize, onMaximize, modalId, initialData }, ref) => {
  const navigate = useNavigate()
  const [pastedContent, setPastedContent] = useState('')
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [metadata, setMetadata] = useState(null)
  const [tags, setTags] = useState([])
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAIEnabled, setIsAIEnabled] = useState(true)
  const [contentType, setContentType] = useState('link')
  const [thumbnailImage, setThumbnailImage] = useState(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCollectionSelector, setShowCollectionSelector] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [selectedCollections, setSelectedCollections] = useState([])
  const [collections, setCollections] = useState([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [minimizedModals, setMinimizedModals] = useState([])
  const [location, setLocation] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [detectedType, setDetectedType] = useState(null)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (metadata?.title) {
      setTitle(metadata.title);
    }
  }, [metadata]);

  useEffect(() => {
    if (initialData) {
      // console.log('PasteModal - initialData:', JSON.stringify(initialData, null, 2));
      // console.log('PasteModal - initialData.selectedCollections:', JSON.stringify(initialData.selectedCollections, null, 2));
      
      setPastedContent(initialData.pastedContent || '');
      setTitle(initialData.title || '');
      setContentType(initialData.contentType || 'link');
      setSelectedCollections(initialData.selectedCollections || []);
      setIsPublic(initialData.isPublic ?? true);
      setTags(initialData.tags || []);
      setDescription(initialData.description || '');
      setIsAIEnabled(initialData.isAIEnabled ?? true);
      setThumbnailImage(initialData.thumbnailImage || null);
      setCode(initialData.code || '');
      setLanguage(initialData.language || 'javascript');
      
      // console.log('PasteModal - after setting state from initialData, selectedCollections:', 
      //             JSON.stringify(initialData.selectedCollections || [], null, 2));
    }
  }, [initialData]);

  useImperativeHandle(ref, () => ({
    minimize: () => {
      const currentTitle = title || metadata?.title || '';
      console.log('Minimizing with title:', currentTitle);

      const modalData = {
        contentType,
        selectedCollections,
        pastedContent,
        title: currentTitle,
        isPublic,
        tags,
        description,
        isAIEnabled,
        thumbnailImage,
        code,
        language
      };

      console.log('Sending modal data:', modalData); // 디버깅

      setIsMinimized(true);
      if (onMinimize) onMinimize(modalId, modalData);
    },
    maximize: () => {
      console.log('PasteModal - handleMaximize - selectedCollections before:', JSON.stringify(selectedCollections, null, 2));
      setIsMinimized(false);
      if (onMaximize) onMaximize(modalId);
    },
    isMinimized: () => isMinimized
  }));

  // 임시 컬렉션 데이터
  const TEMP_COLLECTIONS = [
    {
      id: 'art-001',
      name: 'Visual Arts & Design',
      count: 24
    },
    {
      id: 'art-002',
      name: 'Digital Illustrations',
      count: 18
    },
    {
      id: 'art-003',
      name: 'Photography',
      count: 31
    },
    {
      id: 'art-004',
      name: 'Contemporary Art',
      count: 15
    },
    {
      id: 'art-005',
      name: 'Motion Graphics',
      count: 27
    },
    {
      id: 'art-006',
      name: 'UI/UX Inspiration',
      count: 42
    }
  ];

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  useEffect(() => {
    if (pastedContent && contentType === 'link') {
      // console.log('Fetching metadata for:', pastedContent); // 디버깅
      handleFetchMetadata();
    }
  }, [pastedContent, contentType]);

  const handleFetchMetadata = async () => {
    try {
      // console.log('Fetching metadata...'); // 디버깅
      const response = await api.post('/fetch-metadata', { url: pastedContent });
      // console.log('Metadata response:', response.data); // 디버깅
      setMetadata(response.data);

      if (response.data.title) {
        // console.log('Setting title to:', response.data.title); // 디버깅
        setTitle(response.data.title);
      }
    } catch (err) {
      // console.error('Failed to fetch metadata:', err);
    }
  };

  const handleAdd = async () => {
    console.log('handleAdd 호출됨 - 현재 상태:', {
      contentType,
      isValid: isValid,
      isContentValid: isContentValid(),
      pastedContent: pastedContent ? (pastedContent.length > 50 ? pastedContent.substring(0, 50) + '...' : pastedContent) : null,
      thumbnailImage: thumbnailImage ? '있음' : '없음',
      code: code ? (code.length > 50 ? code.substring(0, 50) + '...' : code) : null
    });
    
    // 유효성 검사 재확인
    if (!isContentValid()) {
      console.error('콘텐츠가 유효하지 않습니다. 제출을 중단합니다.');
      return;
    }
    
    setIsLoading(true);
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    const userId = jwtDecode(localStorage.getItem('token')).userId;
    if (!localStorage.getItem('token') || !userId) {
      return;
    }

    try {
      let content;
      if (contentType === 'link') {
        content = pastedContent;
      } else if (contentType === 'image') {
        // 이미지 타입은 반드시 thumbnailImage가 있어야 함
        if (!thumbnailImage) {
          setIsLoading(false);
          return;
        }
        content = thumbnailImage;
      } else if (contentType === 'code') {
        content = code;
      } else if (contentType === 'video' || contentType === 'music') {
        // 비디오 타입은 pastedContent가 있어야 함
        if (!pastedContent || pastedContent.trim() === '') {
          setIsLoading(false);
          return;
        }
        content = pastedContent;
      }

      // 썸네일 이미지가 있다면 먼저 업로드
      let thumbnailFilename = null;
      let thumbnailRatio = null;
      if (thumbnailImage) {
        thumbnailRatio = thumbnailImage.width / thumbnailImage.height
        // Base64 데이터를 File 객체로 변환
        const response = await fetch(thumbnailImage.src);
        const blob = await response.blob();
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('thumbnail', file);
        
        const thumbnailResponse = await api.post('/upload-thumbnail', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (thumbnailResponse.data.filename) {
          thumbnailFilename = thumbnailResponse.data.filename;
        }
      }

      const requestData = {
        userId,
        title,
        isPublic,
        content,
        contentType,
        tags,
        description,
        thumbnail: thumbnailFilename, // 업로드된 썸네일 파일명
        location,
      }

      if (contentType === 'image') {
        requestData.content = ''
      }
      
      if (contentType === 'code') {
        requestData.codeLanguage = language
      }

      if (thumbnailRatio) {
        requestData.thumbnailRatio = thumbnailRatio
      }
      
      const response = await api.post('/add-hyperlink', requestData)
      if (response.status === 200) {
        // 현재 페이지 데이터 새로고침
        // 현재 URL 경로에 따라 다른 새로고침 방식 적용
        const currentPath = window.location.pathname;
        
        // 커스텀 이벤트 발생 - 페이지 컴포넌트에서 이 이벤트를 감지하여 데이터 새로고침
        const refreshEvent = new CustomEvent('refreshPageData', {
          detail: { 
            source: 'pasteModal',
            contentType: contentType,
            path: currentPath
          }
        });
        window.dispatchEvent(refreshEvent);
        
        // 홈, 프로필, 컬렉션 페이지 등에서 데이터 새로고침
        if (window.refreshPageData && typeof window.refreshPageData === 'function') {
          window.refreshPageData();
        }
        
        onClose();
      } else {
        console.error('Failed to save:', response.data)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = () => {
    if (!isLoggedIn) {
      onClose()
      return
    }
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = () => {
    onClose()
  }

  // Esc 키 이벤트 핸들러
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showCancelConfirm) {
          onClose();
        } else {
          setShowCancelConfirm(true);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose, showCancelConfirm]);

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    // 컴포넌트가 언마운트될 때 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 대신 paste 이벤트 리스너 추가
  useEffect(() => {
    // ClipboardAnalyzer 컴포넌트로 대체되었으므로 이 이벤트 리스너는 제거
    // const handlePaste = (e) => {
    //   // 입력 필드나 텍스트 영역이 활성화되어 있을 때는 paste 이벤트를 처리하지 않음
    //   const isInputActive = e.target.matches('input, textarea, [contenteditable="true"]') ||
    //     e.target.closest('input, textarea, [contenteditable="true"]');
    //   
    //   if (isInputActive) return;

    //   // ImageUploader가 열려있을 때는 paste 이벤트를 처리하지 않음
    //   const imageUploaderElement = document.querySelector('.ImageUploader');
    //   if (imageUploaderElement) return;

    //   const text = e.clipboardData.getData('text');
    //   const formattedUrl = text.trim();
    //   if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    //     setPastedContent('https://' + formattedUrl);
    //   } else {
    //     setPastedContent(formattedUrl);
    //   }
    // };

    // window.addEventListener('paste', handlePaste);
    // return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    // 실제 API 연동 시에는 이 부분을 활성화
    const fetchCollections = async () => {
      try {
        // const response = await api.get('/collections');
        // setCollections(response.data);

        // 임시로 더미 데이터 사용
        setCollections(TEMP_COLLECTIONS);
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      }
    };

    fetchCollections();
  }, []);

  const handleCollectionSelect = (selectedCollections, notification) => {
    console.log('Collection selected in PasteModal:', selectedCollections);
    
    // 선택된 컬렉션이 있으면 상태 업데이트
    if (selectedCollections && selectedCollections.length > 0) {
      // 컬렉션 데이터가 객체 형태인지 확인
      const formattedCollections = selectedCollections.map(collection => {
        // 이미 올바른 형식이면 그대로 사용
        if (typeof collection === 'object' && collection.id && collection.name) {
          return collection;
        }
        
        // 컬렉션 ID만 있는 경우 컬렉션 객체 찾기
        if (typeof collection === 'string') {
          const foundCollection = collections.find(c => c.id === collection);
          if (foundCollection) {
            return foundCollection;
          }
        }
        
        // 기본값 반환
        return { id: collection, name: 'Collection' };
      });
      
      setSelectedCollections(formattedCollections);
      // console.log('Updated selectedCollections state:', formattedCollections);
    } else {
      setSelectedCollections([]);
      // console.log('Reset selectedCollections to empty array');
    }
    
    setShowCollectionSelector(false);
  };

  const handleMinimize = () => {
    const currentTitle = title || metadata?.title || '';
    // console.log('handleMinimize - selectedCollections before:', selectedCollections);
    const modalData = {
      contentType,
      selectedCollections,
      pastedContent,
      title: currentTitle,
      isPublic,
      tags,
      description,
      isAIEnabled,
      thumbnailImage,
      code,
      language
    };
    // console.log('handleMinimize - modalData:', modalData);

    setIsMinimized(true);
    if (onMinimize) onMinimize(modalId, modalData);
  };

  const handleMaximize = () => {
    // console.log('PasteModal - handleMaximize - selectedCollections before:', JSON.stringify(selectedCollections, null, 2));
    setIsMinimized(false);
    if (onMaximize) onMaximize(modalId);
  };

  const handleWrapClick = (e) => {
    if (e.target.className === ss.wrap) {
      const currentTitle = title || metadata?.title || '';
      const modalData = {
        contentType,
        selectedCollections,
        pastedContent,
        title: currentTitle,
        isPublic,
        tags,
        description,
        isAIEnabled,
        thumbnailImage,
        code,
        language
      };

      setIsMinimized(true);
      if (onMinimize) onMinimize(modalId, modalData);
    }
  }

  const handleMetadataChange = (newMetadata) => {
    setMetadata(newMetadata)
    if (!title && newMetadata?.title) {
      setTitle(newMetadata.title)
      // localStorage 업데이트
      const savedData = JSON.parse(localStorage.getItem('modalData') || '{}')
      if (savedData[modalId]) {
        savedData[modalId].title = newMetadata.title
        localStorage.setItem('modalData', JSON.stringify(savedData))
      }
    }
  }

  const handleRemoveModal = useCallback((modalId) => {
    setMinimizedModals(prevModals =>
      prevModals.filter(modal => modal.id !== modalId)
    );

    // localStorage에서도 삭제
    localStorage.removeItem(`minimizedModal_${modalId}`);
  }, []);

  useEffect(() => {
    console.log('thumbnailImage', thumbnailImage)
  }, [thumbnailImage])

  // useEffect(() => {
  //   console.log('PasteModal - selectedCollections changed:', JSON.stringify(selectedCollections, null, 2));
  // }, [selectedCollections]);

  // 컴포넌트 마운트 시 테스트용 컬렉션 데이터 설정
  useEffect(() => {
    // 임시 컬렉션 데이터 설정 (테스트용)
    if (TEMP_COLLECTIONS.length > 0) {
      setSelectedCollections([TEMP_COLLECTIONS[0]]);
      // console.log('Set initial test collection:', TEMP_COLLECTIONS[0]);
    }
  }, []);

  // ClipboardAnalyzer 콜백 핸들러
  const handleContentDetected = useCallback((content) => {
    setPastedContent(content);
  }, []);

  const handleTypeDetected = useCallback((type) => {
    // 이미 초기 데이터에서 타입이 설정되었고, 콘텐츠가 있는 경우에는 타입 변경 안함
    if (initialData?.contentType && initialData?.pastedContent) {
      return;
    }
    
    // 타입이 변경되었을 때만 알림 표시
    if (type !== contentType) {
      setDetectedType(type);
      setShowNotification(true);
      setContentType(type);
    } else {
      setContentType(type);
    }
  }, [contentType, initialData]);

  const handleThumbnailDetected = useCallback((thumbnail) => {
    setThumbnailImage(thumbnail);
  }, []);

  // 알림 닫기 핸들러
  const handleCloseNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  // Add this function to check if content is valid based on content type
  const isContentValid = () => {
    console.log('isContentValid check - contentType:', contentType, 'pastedContent:', pastedContent, 'thumbnailImage:', thumbnailImage);
    
    switch (contentType) {
      case 'text':
        return pastedContent && pastedContent.trim() !== '';
      
      case 'code':
        return code && code.trim() !== '';
      
      case 'image':
        const isImageValid = pastedContent && thumbnailImage !== null;
        console.log('Image validation result:', isImageValid);
        return isImageValid;
      
      case 'video':
        // 비디오는 썸네일 없이 URL만으로 유효성 검사
        const isVideoValid = pastedContent && pastedContent.trim() !== '';
        console.log('Video validation result:', isVideoValid, 'URL:', pastedContent);
        return isVideoValid;
      
      case 'music':
        const isMusicValid = pastedContent && pastedContent.trim() !== '';
        console.log('Music validation result:', isMusicValid);
        return isMusicValid;
      
      case 'link':
        // 링크 타입은 URL만으로 유효성 검사 (썸네일은 선택 사항)
        const isLinkValid = pastedContent && pastedContent.trim() !== '';
        console.log('Link validation result:', isLinkValid, 'URL:', pastedContent);
        return isLinkValid;
      
      default:
        return false;
    }
  };

  useEffect(() => {
    // 콘텐츠 타입이 변경될 때마다 유효성 검사 실행
    console.log(`Content type changed to: ${contentType}`);
    const validationResult = isContentValid();
    console.log('Content validation updated:', validationResult);
    setIsValid(validationResult);
  }, [contentType, pastedContent, thumbnailImage, code]);

  useEffect(() => {
    if (contentType === 'video') {
      console.log('Video content type - pastedContent changed:', pastedContent);
    }
  }, [contentType, pastedContent]);

  return (
    <div className={ss.wrap} onClick={handleWrapClick} data-minimized={isMinimized}>
      {isMinimized ? (
        <MinimizedModal
          onMaximize={handleMaximize}
          contentType={contentType}
          selectedCollections={selectedCollections}
          modalId={modalId}
          title={title || metadata?.title || ''}
          pastedContent={pastedContent}
          onRemove={handleRemoveModal}
        />
      ) : (
        <div className={ss.modalWrapper}>
          <div className={ss.modalContent} data-ai-enabled={isAIEnabled} data-public={isPublic}>
            {/* 클립보드 분석기 추가 - 초기 데이터가 없을 때만 활성화 */}
            <ClipboardAnalyzer
              onContentDetected={handleContentDetected}
              onTypeDetected={handleTypeDetected}
              onThumbnailDetected={handleThumbnailDetected}
              enabled={!isMinimized && (!initialData?.pastedContent)}
            />
            
            {/* 헤더 위의 컨트롤 바 */}
            <div className={ss.topControls}>
              <div className={ss.collectionText} onClick={() => setShowCollectionSelector(true)}>
                <FontAwesomeIcon icon={faLayerGroup} className={ss.collectionIcon} />
                {selectedCollections && selectedCollections.length > 0 ? (
                  <>
                    <span className={ss.collectionName}>
                      {selectedCollections.length === 1 
                        ? selectedCollections[0].name 
                        : `${selectedCollections.length} Collections`}
                    </span>
                    <button
                      className={ss.clearCollectionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollections([]);
                      }}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={ss.collectionName}>Select Collection</span>
                    <FontAwesomeIcon icon={faChevronDown} className={ss.chevronIcon} />
                  </>
                )}
              </div>
            </div>

            {/* 모달 헤더 */}
            <div className={ss.modalHeader}>
              <div className={ss.headerLeft}>
                <TypeSelector
                  contentType={contentType}
                  onTypeChange={(newType) => {
                    console.log(`타입 변경: ${contentType} -> ${newType}`);
                    
                    // 타입 변경 시 관련 상태 초기화
                    if (newType !== contentType) {
                      // 이전 타입과 다른 경우에만 초기화
                      if (newType === 'image') {
                        setPastedContent('');
                        setThumbnailImage(null);
                      } else if (newType === 'code') {
                        setCode('');
                      } else if (newType === 'video') {
                        // 비디오 타입으로 변경 시 초기화
                        setPastedContent('');
                        // 썸네일은 선택 사항이므로 초기화하지 않아도 됨
                      } else {
                        setPastedContent('');
                      }
                      
                      // 유효성 상태 초기화 (타입 변경 시 항상 비활성화 상태로 시작)
                      setIsValid(false);
                    }
                    
                    setContentType(newType);
                  }}
                />
              </div>
              <div className={ss.visibilityControls}>
                <span
                  className={ss.aiToggle}
                  onClick={() => setIsAIEnabled(!isAIEnabled)}
                  data-enabled={isAIEnabled}
                  data-disabled={contentType === 'image'}
                  title={contentType === 'image' ? 'Coming soon' : ''}
                >
                  <svg
                    className={ss.aiIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2L3 5V11L8 14L13 11V5L8 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 14V8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 5L8 8L3 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isAIEnabled ? 'AI' : 'AI'}
                </span>
                <span
                  className={ss.visibilityText}
                  onClick={() => setIsPublic(!isPublic)}
                  data-public={isPublic}
                >
                  <FontAwesomeIcon
                    icon={isPublic ? faLockOpen : faLock}
                    className={ss.lockIcon}
                  />
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            {/* 스크롤되는 본문 영역 */}
            <div className={ss.modalBody}>
              <>
                <div className={ss.controlsHeader}>
                  <span className={ss.inputLabel}>Title</span>
                  <input
                    type="text"
                    className={ss.titleInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                  />
                </div>

                {contentType === 'link' && (
                  <LinkInput
                    pastedContent={pastedContent}
                    onContentChange={setPastedContent}
                    thumbnailImage={thumbnailImage}
                    onThumbnailChange={setThumbnailImage}
                    metadata={metadata}
                  />
                )}

                {contentType === 'video' && thumbnailImage && (
                  <div className={ss.videoThumbnailContainer}>
                    <ImagePreview
                      thumbnailImage={thumbnailImage}
                      metadata={null}
                    />
                    <div className={ss.thumbnailOverlay}>
                      <button
                        className={ss.removeImageButton}
                        onClick={() => setThumbnailImage(null)}
                        type="button"
                        aria-label="Remove thumbnail"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                )}

                {contentType === 'image' && (
                  <ImageUploader
                    onImageSelect={(imageData) => {
                      console.log('ImageUploader onImageSelect called:', imageData);
                      setPastedContent(imageData);
                      
                      // 이미지가 삭제된 경우 (빈 문자열이 전달됨)
                      if (imageData === '') {
                        console.log('Image was removed, setting thumbnailImage to null');
                        setThumbnailImage(null);
                      }
                    }}
                    onThumbnailChange={(thumbnailData) => {
                      console.log('ImageUploader onThumbnailChange called:', thumbnailData);
                      setThumbnailImage(thumbnailData);
                      
                      // 썸네일 변경 후 유효성 검사 상태 확인
                      setTimeout(() => {
                        console.log('After thumbnail change - isContentValid:', isContentValid());
                      }, 100);
                    }}
                  />
                )}

                {contentType === 'code' && (
                  <CodeUploader
                    onCodeChange={setCode}
                    onLanguageChange={setLanguage}
                    initialCode={code}
                    initialLanguage={language}
                  />
                )}

                {contentType === 'video' && (
                  <VideoUploader
                    onVideoSelect={(videoData) => {
                      console.log('VideoUploader onVideoSelect called:', videoData);
                      if (videoData && videoData.url) {
                        setPastedContent(videoData.url);
                        console.log('Setting pastedContent to:', videoData.url);
                      } else if (videoData && videoData.originalUrl) {
                        // URL이 없는 경우 원본 URL 사용
                        setPastedContent(videoData.originalUrl);
                        console.log('Setting pastedContent to original URL:', videoData.originalUrl);
                      }
                      
                      // 썸네일 이미지 처리 - 선택적으로 설정
                      if (videoData && videoData.thumbnailUrl) {
                        console.log('비디오에 썸네일 URL이 있음:', videoData.thumbnailUrl);
                        // 썸네일 이미지가 있으면 설정 (선택 사항)
                        const img = new Image();
                        img.onload = () => {
                          setThumbnailImage({
                            src: videoData.thumbnailUrl,
                            width: img.width,
                            height: img.height
                          });
                          console.log('Thumbnail image loaded successfully');
                        };
                        img.onerror = () => {
                          console.error('썸네일 이미지 로드 실패:', videoData.thumbnailUrl);
                          // 썸네일 로드 실패해도 비디오 유효성에는 영향 없음
                        };
                        img.src = videoData.thumbnailUrl;
                      } else {
                        console.log('비디오에 썸네일 URL이 없음');
                      }
                    }}
                    initialUrl={pastedContent} // 초기 URL 전달
                  />
                )}

                {contentType === 'music' && (
                  <MusicUploader
                    onMusicSelect={(musicData) => {
                      console.log('MusicUploader onMusicSelect called:', musicData);
                      if (musicData && musicData.url) {
                        setPastedContent(musicData.url);
                        console.log('Setting pastedContent to music URL:', musicData.url);
                      }
                      
                      // 음악 타입 유효성 검사 즉시 실행
                      setTimeout(() => {
                        console.log('Music content validation after update:', isContentValid());
                      }, 100);
                    }}
                    initialUrl={pastedContent} // 초기 URL 전달
                  />
                )}

                <TagEditor
                  tags={tags}
                  onTagsChange={setTags}
                />

                <DescriptionEditor
                  description={description}
                  onChange={setDescription}
                />

                <LocationInput
                  location={location}
                  onLocationChange={setLocation}
                />
              </>
            </div>

            <div className={ss.modalFooter}>
              <div className={ss.buttonContainer}>
                {showCancelConfirm ? (
                  <>
                    <div className={ss.cancelWarningMessage}>
                      All your work in progress will be <span className={ss.highlight}>permanently deleted.</span> <br /> Are you absolutely sure you want to proceed? This action <span className={ss.highlight}>cannot be undone.</span>
                    </div>
                    <div className={ss.buttonActions}>
                      <button
                        className={ss.backToEditButton}
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Back to Edit
                      </button>
                      <button
                        className={ss.closeButton}
                        onClick={handleConfirmCancel}
                      >
                        Do Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {!isLoggedIn && (
                      <div className={ss.loginWarningMessage}>
                        For the safety, security, and policies of Hyper, <br /> please <Link to="/login" className={ss.loginHighlight}>login</Link> or <Link to="/signup" className={ss.loginHighlight}>sign up</Link> to access your content.
                      </div>
                    )}
                    <div className={ss.buttonActions}>
                      {isLoggedIn && (
                        <button
                          className={ss.previewButton}
                          onClick={() => {/* Preview 기능 구현 */ }}
                        >
                          Preview
                        </button>
                      )}
                      <button
                        className={ss.publishButton}
                        onClick={handleAdd}
                        disabled={!isValid || isLoading}
                      >
                        {isLoggedIn ? (
                          isLoading ? (
                            <div className={ss.publishButtonSpinner}></div>
                          ) : (
                            isAIEnabled ? 'Flight with Hyper AI' : 'Flight'
                          )
                        ) : (
                          'Preview'
                        )}
                      </button>
                      <button
                        className={ss.closeButton}
                        onClick={handleCancelClick}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCollectionSelector && (
        <CollectionSelector
          isOpen={showCollectionSelector}
          onClose={() => setShowCollectionSelector(false)}
          onSelect={handleCollectionSelect}
          initialSelectedCollections={selectedCollections}
        />
      )}

      {contentType === 'link' && (
        <MetadataFetcher
          url={pastedContent}
          onMetadataChange={handleMetadataChange}
        />
      )}

      {minimizedModals.map((modal, index) => (
        <MinimizedModal
          key={modal.id}
          modalId={modal.id}
          contentType={modal.contentType}
          selectedCollections={modal.selectedCollections}
          title={modal.title}
          pastedContent={modal.pastedContent}
          index={index}
          onMaximize={handleMaximize}
          onRemove={handleRemoveModal}
        />
      ))}

      {/* 클립보드 알림 추가 */}
      {showNotification && detectedType && (
        <ClipboardNotification
          contentType={detectedType}
          show={showNotification}
          onClose={handleCloseNotification}
          autoHideDuration={3000}
        />
      )}
    </div>
  )
})

export default PasteModal;