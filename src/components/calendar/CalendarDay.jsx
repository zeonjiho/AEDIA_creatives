import React from 'react';
import PropTypes from 'prop-types';
import styles from './CalendarDay.module.css';

/**
 * 캘린더 일자 컴포넌트
 * 단일 날짜 셀을 표시하고 해당 날짜의 일일 이벤트를 렌더링합니다.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.day - 날짜 정보
 * @param {number} props.dayIndex - 요일 인덱스
 * @param {number} props.weekIndex - 주 인덱스
 * @param {string} props.rangeClass - 날짜 범위 선택 클래스
 * @param {Array} props.dayEvents - 해당 날짜의 이벤트 목록
 * @param {Function} props.handleDragStart - 드래그 시작 핸들러
 * @param {Function} props.handleDragOver - 드래그 중 핸들러
 * @param {Function} props.handleDragEnd - 드래그 종료 핸들러
 * @param {Function} props.handleDateClick - 날짜 클릭 핸들러
 * @param {Function} props.handleEventSelect - 이벤트 선택 핸들러
 * @param {Function} props.getAssigneeNames - 담당자 이름 가져오기 함수
 * @param {Object} props.styles - 스타일 객체
 * @param {string} props.dataDate - 날짜 데이터 속성
 * @returns {JSX.Element}
 */
const CalendarDay = ({
    day,
    dayIndex,
    weekIndex,
    rangeClass,
    dayEvents,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDateClick,
    handleEventSelect,
    getAssigneeNames,
    styles,
    dataDate
}) => {
    return (
        <div
            className={`${styles.calendarDay} ${!day.isCurrentMonth ? styles.otherMonth : ''} ${day.isToday ? styles.today : ''} ${rangeClass}`}
            onMouseDown={handleDragStart}
            onMouseOver={handleDragOver}
            onMouseUp={handleDragEnd}
            onClick={handleDateClick}
            draggable={false}
            data-date={dataDate}
        >
            <div className={styles.dayNumber}>{day.date.getDate()}</div>
            <div className={styles.eventsList}>
                {dayEvents.slice(0, 3).map((event, idx) => (
                    <div 
                        key={`single-event-${event.id}-${idx}`}
                        className={styles.eventCard}
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEventSelect(event);
                        }}
                    >
                        <div className={styles.eventTitle}>{event.title}</div>
                        <div className={styles.eventAssignee}>
                            {event.assignees && event.assignees.length > 0 
                                ? getAssigneeNames(event.assignees) 
                                : (event.assigneeId ? getAssigneeNames([event.assigneeId]) : '미배정')}
                        </div>
                    </div>
                ))}
                {dayEvents.length > 3 && (
                    <div className={styles.moreEvents}>
                        +{dayEvents.length - 3} 더보기
                    </div>
                )}
            </div>
        </div>
    );
};

CalendarDay.propTypes = {
    day: PropTypes.object.isRequired,
    dayIndex: PropTypes.number.isRequired,
    weekIndex: PropTypes.number.isRequired,
    rangeClass: PropTypes.string.isRequired,
    dayEvents: PropTypes.array.isRequired,
    handleDragStart: PropTypes.func.isRequired,
    handleDragOver: PropTypes.func.isRequired,
    handleDragEnd: PropTypes.func.isRequired,
    handleDateClick: PropTypes.func.isRequired,
    handleEventSelect: PropTypes.func.isRequired,
    getAssigneeNames: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired,
    dataDate: PropTypes.string
};

export default CalendarDay; 