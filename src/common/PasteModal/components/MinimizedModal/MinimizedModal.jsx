import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLink, faImage, faCode, faLayerGroup, faVideo, faMusic } from '@fortawesome/free-solid-svg-icons'
import ss from './MinimizedModal.module.css'
import MetadataFetcher from '../MetadataFetcher/MetadataFetcher'

const MinimizedModal = ({ 
  onMaximize, 
  contentType, 
  selectedCollections = [],
  modalId, 
  index, 
  title, 
  pastedContent,
  onRemove 
}) => {
  const [metadata, setMetadata] = useState(null)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isConfirming, setIsConfirming] = useState(false)

  // 디버깅을 위한 useEffect 추가
  useEffect(() => {
    // console.log('MinimizedModal - selectedCollections 타입:', typeof selectedCollections);
    // console.log('MinimizedModal - selectedCollections 값:', JSON.stringify(selectedCollections, null, 2));
    // console.log('MinimizedModal - selectedCollections 배열 여부:', Array.isArray(selectedCollections));
    if (Array.isArray(selectedCollections)) {
      // console.log('MinimizedModal - selectedCollections 길이:', selectedCollections.length);
      if (selectedCollections.length > 0) {
        // console.log('MinimizedModal - 첫 번째 컬렉션:', JSON.stringify(selectedCollections[0], null, 2));
      }
    }
  }, [selectedCollections]);

  const handleMetadataChange = (newMetadata) => {
    setMetadata(newMetadata)
    if (!currentTitle && newMetadata?.title) {
      setCurrentTitle(newMetadata.title)
      // localStorage 업데이트
      const savedData = JSON.parse(localStorage.getItem('modalData') || '{}')
      if (savedData[modalId]) {
        savedData[modalId].title = newMetadata.title
        localStorage.setItem('modalData', JSON.stringify(savedData))
      }
    }
  }

  // localStorage에 데이터 저장
  React.useEffect(() => {
    try {
      // console.log('MinimizedModal - Saving to localStorage, selectedCollections:', JSON.stringify(selectedCollections, null, 2));
      const modalData = {
        contentType,
        selectedCollections,
        title,
        pastedContent,
      };
      localStorage.setItem(`minimizedModal_${modalId}`, JSON.stringify(modalData));
      // console.log('MinimizedModal - Saved to localStorage:', JSON.stringify(modalData, null, 2));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [contentType, selectedCollections, modalId, title, pastedContent]);

  const getTypeIcon = () => {
    switch(contentType) {
      case 'link': return faLink
      case 'image': return faImage
      case 'code': return faCode
      case 'video': return faVideo
      case 'music': return faMusic
      default: return faLink
    }
  }

  const getContentPreview = () => {
    if (!pastedContent) return 'Empty content';
    if (contentType === 'link') {
      try {
        const url = new URL(pastedContent);
        return url.hostname;
      } catch {
        return pastedContent.slice(0, 30);
      }
    }
    return pastedContent.slice(0, 30);
  }

  // 컬렉션 표시 텍스트 생성 - 개선된 버전
  const getCollectionDisplayText = () => {
    // console.log('getCollectionDisplayText - selectedCollections:', selectedCollections);
    
    // 배열 형태인지 확인
    if (Array.isArray(selectedCollections)) {
      // console.log('selectedCollections는 배열입니다.');
      if (selectedCollections.length === 0) {
        // console.log('selectedCollections 배열이 비어 있습니다.');
        return 'Select Collection'; // 빈 배열일 때 기본 텍스트 표시
      }
      
      if (selectedCollections.length === 1) {
        // console.log('selectedCollections 배열에 항목이 하나 있습니다:', selectedCollections[0]);
        // 객체 형태인지 확인
        if (typeof selectedCollections[0] === 'object' && selectedCollections[0]?.name) {
          // console.log('첫 번째 항목은 name 속성이 있는 객체입니다:', selectedCollections[0].name);
          return selectedCollections[0].name;
        } else {
          // console.log('첫 번째 항목은 name 속성이 없는 객체이거나 객체가 아닙니다.');
          return 'Collection';
        }
      }
      
      // console.log(`selectedCollections 배열에 ${selectedCollections.length}개 항목이 있습니다.`);
      return `${selectedCollections.length} Collections`;
    } 
    // 객체 형태인지 확인 (단일 컬렉션이 객체로 전달된 경우)
    else if (typeof selectedCollections === 'object' && selectedCollections !== null) {
      // console.log('selectedCollections는 객체입니다.');
      if (selectedCollections.name) {
        // console.log('selectedCollections 객체에 name 속성이 있습니다:', selectedCollections.name);
        return selectedCollections.name;
      }
      
      // Set 형태인지 확인 (이전 코드와의 호환성)
      if (selectedCollections instanceof Set) {
        // console.log('selectedCollections는 Set 객체입니다.');
        const size = selectedCollections.size;
        if (size === 0) return 'Select Collection';
        if (size === 1) return 'Collection';
        return `${size} Collections`;
      }
      
      // console.log('selectedCollections 객체에 name 속성이 없고 Set도 아닙니다.');
      return 'Collection';
    }
    
    // console.log('selectedCollections는 배열도 객체도 아닙니다.');
    return 'Select Collection'; // 기본값
  }

  const handleCancel = () => {
    setIsConfirming(true)
  }

  const handleConfirmDelete = () => {
    if (typeof onRemove === 'function') {
      localStorage.removeItem(`minimizedModal_${modalId}`);
      onRemove(modalId);
    } else {
      console.error('onRemove is not a function');
    }
  }

  const MODAL_HEIGHT = 2.75; // rem (최소 높이)
  const MODAL_GAP = 2.5; // rem (간격 줄임)
  const TOTAL_HEIGHT = MODAL_HEIGHT + MODAL_GAP;

  const collectionText = getCollectionDisplayText();
  
  // 디버깅 로그
  // console.log('Rendering MinimizedModal with collectionText:', collectionText);

  return (
    <div 
      className={`${ss.minimizedModal} ${isConfirming ? ss.confirmState : ''}`} 
      style={{
        bottom: `${index * TOTAL_HEIGHT}rem`
      }}
    >
      {!isConfirming ? (
        <>
          <div className={ss.content} onClick={() => onMaximize(modalId)}>
            <div className={ss.mainContent}>
              <div className={ss.collectionWrapper}>
                <FontAwesomeIcon icon={faLayerGroup} className={ss.collectionIcon} />
                <span className={ss.collectionName}>
                  {collectionText}
                </span>
              </div>
              <div className={ss.textContent}>
                <div className={ss.titleWrapper}>
                  <FontAwesomeIcon icon={getTypeIcon()} className={ss.typeIcon} />
                  <div className={`${ss.title} ${!title && ss.empty}`}>
                    {title || 'Empty title'}
                  </div>
                </div>
                <div className={`${ss.preview} ${!pastedContent && ss.empty}`}>
                  {getContentPreview()}
                </div>
              </div>
            </div>
          </div>
          <div className={ss.buttonGroup}>
            <button className={`${ss.button} ${ss.saveButton}`}>
              <span className={ss.buttonText}>SAVE</span>
            </button>
            <button 
              className={`${ss.button} ${ss.cancelButton}`}
              onClick={handleCancel}
            >
              <span className={ss.buttonText}>CANCEL</span>
            </button>
          </div>
        </>
      ) : (
        <div className={ss.confirmContent}>
          <p className={ss.confirmText}>Are you sure you want to delete?</p>
          <div className={ss.confirmButtons}>
            <button 
              className={`${ss.button} ${ss.deleteButton}`}
              onClick={handleConfirmDelete}
            >
              DELETE
            </button>
            <button 
              className={`${ss.button} ${ss.keepButton}`}
              onClick={() => setIsConfirming(false)}
            >
              KEEP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MinimizedModal 