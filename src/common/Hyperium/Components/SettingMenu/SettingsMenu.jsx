import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ss from './SettingsMenu.module.css';
import ReportForm from '../ReportForm';

const SettingsMenu = ({ isOpen, position, onClose, onAction, card, currentUserId }) => {
  const [menuStyle, setMenuStyle] = useState({});
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    if (!isOpen || !position) return;
    
    const { x, y } = position;
    const menuElement = document.createElement('div');
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    
    menuElement.className = ss.settingsMenu;
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
        : `${newY}px`
    });
    
  }, [isOpen, position]);

  // 리포트 버튼 클릭 처리
  const handleReportClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 메뉴 닫기
    onClose();
    
    // 리포트 폼 표시
    setShowReportForm(true);
  };

  // 리포트 폼 닫기 처리
  const handleReportFormClose = () => {
    setShowReportForm(false);
  };

  // 리포트 폼 제출 처리
  const handleReportSubmit = (reportData) => {
    console.log('Report submitted:', reportData);
    // API 호출 등의 로직 추가
    setShowReportForm(false);
  };

  // Don't render if menu is not open
  if (!isOpen) return null;

  // Check if user is owner
  const isOwner = Boolean(
    currentUserId && 
    card?.poster?._id && 
    String(currentUserId) === String(card.poster._id)
  );

  return (
    <>
      {ReactDOM.createPortal(
        <div 
          className={`${ss.settingsMenu} ${isOpen ? ss.visible : ''}`}
          style={menuStyle}
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={handleReportClick}
            className={ss.settingsMenuItem}
          >
            Report
          </button>
          
          {isOwner && (
            <div className={ss.ownerOptions}>
              <button 
                onClick={(e) => onAction(e, card, 'archive')}
                className={ss.settingsMenuItem}
              >
                Archive
              </button>

              <button 
                onClick={(e) => onAction(e, card, 'label')}
                className={ss.settingsMenuItem}
              >
                Labels
              </button>

              <button 
                onClick={(e) => onAction(e, card, 'edit')}
                className={ss.settingsMenuItem}
              >
                Edit
              </button>
              
              <button 
                onClick={(e) => onAction(e, card, 'delete')}
                className={`${ss.settingsMenuItem} ${ss.deleteButton}`}
              >
                Delete
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {showReportForm && (
        <ReportForm 
          isOpen={showReportForm}
          onClose={handleReportFormClose}
          card={card}
          onSubmit={handleReportSubmit}
        />
      )}
    </>
  );
};

export default SettingsMenu; 