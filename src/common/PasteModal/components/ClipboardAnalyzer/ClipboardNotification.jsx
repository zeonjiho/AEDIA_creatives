import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './ClipboardNotification.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLink, 
  faCode, 
  faImage, 
  faVideo, 
  faMusic, 
  faFileAlt,
  faCheckCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const ClipboardNotification = ({ 
  contentType, 
  show, 
  onClose,
  autoHideDuration = 3000 
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoHideDuration, onClose]);
  
  if (!visible) return null;
  
  // 콘텐츠 타입에 따른 아이콘과 메시지 설정
  let icon = faFileAlt;
  let message = '콘텐츠가 감지되었습니다';
  let typeText = '일반';
  
  switch (contentType) {
    case 'link':
      icon = faLink;
      message = '링크가 감지되었습니다';
      typeText = '링크';
      break;
    case 'code':
      icon = faCode;
      message = '코드가 감지되었습니다';
      typeText = '코드';
      break;
    case 'image':
      icon = faImage;
      message = '이미지가 감지되었습니다';
      typeText = '이미지';
      break;
    case 'video':
      icon = faVideo;
      message = '비디오가 감지되었습니다';
      typeText = '비디오';
      break;
    case 'music':
      icon = faMusic;
      message = '음악이 감지되었습니다';
      typeText = '음악';
      break;
    default:
      break;
  }
  
  return (
    <div className={styles.notification} data-type={contentType}>
      <div className={styles.iconContainer}>
        <FontAwesomeIcon icon={icon} className={styles.typeIcon} />
      </div>
      <div className={styles.content}>
        <div className={styles.title}>
          <FontAwesomeIcon icon={faCheckCircle} className={styles.checkIcon} />
          {typeText} 타입 감지됨
        </div>
        <div className={styles.message}>{message}</div>
      </div>
    </div>
  );
};

ClipboardNotification.propTypes = {
  contentType: PropTypes.oneOf(['link', 'code', 'image', 'video', 'music', 'text']).isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  autoHideDuration: PropTypes.number
};

export default ClipboardNotification; 