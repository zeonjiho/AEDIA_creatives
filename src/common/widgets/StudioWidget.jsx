import React, { useRef, useEffect } from 'react';
import Widget from '../Widget';
import styles from './StudioWidget.module.css';
import { FaBuilding } from 'react-icons/fa';

/**
 * 스튜디오 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.rooms - 스튜디오 룸 목록
 * @param {Array} props.reservations - 예약 목록
 * @param {Function} props.onReservationClick - 예약 버튼 클릭 함수
 * @param {string} props.title - 위젯 제목
 * @param {React.ReactNode} props.icon - 위젯 아이콘
 * @returns {JSX.Element}
 */
const StudioWidget = ({
  rooms = [],
  reservations = [],
  onReservationClick,
  title = 'Rooms',
  icon = <FaBuilding />
}) => {
  const roomsGridRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const gridElement = e.target;
    if (gridElement) {
      gridElement.classList.add('scrolling');
      
      // 이전 타임아웃 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 3초 후에 scrolling 클래스 제거
      scrollTimeoutRef.current = setTimeout(() => {
        if (gridElement) {
          gridElement.classList.remove('scrolling');
        }
      }, 3000);
    }
  };
  
  // 컴포넌트 마운트 시 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const gridElement = roomsGridRef.current;
    
    if (gridElement) {
      gridElement.addEventListener('scroll', handleScroll);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 타임아웃 정리
    return () => {
      if (gridElement) {
        gridElement.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 스튜디오 타입에 따른 아이콘 매핑
  const getStudioIcon = (type) => {
    switch (type) {
      case 'recording':
        return '🎙️';
      case 'video':
        return '🎬';
      case 'photo':
        return '📸';
      default:
        return '🏢';
    }
  };
  
  // 현재 시간에 룸이 사용 중인지 확인
  const isRoomOccupied = (roomId) => {
    const now = new Date();
    return reservations.some(reservation => 
      String(reservation.roomId) === String(roomId) && 
      new Date(reservation.startTime) <= now && 
      new Date(reservation.endTime) > now
    );
  };
  
  // 현재 예약 정보 가져오기
  const getCurrentReservation = (roomId) => {
    const now = new Date();
    return reservations.find(reservation => 
      String(reservation.roomId) === String(roomId) && 
      new Date(reservation.startTime) <= now && 
      new Date(reservation.endTime) > now
    );
  };

  return (
    <Widget 
      title={title} 
      icon={icon} 
      footerText="예약하기" 
      onFooterClick={onReservationClick}
    >
      <div className={styles.rooms_grid} ref={roomsGridRef}>
        {rooms.map(room => {
          const currentReservation = getCurrentReservation(room._id || room.id);
          const occupied = !!currentReservation;
          
          return (
            <div key={room._id || room.id} className={styles.room_item}>
              <div className={styles.room_header}>
                <span className={styles.room_type_icon}>
                  {getStudioIcon(room.type)}
                </span>
                <h4 className={styles.room_name}>{room.roomName || room.name}</h4>
              </div>
              
              {occupied ? (
                <div className={styles.room_status_occupied}>
                  사용 중
                  <span className={styles.reservation_time}>
                    {new Date(currentReservation.endTime).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}까지
                  </span>
                </div>
              ) : (
                <div className={styles.room_status_available}>
                  사용 가능
                </div>
              )}
              
              <div className={styles.room_features}>
                {(room.tools || room.features) && (room.tools || room.features).map((feature, i) => (
                  <span key={i} className={styles.feature_tag}>{feature}</span>
                ))}
              </div>
            </div>
          );
        })}
        
        {rooms.length === 0 && (
          <div>사용 가능한 스튜디오가 없습니다.</div>
        )}
      </div>
    </Widget>
  );
};

export default StudioWidget; 