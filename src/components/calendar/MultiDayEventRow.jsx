import React from 'react';

/**
 * 멀티데이 이벤트 행 컴포넌트
 * 여러 날짜에 걸친 이벤트를 표시하는 행을 렌더링합니다.
 * 이벤트가 주 경계에서 끊어지지 않도록 처리합니다.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {number} props.weekIndex - 주 인덱스
 * @param {Date} props.weekStart - 주의 시작 날짜
 * @param {Date} props.weekEnd - 주의 종료 날짜
 * @param {Array} props.multiDayEvents - 여러 날짜에 걸친 이벤트 목록
 * @param {Function} props.handleEventSelect - 이벤트 선택 핸들러
 * @param {Function} props.getAssigneeNames - 담당자 이름 가져오기 함수
 * @param {Function} props.getProjectStatusColor - 프로젝트 상태 색상 가져오기 함수
 * @param {Array} props.dbProjects - 프로젝트 목록
 * @param {Object} props.styles - 스타일 객체
 * @returns {JSX.Element}
 */
const MultiDayEventRow = ({
    weekIndex,
    weekStart,
    weekEnd,
    multiDayEvents,
    handleEventSelect,
    getAssigneeNames,
    getProjectStatusColor,
    dbProjects,
    styles
}) => {
    // 이벤트 행 계산
    const calculateEventRows = () => {
        const eventRows = [];
        
        console.log('MultiDayEventRow - 이벤트 목록:', multiDayEvents); // 디버깅용 로그
        
        // 이벤트를 시작일 기준으로 정렬 (안정적인 배치를 위해)
        multiDayEvents.sort((a, b) => {
            // 임시 이벤트는 항상 아래쪽에 표시되도록 변경
            if (a.isTemporary) return 1;
            if (b.isTemporary) return -1;
            
            const aStart = new Date(a.start);
            const bStart = new Date(b.start);
            return aStart.getTime() - bStart.getTime();
        });
        
        multiDayEvents.forEach(event => {
            // 임시 이벤트 특별 처리
            if (event.isTemporary) {
                console.log('임시 이벤트 처리:', event); // 디버깅용 로그
                
                // 임시 이벤트는 항상 새 행에 추가
                const rowIndex = eventRows.length;
                eventRows.push(Array(7).fill(null));
                
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                eventStart.setHours(0, 0, 0, 0);
                eventEnd.setHours(0, 0, 0, 0);
                
                // 이 주에서의 이벤트 시작일과 종료일 계산
                const displayStart = eventStart < weekStart ? weekStart : eventStart;
                const displayEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
                
                // 이벤트 시작 요일 인덱스 (0: 일요일, 6: 토요일)
                const startDayIndex = displayStart.getDay();
                
                // 이벤트 종료 요일 인덱스
                const endDayIndex = displayEnd.getDay();
                
                // 이벤트 길이 (일수)
                const eventLength = endDayIndex - startDayIndex + 1;
                
                // 이벤트 정보 저장
                const eventInfo = {
                    event,
                    startDayIndex,
                    endDayIndex,
                    length: eventLength,
                    isRealStart: true,
                    isRealEnd: true,
                    continuesNextWeek: false,
                    continuesPrevWeek: false,
                    rowIndex
                };
                
                // 시작일에 이벤트 정보 저장
                eventRows[rowIndex][startDayIndex] = eventInfo;
                
                // 나머지 위치는 빈 객체로 채워 다른 이벤트가 배치되지 않도록 함
                for (let i = startDayIndex + 1; i <= endDayIndex; i++) {
                    eventRows[rowIndex][i] = { reserved: true };
                }
                
                return; // 임시 이벤트 처리 완료
            }
            
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(0, 0, 0, 0);
            
            // 이 주에서의 이벤트 시작일과 종료일 계산
            const displayStart = eventStart < weekStart ? weekStart : eventStart;
            const displayEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
            
            // 이벤트 시작 요일 인덱스 (0: 일요일, 6: 토요일)
            const startDayIndex = displayStart.getDay();
            
            // 이벤트 종료 요일 인덱스
            const endDayIndex = displayEnd.getDay();
            
            // 이벤트 길이 (일수)
            const eventLength = endDayIndex - startDayIndex + 1;
            
            // 이벤트 배치 행 찾기
            let rowIndex = 0;
            let foundRow = false;
            
            // 기존 행에 배치 가능한지 확인
            while (rowIndex < eventRows.length && !foundRow) {
                // 이 행에 이벤트를 배치할 수 있는지 확인
                let canPlaceEvent = true;
                for (let i = startDayIndex; i <= endDayIndex; i++) {
                    if (eventRows[rowIndex][i] && eventRows[rowIndex][i].event) {
                        canPlaceEvent = false;
                        break;
                    }
                }
                
                if (canPlaceEvent) {
                    foundRow = true;
                    break;
                }
                rowIndex++;
            }
            
            // 필요하면 새 행 추가
            if (!foundRow) {
                eventRows.push(Array(7).fill(null));
            }
            
            // 이벤트 정보 저장
            const eventInfo = {
                event,
                startDayIndex,
                endDayIndex,
                length: eventLength,
                isRealStart: eventStart.getTime() === displayStart.getTime(),
                isRealEnd: eventEnd.getTime() === displayEnd.getTime(),
                // 주 경계를 넘어가는지 여부
                continuesNextWeek: eventEnd > weekEnd,
                continuesPrevWeek: eventStart < weekStart,
                rowIndex // 행 인덱스 저장 (z-index 계산용)
            };
            
            // 시작일에 이벤트 정보 저장
            eventRows[rowIndex][startDayIndex] = eventInfo;
            
            // 나머지 위치는 빈 객체로 채워 다른 이벤트가 배치되지 않도록 함
            for (let i = startDayIndex + 1; i <= endDayIndex; i++) {
                eventRows[rowIndex][i] = { reserved: true };
            }
        });
        
        return eventRows;
    };
    
    const eventRows = calculateEventRows();
    
    return (
        <>
            {eventRows.map((row, rowIndex) => {
                // 이 행에 실제 이벤트가 있는지 확인
                const hasEvents = row.some(cell => cell && cell.event);
                if (!hasEvents) return null;
                
                // 행 위치 계산 - 간격 추가
                const rowTopPosition = 30 + (rowIndex * 26);
                
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
                            const event = eventData.event;
                            
                            // 임시 이벤트 특별 처리
                            if (event.isTemporary) {
                                console.log('임시 이벤트 렌더링:', event); // 디버깅용 로그
                                
                                // 이벤트 위치 및 너비 계산
                                let leftPercent = (eventData.startDayIndex / 7) * 100;
                                let widthPercent = (eventData.length / 7) * 100;
                                
                                // 위치 및 크기만 인라인 스타일로 설정
                                const tempEventStyle = {
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`,
                                };
                                
                                // 이벤트 ID를 키에 추가하여 고유성 보장
                                const eventKey = `temp-event-${event.id}-${weekIndex}-${rowIndex}-${eventData.startDayIndex}`;
                                
                                return (
                                    <div 
                                        key={eventKey}
                                        className={`${styles.eventCard} ${styles.multiDayEvent} ${styles.temporaryEvent}`}
                                        style={tempEventStyle}
                                        data-temporary="true"
                                    >
                                        <div className={`${styles.eventTitle} ${styles.temporaryEventTitle}`}>새 일정 추가</div>
                                    </div>
                                );
                            }
                            
                            const projectName = event.projectId 
                                ? dbProjects.find(p => p.id === event.projectId)?.title || '프로젝트 없음'
                                : '프로젝트 없음';
                            
                            const assigneeText = event.assignees && event.assignees.length > 0 
                                ? getAssigneeNames(event.assignees) 
                                : (event.assigneeId ? getAssigneeNames([event.assigneeId]) : '미배정');
                            
                            const statusColor = event.projectStatus 
                                ? getProjectStatusColor(event.projectStatus)
                                : 'transparent';
                            
                            // 이벤트 위치 및 너비 계산
                            let leftPercent = (eventData.startDayIndex / 7) * 100;
                            let widthPercent = (eventData.length / 7) * 100;
                            
                            // 주 경계를 넘어가는 이벤트의 위치 및 너비 조정
                            if (eventData.continuesPrevWeek) {
                                leftPercent = -0.5; // 왼쪽으로 더 확장
                                widthPercent = ((eventData.endDayIndex + 1) / 7) * 100 + 0.5;
                            }
                            
                            if (eventData.continuesNextWeek) {
                                widthPercent = 100.5 - leftPercent; // 오른쪽으로 더 확장
                            }
                            
                            // 주 경계 연결을 위한 추가 스타일
                            const eventStyle = {
                                backgroundColor: event.isTemporary ? event.color || 'var(--color-secondary-light)' : event.color,
                                borderTopColor: event.isTemporary ? 'var(--color-secondary)' : statusColor,
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                zIndex: event.isTemporary ? 1000 : (10 + rowIndex) // 임시 이벤트는 항상 최상위에 표시
                            };
                            
                            // 임시 이벤트가 아닌 경우에만 주 경계 연결 스타일 적용
                            if (!event.isTemporary && (eventData.continuesPrevWeek || eventData.continuesNextWeek)) {
                                eventStyle.zIndex = 20 + rowIndex; // 연결된 이벤트의 z-index 높임
                            }
                            
                            // 주 경계에서 이벤트가 끊어지지 않도록 약간 확장
                            if (!event.isTemporary && eventData.continuesPrevWeek) {
                                eventStyle.width = `calc(${widthPercent}% + 6px)`; // 확장 너비 증가
                                eventStyle.left = `-5px`; // 왼쪽으로 더 이동
                            }
                            
                            if (!event.isTemporary && eventData.continuesNextWeek) {
                                eventStyle.width = `calc(${widthPercent}% + 6px)`; // 확장 너비 증가
                            }
                            
                            // 임시 이벤트인 경우 추가 스타일
                            if (event.isTemporary) {
                                // 클래스로 대체하므로 인라인 스타일 제거
                                // eventStyle.border = '2px dashed var(--color-secondary)';
                                // eventStyle.opacity = '0.9';
                                // eventStyle.display = 'flex';
                                // eventStyle.alignItems = 'center';
                                // eventStyle.justifyContent = 'center';
                            }
                            
                            // 이벤트 ID를 키에 추가하여 고유성 보장
                            const eventKey = `event-${weekIndex}-${rowIndex}-${dayIndex}-${event.id}`;
                            
                            const eventClasses = [
                                styles.eventCard,
                                styles.multiDayEvent,
                                eventData.continuesPrevWeek && !event.isTemporary ? styles.continuesPrevWeek : '',
                                eventData.continuesNextWeek && !event.isTemporary ? styles.continuesNextWeek : '',
                                event.isTemporary ? styles.temporaryEvent : ''
                            ].filter(Boolean).join(' ');
                            
                            return (
                                <div 
                                    key={eventKey}
                                    className={eventClasses}
                                    style={eventStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!event.isTemporary) {
                                            handleEventSelect(event);
                                        }
                                    }}
                                    data-temporary={event.isTemporary ? "true" : "false"}
                                >
                                    <div className={`${styles.eventTitle} ${event.isTemporary ? styles.temporaryEventTitle : ''}`}>
                                        {event.isTemporary ? '새 일정 추가' : event.title}
                                    </div>
                                    {!event.isTemporary && (
                                        <div className={styles.eventDetails}>
                                            <div className={styles.eventProject}>{projectName}</div>
                                            <div className={styles.eventAssignee}>{assigneeText}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
};

export default MultiDayEventRow; 