import React, { useState, useRef, useEffect } from 'react'
import ss from './TypeSelector.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLink, 
  faImage, 
  faCode,
  faVideo,
  faMusic,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons'

const TypeSelector = ({ contentType, onTypeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const contentTypes = [
    { id: 'link', icon: faLink, label: 'Link' },
    { id: 'image', icon: faImage, label: 'Image' },
    { id: 'video', icon: faVideo, label: 'Video' },
    { id: 'music', icon: faMusic, label: 'Music' },
    { id: 'code', icon: faCode, label: 'Code' }
  ]
  
  // 현재 선택된 타입 찾기
  const currentType = contentTypes.find(type => type.id === contentType) || contentTypes[0];
  
  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 타입 선택 핸들러
  const handleTypeSelect = (typeId) => {
    onTypeChange(typeId);
    setIsOpen(false);
  };

  return (
    <div className={ss.typeSelector} ref={dropdownRef}>
      <button 
        className={ss.typeSelectorButton} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={currentType.icon} className={ss.currentTypeIcon} />
        <span className={ss.currentTypeLabel}>{currentType.label}</span>
        <FontAwesomeIcon icon={faChevronDown} className={ss.dropdownIcon} />
      </button>
      
      {isOpen && (
        <div className={ss.dropdownMenu}>
          {contentTypes.map(type => (
            <button
              key={type.id}
              className={`${ss.dropdownItem} ${contentType === type.id ? ss.selected : ''}`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <FontAwesomeIcon icon={type.icon} className={ss.typeIcon} />
              <span className={ss.typeLabel}>{type.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TypeSelector; 