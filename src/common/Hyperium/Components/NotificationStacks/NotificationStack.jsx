import React from 'react';
import styles from './NotificationStack.module.css';

const NotificationStack = ({ notifications, onClose }) => {
  const formatMessage = (message) => {
    if (message.startsWith('Added to')) {
      const [prefix, ...rest] = message.split('Added to ');
      return (
        <>
          <span className={styles.notificationPrefix}>Added to </span>
          <span className={styles.notificationHighlight}>{rest.join('')}</span>
        </>
      );
    }
    return message;
  };

  return (
    <div className={styles.notificationStack}>
      {notifications?.map(notification => (
        <div 
          key={notification.id} 
          className={`${styles.notificationItem} ${notification.isCancelled ? styles.cancelled : ''}`}
        >
          <div className={styles.notificationContent}>
            <span className={styles.notificationMessage}>
              {formatMessage(notification.message)}
            </span>
            <button 
              className={styles.notificationClose}
              onClick={() => onClose(notification.id)}
            >
              {notification.isCancelled ? 'Cancelled' : 'Cancel'}
            </button>
          </div>
          {!notification.isCancelled && <div className={styles.notificationProgress} />}
        </div>
      ))}
    </div>
  );
};

export default NotificationStack; 