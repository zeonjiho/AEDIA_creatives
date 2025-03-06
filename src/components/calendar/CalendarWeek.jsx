import React from 'react';
import PropTypes from 'prop-types';
import styles from './CalendarWeek.module.css';
import CalendarDay from './CalendarDay';
import MultiDayEvent from './MultiDayEvent';
import { dbProjects, projectStatuses } from '../../data/mockDatabase';

/**
 * 캘린더 주간 뷰 컴포넌트
 * 한 주 단위의 날짜와 이벤트를 표시합니다
 */
const CalendarWeek = ({
  week,
  weekIndex,
  selectedDate,
  filteredEvents,
  handleDateClick,
  handleEventSelect,
  getAssigneeName,
  getAssigneeNames,
  getProjectStatusName,
  getProjectStatusColor,
  dateRangeSelection,
  handleDragStart,
  handleDragOver,
  handleDragEnd
}) => {
  // 주 단위 이벤트 행 구성
  const eventRows = [];
  
  // 주간에 표시될 여러 날짜에 걸친 이벤트 필터링 및 정렬
  let weekEvents = filteredEvents.filter(event => {
    // 이벤트가 현재 주에 속하는지 확인
    return week.some(day => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const dayDate = new Date(day.date);
      
      // 현재 날짜가 이벤트의 날짜 범위에 포함되는지 확인
      return dayDate >= eventStart && dayDate <= eventEnd;
    });
  });
  
  // 이벤트 시작일 기준으로 정렬
  weekEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
  
  // 각 이벤트에 대해 주 안에서의 표시 위치 계산
  weekEvents.forEach(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // 주 내에서의 시작 인덱스와 끝 인덱스 계산
    let startIndex = 0;
    let endIndex = 6;
    
    // 이벤트가 주 범위를 벗어나는지 확인
    let continuesPrevWeek = false;
    let continuesNextWeek = false;
    
    // 이벤트의 실제 시작과 끝이 현재 주에 있는지 확인
    let isRealStart = false;
    let isRealEnd = false;
    
    // 주 시작일과 종료일
    const weekStart = new Date(week[0].date);
    const weekEnd = new Date(week[6].date);
    
    // 주 시작일의 요일을 0(일요일)으로 조정
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    // 이벤트의 시작일이 주 시작일보다 이전인지 확인
    if (eventStart < weekStart) {
      continuesPrevWeek = true;
    } else {
      // 주 내에서 이벤트가 시작하는 요일 인덱스 계산
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(week[i].date);
        dayDate.setHours(0, 0, 0, 0);
        if (eventStart.getTime() === dayDate.getTime()) {
          startIndex = i;
          isRealStart = true;
          break;
        }
      }
    }
    
    // 이벤트의 종료일이 주 종료일을 초과하는지 확인
    if (eventEnd > weekEnd) {
      continuesNextWeek = true;
    } else {
      // 주 내에서 이벤트가 종료하는 요일 인덱스 계산
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(week[i].date);
        dayDate.setHours(23, 59, 59, 999);
        if (eventEnd.getTime() <= dayDate.getTime()) {
          endIndex = i;
          isRealEnd = true;
          break;
        }
      }
    }
    
    // 이벤트의 길이 계산
    const length = endIndex - startIndex + 1;
    
    // 이벤트를 표시할 행 찾기
    let rowIndex = 0;
    let foundRow = false;
    
    // 기존 행에서 가능한 공간 찾기
    while (rowIndex < eventRows.length && !foundRow) {
      let canPlaceInRow = true;
      
      // 행에서 이벤트가 표시될 범위에 다른 이벤트가 있는지 확인
      for (let i = startIndex; i <= endIndex; i++) {
        if (eventRows[rowIndex][i] && eventRows[rowIndex][i].event) {
          canPlaceInRow = false;
          break;
        }
      }
      
      // 가능한 공간을 찾았으면 해당 행에 이벤트 배치
      if (canPlaceInRow) {
        foundRow = true;
      } else {
        rowIndex++;
      }
    }
    
    // 기존 행에 공간이 없으면 새 행 추가
    if (!foundRow) {
      eventRows.push(Array(7).fill(null));
    }
    
    // 행에 이벤트 정보 저장
    eventRows[rowIndex][startIndex] = {
      event,
      startIndex,
      endIndex,
      length,
      continuesPrevWeek,
      continuesNextWeek,
      isRealStart,
      isRealEnd
    };
    
    // 이벤트가 차지하는 다른 날짜 셀 예약
    for (let i = startIndex + 1; i <= endIndex; i++) {
      eventRows[rowIndex][i] = { reserved: true };
    }
  });
  
  return (
    <div className={styles.calendarWeek}>
      {/* 날짜 셀 렌더링 */}
      {week.map((day, dayIndex) => (
        <CalendarDay
          key={`day-${weekIndex}-${dayIndex}`}
          day={day}
          selectedDate={selectedDate}
          dateRangeSelection={dateRangeSelection}
          onClick={(e) => handleDateClick(day, e)}
          onDragStart={(e) => handleDragStart(day, e)}
          onDragOver={(e) => handleDragOver(day, e)}
          onDragEnd={(e) => handleDragEnd(day, e)}
          filteredEvents={filteredEvents}
          handleEventSelect={handleEventSelect}
          getAssigneeName={getAssigneeName}
          getAssigneeNames={getAssigneeNames}
          getProjectStatusName={getProjectStatusName}
          getProjectStatusColor={getProjectStatusColor}
          multiDayEventRows={eventRows.filter(row => row.some(cell => cell && cell.event))}
        />
      ))}
      
      {/* 여러 날짜에 걸친 이벤트 행 */}
      {eventRows.map((row, rowIndex) => {
        // 이 행에 실제 이벤트가 있는지 확인
        const hasEvents = row.some(cell => cell && cell.event);
        if (!hasEvents) return null;
        
        // 행 위치 계산 - 약간의 간격 추가
        const rowTopPosition = 30 + (rowIndex * 26); // 간격 증가
        
        return (
          <div 
            key={`event-row-${weekIndex}-${rowIndex}`} 
            className={styles.eventRow}
            style={{
              top: `${rowTopPosition}px`, // 날짜 숫자 아래 위치
              zIndex: 5 + rowIndex // 행마다 z-index 증가
            }}
          >
            {row.map((eventData, dayIndex) => {
              if (!eventData || !eventData.event) return null;
              
              // 이벤트 정보가 있는 경우만 렌더링
              const projectName = eventData.event.projectId 
                ? dbProjects.find(p => p.id === eventData.event.projectId)?.title || '프로젝트 없음'
                : '프로젝트 없음';
              
              const assigneeText = eventData.event.assignees && eventData.event.assignees.length > 0 
                ? getAssigneeNames(eventData.event.assignees) 
                : (eventData.event.assigneeId ? getAssigneeName(eventData.event.assigneeId) : '미배정');
              
              const statusColor = eventData.event.projectStatus 
                ? getProjectStatusColor(eventData.event.projectStatus)
                : 'transparent';
              
              // 이벤트 위치 및 너비 계산
              let leftPercent = (eventData.startIndex / 7) * 100;
              let widthPercent = (eventData.length / 7) * 100;
              
              // 주 경계를 넘어가는 이벤트의 위치 및 너비 조정
              if (eventData.continuesPrevWeek) {
                leftPercent = -0.5; // 왼쪽으로 더 확장
                widthPercent = ((eventData.endIndex + 1) / 7) * 100 + 0.5;
              }
              
              if (eventData.continuesNextWeek) {
                widthPercent = 100.5 - leftPercent; // 오른쪽으로 더 확장
              }
              
              // 이벤트 ID를 키에 추가하여 고유성 보장
              const eventKey = `event-${weekIndex}-${rowIndex}-${dayIndex}-${eventData.event.id}`;
              
              return (
                <MultiDayEvent
                  key={eventKey}
                  event={eventData.event}
                  leftPercent={leftPercent}
                  widthPercent={widthPercent}
                  rowIndex={rowIndex}
                  continuesPrevWeek={eventData.continuesPrevWeek}
                  continuesNextWeek={eventData.continuesNextWeek}
                  isRealStart={eventData.isRealStart}
                  isRealEnd={eventData.isRealEnd}
                  projectName={projectName}
                  assigneeText={assigneeText}
                  statusColor={statusColor}
                  onClick={handleEventSelect}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

CalendarWeek.propTypes = {
  week: PropTypes.array.isRequired,
  weekIndex: PropTypes.number.isRequired,
  selectedDate: PropTypes.object,
  filteredEvents: PropTypes.array.isRequired,
  handleDateClick: PropTypes.func.isRequired,
  handleEventSelect: PropTypes.func.isRequired,
  getAssigneeName: PropTypes.func.isRequired,
  getAssigneeNames: PropTypes.func.isRequired,
  getProjectStatusName: PropTypes.func.isRequired,
  getProjectStatusColor: PropTypes.func.isRequired,
  dateRangeSelection: PropTypes.object,
  handleDragStart: PropTypes.func.isRequired,
  handleDragOver: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired
};

export default CalendarWeek; 