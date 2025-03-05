import React from 'react';
import styles from './EventsModal.module.css';
import { FaTimes, FaRegClock, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

/**
 * 이벤트 목록 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {Object} props.position - 모달 위치 (x, y 좌표)
 * @param {Array} props.events - 표시할 이벤트 목록
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onEventSelect - 이벤트 선택 핸들러
 * @param {Date} props.date - 선택된 날짜
 * @returns {JSX.Element}
 */
const EventsModal = ({ 
  position, 
  events, 
  onClose, 
  onEventSelect, 
  date
}) => {
  // 날짜 포맷 함수
  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ko-KR', options);
  };

  // 시간 포맷 함수
  const formatTime = (date) => {
    if (!date) return '';
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('ko-KR', options);
  };

  return (
    <div 
      className={styles.eventsModal} 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, 10px)'
      }}
    >
      <div className={styles.eventsModalContent}>
        <div className={styles.eventsModalHeader}>
          <h3>{formatDate(date)}</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className={styles.eventsContainer}>
          {events.length === 0 ? (
            <div className={styles.noEvents}>
              <p>일정이 없습니다.</p>
            </div>
          ) : (
            events.map(event => (
              <div 
                key={event.id} 
                className={styles.eventItem}
                onClick={() => onEventSelect(event)}
                style={{ borderLeft: `4px solid ${event.color}` }}
              >
                <div className={styles.eventTitle}>{event.title}</div>
                {event.start && event.end && (
                  <div className={styles.eventTime}>
                    <FaRegClock className={styles.icon} />
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </div>
                )}
                {event.location && (
                  <div className={styles.eventLocation}>
                    <FaMapMarkerAlt className={styles.icon} />
                    {event.location}
                  </div>
                )}
                {event.participants && event.participants.length > 0 && (
                  <div className={styles.eventParticipants}>
                    <FaUsers className={styles.icon} />
                    {event.participants.length}명 참석
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsModal; 