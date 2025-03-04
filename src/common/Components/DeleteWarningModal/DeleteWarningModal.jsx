import React, { useState, useEffect } from 'react';
import ss from './DeleteWarningModal.module.css';

const DeleteWarningModal = ({ onCancel, onConfirm, cardTitle, type }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onCancel, 300);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(onConfirm, 300);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getTitle = () => {
    return type === 'collection' ? 'Delete Collection' : 'Delete Hyperlink';
  };

  return (
    <>
      <div 
        className={`${ss.overlay} ${isClosing ? ss.closing : ''}`} 
        onClick={handleClose} 
      />
      <div 
        className={`${ss.deleteWarningModal} ${isClosing ? ss.closing : ''}`}
      >
        <h3 className={ss.warningTitle}>{getTitle()}</h3>
        <p className={ss.warningMessage}>
          Are you sure you want to delete <span className={ss.highlightText}>{cardTitle}</span>?<br />
          This action cannot be undone.
        </p>
        <div className={ss.warningButtons}>
          <button 
            className={`${ss.warningButton} ${ss.cancelButton}`}
            onClick={handleClose}
          >
            No, Cancel
          </button>
          <button 
            className={`${ss.warningButton} ${ss.confirmButton}`}
            onClick={handleConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteWarningModal; 