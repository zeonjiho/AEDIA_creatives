import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './HyperExtensions.module.css';

const HyperExtensions = ({ isVisible, onDrop, onClose }) => {
  if (!isVisible) return null;

  const handleDragEnter = (e) => {
    e.preventDefault();
    const draggedElement = document.querySelector('[draggable="true"]');
    if (draggedElement) {
      draggedElement.style.transform = 'scale(0.3)';
      draggedElement.style.opacity = '0.8';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const draggedElement = document.querySelector('[draggable="true"]');
    if (draggedElement) {
      draggedElement.style.transform = '';
      draggedElement.style.opacity = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onDrop(cardId);
    }
    const draggedElement = document.querySelector('[draggable="true"]');
    if (draggedElement) {
      draggedElement.style.transform = '';
      draggedElement.style.opacity = '';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={styles.container}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={styles.content}>
        <FontAwesomeIcon icon={faPlus} />
        <span>드래그하여 추가</span>
      </div>
      <button 
        className={styles.closeButton} 
        onClick={handleClose}
        type="button"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
};

export default HyperExtensions; 