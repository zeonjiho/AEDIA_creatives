import React from 'react';
import PropTypes from 'prop-types';
import styles from './MultiDayEvent.module.css';

/**
 * 여러 날짜에 걸친 이벤트를 표시하는 컴포넌트
 * 주 경계를 넘어가는 이벤트를 자연스럽게 연결하여 표시합니다
 */
const MultiDayEvent = ({
  event,
  leftPercent,
  widthPercent,
  rowIndex,
  continuesPrevWeek,
  continuesNextWeek,
  isRealStart,
  isRealEnd,
  projectName,
  assigneeText,
  statusColor,
  onClick
}) => {
  // 주 경계 연결을 위한 스타일 계산
  const eventStyle = {
    backgroundColor: event.color,
    borderTopColor: statusColor,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    zIndex: 10 + rowIndex // 기본 z-index 설정
  };

  // 주 경계 연결을 위한 추가 속성
  if (continuesPrevWeek || continuesNextWeek) {
    eventStyle.zIndex = 20 + rowIndex; // 연결된 이벤트의 z-index 높임
  }

  // 주 경계에서 이벤트가 끊어지지 않도록 확장
  if (continuesPrevWeek) {
    eventStyle.width = `calc(${widthPercent}% + 10px)`; // 확장 너비 증가
    eventStyle.left = `-8px`; // 왼쪽으로 더 이동
  }

  if (continuesNextWeek) {
    eventStyle.width = `calc(${widthPercent}% + 10px)`; // 확장 너비 증가
  }

  // 클래스명 계산
  const classNames = [
    styles.eventCard,
    styles.multiDayEvent,
    continuesPrevWeek ? styles.continuesPrevWeek : '',
    continuesNextWeek ? styles.continuesNextWeek : '',
    isRealStart ? styles.eventStart : '',
    isRealEnd ? styles.eventEnd : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={eventStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
    >
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventDetails}>
        <div className={styles.eventProject}>{projectName}</div>
        <div className={styles.eventAssignee}>{assigneeText}</div>
      </div>
    </div>
  );
};

MultiDayEvent.propTypes = {
  event: PropTypes.object.isRequired,
  leftPercent: PropTypes.number.isRequired,
  widthPercent: PropTypes.number.isRequired,
  rowIndex: PropTypes.number.isRequired,
  continuesPrevWeek: PropTypes.bool,
  continuesNextWeek: PropTypes.bool,
  isRealStart: PropTypes.bool,
  isRealEnd: PropTypes.bool,
  projectName: PropTypes.string.isRequired,
  assigneeText: PropTypes.string.isRequired,
  statusColor: PropTypes.string,
  onClick: PropTypes.func.isRequired
};

MultiDayEvent.defaultProps = {
  continuesPrevWeek: false,
  continuesNextWeek: false,
  isRealStart: false,
  isRealEnd: false,
  statusColor: 'transparent'
};

export default MultiDayEvent; 