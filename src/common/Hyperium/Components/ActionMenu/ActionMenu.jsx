import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ss from './ActionMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faLink, 
  faShare, 
  faPaperPlane 
} from '@fortawesome/free-solid-svg-icons';

const ActionMenu = ({ isOpen, position, onClose, onAction, card }) => {
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!isOpen || !position) return;
    
    const { x, y } = position;
    const menuElement = document.createElement('div');
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    
    menuElement.className = ss.actionMenu;
    document.body.appendChild(menuElement);
    const menuHeight = menuElement.offsetHeight;
    document.body.removeChild(menuElement);

    // 버튼 바로 아래, 우측 정렬되도록 조정
    const newY = y + scrollY + 5;

    const isOverflowingBottom = (y + menuHeight) > windowHeight;

    setMenuStyle({
      position: 'absolute',
      left: `${x - 140}px`,
      top: isOverflowingBottom 
        ? `${newY - menuHeight - 10}px` 
        : `${newY}px`,
      zIndex: 9999
    });
    
  }, [isOpen, position]);

  // Don't render if menu is not open
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className={`${ss.actionMenu} ${isOpen ? ss.visible : ''}`}
      style={menuStyle}
      onClick={e => e.stopPropagation()}
    >
      {/* 컬렉션에 추가 */}
      <button 
        onClick={(e) => onAction(e, card, 'collection')}
        className={ss.actionMenuItem}
      >
        <FontAwesomeIcon icon={faPlus} className={ss.actionIcon} />
        <span>Add to Collection</span>
      </button>
      
      {/* 링크 복사 */}
      <button 
        onClick={(e) => onAction(e, card, 'copy')}
        className={ss.actionMenuItem}
      >
        <FontAwesomeIcon icon={faLink} className={ss.actionIcon} />
        <span>Copy Link</span>
      </button>
      
      {/* 공유하기 */}
      <button 
        onClick={(e) => onAction(e, card, 'share')}
        className={ss.actionMenuItem}
      >
        <FontAwesomeIcon icon={faShare} className={ss.actionIcon} />
        <span>Share</span>
      </button>
      
      {/* 메시지 보내기 */}
      <button 
        onClick={(e) => onAction(e, card, 'message')}
        className={ss.actionMenuItem}
      >
        <FontAwesomeIcon icon={faPaperPlane} className={ss.actionIcon} />
        <span>Send Message</span>
      </button>
    </div>,
    document.body
  );
};

export default ActionMenu; 