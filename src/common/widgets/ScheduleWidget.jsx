import React from 'react';
import Widget from '../Widget';
import styles from './ScheduleWidget.module.css';
import { FaCalendarAlt } from 'react-icons/fa';

/**
 * 일정 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.events - 일정 목록
 * @param {Function} props.onViewAllClick - '모든 일정 보기' 클릭 함수
 * @returns {JSX.Element}
 */
const ScheduleWidget = ({
  events = [],
  onViewAllClick
}) => {
  return (
    <Widget
      icon={<FaCalendarAlt />}
      title="Today's Schedule"
      footerText="모든 일정 보기"
      onFooterClick={onViewAllClick}
    >
      {events.length > 0 ? (
        <div className={styles.events_list}>
          {events.map(event => (
            <div key={event.id} className={styles.event_item}>
              <div className={styles.event_time}>
                {new Date(event.start).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              <div className={styles.event_details}>
                <h3 className={styles.event_title}>{event.title}</h3>
                {event.location && <p className={styles.event_location}>{event.location}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.no_events}>오늘 예정된 일정이 없습니다.</p>
      )}
    </Widget>
  );
};

export default ScheduleWidget; 