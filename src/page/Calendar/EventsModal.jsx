import React from 'react';
import styles from './EventModal.module.css';
import { FaTimes, FaRegClock, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

/**
 * 이벤트 목록 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.show - 모달 표시 여부
 * @param {Array} props.events - 표시할 이벤트 목록
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onEventClick - 이벤트 클릭 핸들러
 * @param {Date} props.date - 선택된 날짜
 * @param {Function} props.formatDate - 날짜 포맷팅 함수
 * @param {Function} props.formatTime - 시간 포맷팅 함수
 * @returns {JSX.Element}
 */
const EventsModal = ({ 
  show, 
  events, 
  onClose, 
  onEventClick, 
  date,
  formatDate,
  formatTime
}) => {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.eventsModal}`}>
        <div className={styles.modalHeader}>
          <h2>{formatDate(date)} 일정 목록</h2>
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
                className={styles.eventListItem}
                onClick={() => onEventClick(event)}
              >
                <div className={styles.eventListTime}>
                  <FaRegClock className={styles.eventIcon} />
                  {formatTime(event.start)} - {formatTime(event.end)}
                </div>
                <div className={styles.eventListTitle}>{event.title}</div>
                {event.location && (
                  <div className={styles.eventListLocation}>
                    <FaMapMarkerAlt className={styles.eventIcon} /> {event.location}
                  </div>
                )}
                {event.participants && (
                  <div className={styles.eventListParticipants}>
                    <FaUsers className={styles.eventIcon} /> {event.participants.length}명 참석
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