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
  // 기본 색상 맵 정의
  const colorMap = {
    1: '#4285F4', // 파랑
    2: '#EA4335', // 빨강
    3: '#34A853', // 초록
    4: '#FBBC05', // 노랑
    5: '#8E24AA', // 보라
    6: '#16A2B8', // 청록
    7: '#FF9800', // 주황
    8: '#607D8B', // 회색
    9: '#795548', // 갈색
    10: '#009688', // 청록
  };

  // 이벤트 색상 가져오기
  const getEventColor = (event) => {
    const colorTag = event?.resource?.colorTag || 1;
    return colorMap[colorTag] || colorMap[1];
  };

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
                style={{ borderLeft: `4px solid ${getEventColor(event)}` }}
              >
                <div className={styles.eventTitle}>{event.title}</div>
                {event.start && event.end && (
                  <div className={styles.eventTime}>
                    <FaRegClock className={styles.icon} />
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </div>
                )}
                {event.resource?.location && (
                  <div className={styles.eventLocation}>
                    <FaMapMarkerAlt className={styles.icon} />
                    {event.resource.location}
                  </div>
                )}
                {event.resource?.participants && event.resource.participants.length > 0 && (
                  <div className={styles.eventParticipants}>
                    <FaUsers className={styles.icon} />
                    {event.resource.participants.length}명 참석
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