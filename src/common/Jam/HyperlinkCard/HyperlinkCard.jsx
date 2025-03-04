import React from 'react';
import styles from './HyperlinkCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLayerGroup, 
  faHeart, 
  faBoxArchive,
  faLink,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import defaultProfileImage from '../../../Assets/default-profile.svg';
import getAvatarImage from '../../../util/getAvatarImage';
import getThumbnailImage from '../../../util/getThumbnailImage';

const HyperlinkCard = ({ data, onDragStart, isCanvasElement = false, onElementClick }) => {
  const getIcon = () => {
    switch (data?.type) {
      case 'collection':
        return faLayerGroup;
      case 'like':
        return faHeart;
      case 'post':
        return faBoxArchive;
      default:
        return faLink;
    }
  };

  const handleDragStart = (e) => {
    if (isCanvasElement) {
      e.preventDefault();
      return;
    }
    
    e.stopPropagation();
    
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
    
    const dragImage = document.createElement('div');
    dragImage.classList.add(styles.dragImage);
    dragImage.innerHTML = `<div class="${styles.dragImageContent}">
      <span>${data?.title || 'Untitled'}</span>
    </div>`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
    
    if (onDragStart) onDragStart(data);
  };
  
  const handleClick = () => {
    if (isCanvasElement && onElementClick) {
      onElementClick(data);
    }
  };

  if (isCanvasElement) {
    return (
      <div 
        className={`${styles.canvasCard} ${data?.url ? styles.hasLink : ''}`}
        onClick={handleClick}
      >
        {data?.thumbnail && (
          <div className={styles.thumbnailContainer}>
            <img 
              src={getThumbnailImage(data.thumbnail, 'mini')} 
              alt={data?.title || 'Thumbnail'} 
              className={styles.thumbnail}
            />
          </div>
        )}
        
        <div className={styles.canvasCardContent}>
          <div className={styles.canvasCardHeader}>
            <div className={styles.canvasCardTitle}>{data?.title || 'Untitled'}</div>
            {data?.url && (
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
                onClick={(e) => e.stopPropagation()}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
              </a>
            )}
          </div>
          
          {data?.description && (
            <div className={styles.canvasCardDescription}>
              {data.description}
            </div>
          )}
          
          <div className={styles.canvasCardFooter}>
            <div className={styles.posterInfo}>
              <img 
                src={data?.poster?.avatar ? getAvatarImage(data.poster.avatar) : defaultProfileImage}
                alt={data?.poster?.userName || 'User'}
                className={styles.posterAvatar}
              />
              <span className={styles.posterName}>@{data?.poster?.userName || 'anonymous'}</span>
            </div>
            <div className={styles.canvasCardType}>
              <FontAwesomeIcon icon={getIcon()} />
              <span>{data?.type || 'link'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.card} 
      draggable="true"
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {data?.thumbnail && (
        <div className={styles.cardThumbnail}>
          <img 
            src={getThumbnailImage(data.thumbnail, 'mini')} 
            alt={data?.title || 'Thumbnail'} 
          />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.cardInfo}>
          <div className={styles.title}>{data?.title || 'Untitled'}</div>
          <div className={styles.posterInfo}>
            <img 
              src={data?.poster?.avatar ? getAvatarImage(data.poster.avatar) : defaultProfileImage}
              alt={data?.poster?.userName || 'User'}
              className={styles.posterAvatar}
            />
            <span className={styles.posterName}>@{data?.poster?.userName || 'anonymous'}</span>
          </div>
        </div>
        <div className={styles.icon}>
          <FontAwesomeIcon icon={getIcon()} />
        </div>
      </div>
    </div>
  );
};

export default HyperlinkCard; 