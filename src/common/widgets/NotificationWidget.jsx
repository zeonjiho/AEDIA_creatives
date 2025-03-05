import React from 'react';
import Widget from '../Widget';
import styles from './NotificationWidget.module.css';
import { FaBell } from 'react-icons/fa';

/**
 * 알림 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.notifications - 알림 목록
 * @param {Function} props.onViewAllClick - '모든 알림 보기' 클릭 함수
 * @returns {JSX.Element}
 */
const NotificationWidget = ({
  notifications = [],
  onViewAllClick
}) => {
  return (
    <Widget
      icon={<FaBell />}
      title="Notifications"
      footerText="모든 알림 보기"
      onFooterClick={onViewAllClick}
    >
      <div className={styles.notifications}>
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`${styles.notification_item} ${notification.read ? styles.read : ''}`}
          >
            <div className={styles.notification_header}>
              <h3 className={styles.notification_title}>{notification.title}</h3>
              {notification.type && (
                <span className={`${styles.notification_type} ${styles["type_" + notification.type.toLowerCase().replace(/\s+/g, '_')]}`}>
                  {notification.type}
                </span>
              )}
            </div>
            
            <p className={styles.notification_text}>{notification.message}</p>
            
            <p className={styles.notification_time}>
              {new Date(notification.createdAt).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true    
              })}
            </p>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <p className={styles.no_notifications}>새로운 알림이 없습니다.</p>
        )}
      </div>
    </Widget>
  );
};

export default NotificationWidget; 