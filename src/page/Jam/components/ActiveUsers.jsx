import React, { useState, useEffect, useRef } from 'react';
import styles from '../Jam.module.css';

const ActiveUsers = ({ users = [] }) => {
  const [showMore, setShowMore] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  
  // 한 줄에 표시할 최대 사용자 수
  const maxVisibleUsers = 5;
  
  const hasMoreUsers = users.length > maxVisibleUsers;
  const visibleUsers = showMore ? users : users.slice(0, maxVisibleUsers);

  useEffect(() => {
    if (users.length <= maxVisibleUsers) {
      setShowMore(false);
    }
  }, [users]);

  const handleMouseMove = (e, userName) => {
    setTooltipStyle({
      top: `${e.clientY + 10}px`,
      left: `${e.clientX + 10}px`,
    });
  };

  return (
    <div className={styles.activeUsers}>
      <div className={styles.usersList}>
        {visibleUsers.map((user, index) => (
          <div 
            key={user.id || index} 
            className={styles.userItem}
            onMouseMove={(e) => handleMouseMove(e, user.name)}
          >
            <div 
              className={styles.userAvatar} 
              style={{ 
                backgroundColor: user.color || '#' + Math.floor(Math.random()*16777215).toString(16)
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span 
              className={styles.userName}
              style={tooltipStyle}
            >
              {user.name || 'Anonymous'}
            </span>
          </div>
        ))}
        
        {hasMoreUsers && !showMore && (
          <button 
            className={styles.moreUsersButton}
            onClick={() => setShowMore(true)}
            title="Show more"
          >
            +{users.length - maxVisibleUsers}
          </button>
        )}
        
        {showMore && (
          <button 
            className={styles.moreUsersButton}
            onClick={() => setShowMore(false)}
            title="Show less"
          >
            -
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveUsers; 