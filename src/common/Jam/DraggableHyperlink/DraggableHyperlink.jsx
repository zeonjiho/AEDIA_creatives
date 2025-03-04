import React, { useState } from 'react';
import styles from './DraggableHyperlink.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import HyperlinkCard from '../HyperlinkCard/HyperlinkCard';

const DraggableHyperlink = ({ data, onDragStart }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    
    const dragImage = document.createElement('div');
    dragImage.classList.add(styles.dragImage);
    dragImage.innerHTML = `
      <div class="${styles.dragImageContent}">
        <span>${data?.title || 'Untitled'}</span>
      </div>
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    if (onDragStart) {
      onDragStart(data);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`${styles.draggableItem} ${isDragging ? styles.dragging : ''}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.dragHandle}>
        <FontAwesomeIcon icon={faGripVertical} />
      </div>
      <HyperlinkCard data={data} />
    </div>
  );
};

export default DraggableHyperlink; 