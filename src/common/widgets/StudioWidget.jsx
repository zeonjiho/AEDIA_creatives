import React from 'react';
import Widget from '../Widget';
import styles from './StudioWidget.module.css';
import { FaBuilding, FaVideo, FaFilm, FaCamera, FaHeadphones } from 'react-icons/fa';

/**
 * 스튜디오 현황 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.rooms - 스튜디오 룸 목록
 * @param {Array} props.reservations - 예약 목록
 * @param {Function} props.onReservationClick - 예약하기 클릭 함수
 * @returns {JSX.Element}
 */
const StudioWidget = ({
  rooms = [],
  reservations = [],
  onReservationClick
}) => {
  // 스튜디오 타입에 따른 아이콘 매핑
  const getStudioIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <FaVideo className={styles.room_type_icon} />;
      case 'film':
        return <FaFilm className={styles.room_type_icon} />;
      case 'photo':
        return <FaCamera className={styles.room_type_icon} />;
      case 'audio':
        return <FaHeadphones className={styles.room_type_icon} />;
      default:
        return null;
    }
  };

  // 현재 시간에 예약된 상태인지 확인
  const isRoomOccupied = (roomId) => {
    const now = new Date();
    return reservations.some(res => {
      const start = new Date(res.start);
      const end = new Date(res.end);
      return res.roomId === roomId && now >= start && now <= end;
    });
  };

  // 현재 예약 정보 가져오기
  const getCurrentReservation = (roomId) => {
    const now = new Date();
    return reservations.find(res => {
      const start = new Date(res.start);
      const end = new Date(res.end);
      return res.roomId === roomId && now >= start && now <= end;
    });
  };

  return (
    <Widget
      icon={<FaBuilding />}
      title="Studio Status"
      footerText="예약하기"
      onFooterClick={onReservationClick}
    >
      <div className={styles.rooms_grid}>
        {rooms.map(room => {
          const currentReservation = getCurrentReservation(room.id);
          const occupied = !!currentReservation;
          
          return (
            <div key={room.id} className={styles.room_item}>
              <div className={styles.room_header}>
                {getStudioIcon(room.type)}
                <h3 className={styles.room_name}>{room.name}</h3>
              </div>
              
              {occupied ? (
                <div className={styles.room_status_occupied}>
                  사용 중
                  {currentReservation && (
                    <span className={styles.reservation_time}>
                      ({new Date(currentReservation.start).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} - 
                      {new Date(currentReservation.end).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })})
                    </span>
                  )}
                </div>
              ) : (
                <div className={styles.room_status_available}>사용 가능</div>
              )}
              
              {room.features && (
                <div className={styles.room_features}>
                  {room.features.map((feature, index) => (
                    <span key={index} className={styles.feature_tag}>{feature}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Widget>
  );
};

export default StudioWidget; 