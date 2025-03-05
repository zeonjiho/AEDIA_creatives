import React, { useRef, useEffect } from 'react';
import Widget from '../Widget';
import styles from './NotificationWidget.module.css';
import { FaBell } from 'react-icons/fa';

/**
 * 알림 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.notifications - 알림 목록
 * @param {Function} props.onViewAllClick - '모든 알림 보기' 클릭 함수
 * @param {string} props.title - 위젯 제목
 * @param {React.ReactNode} props.icon - 위젯 아이콘
 * @returns {JSX.Element}
 */
const NotificationWidget = ({
  notifications = [],
  onViewAllClick,
  title = '알림',
  icon = <FaBell />
}) => {
  const notificationsRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const notificationsElement = e.target;
    if (notificationsElement) {
      notificationsElement.classList.add('scrolling');
      
      // 이전 타임아웃 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 3초 후에 scrolling 클래스 제거
      scrollTimeoutRef.current = setTimeout(() => {
        if (notificationsElement) {
          notificationsElement.classList.remove('scrolling');
        }
      }, 3000);
    }
  };
  
  // 컴포넌트 마운트 시 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const notificationsElement = notificationsRef.current;
    
    if (notificationsElement) {
      notificationsElement.addEventListener('scroll', handleScroll);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 타임아웃 정리
    return () => {
      if (notificationsElement) {
        notificationsElement.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Widget 
      title={title} 
      icon={icon} 
      footerText="모든 알림 보기" 
      onFooterClick={onViewAllClick}
    >
      <div className={styles.notifications} ref={notificationsRef}>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <div 
              key={index} 
              className={`${styles.notification_item} ${notification.read ? styles.read : styles.unread}`}
            >
              <div className={styles.notification_header}>
                <h4 className={styles.notification_title}>{notification.title}</h4>
                <span className={`${styles.notification_type} ${styles[`type_${notification.type}`]}`}>
                  {notification.type}
                </span>
              </div>
              <p className={styles.notification_text}>{notification.text}</p>
              <p className={styles.notification_time}>{notification.time}</p>
            </div>
          ))
        ) : (
          <div className={styles.no_notifications}>새로운 알림이 없습니다.</div>
        )}
      </div>
    </Widget>
  );
};

export default NotificationWidget; 