import React, { useState, useRef, useCallback, Component } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import styles from './CalendarView.module.css';
import EventModal from './EventModal';
import { projectEvents as dbProjectEvents, getProjectColorTag, projects as dbProjects, users as dbUsers } from '../../data/mockDatabase';

// Moment 로케일 설정
moment.locale('ko');
const localizer = momentLocalizer(moment);

// 드래그 앤 드롭을 적용한 캘린더 컴포넌트
const DnDCalendar = withDragAndDrop(Calendar);

/**
 * 이벤트 호버 툴팁 컴포넌트
 */
const EventTooltip = ({ event, position }) => {
  if (!event || !position) return null;
  
  // 필요한 이벤트 속성 안전하게 추출
  const { title, resource, start, end } = event || {};
  
  // 프로젝트 정보 안전하게 가져오기
  const project = resource?.projectId ? dbProjects.find(p => p.id === resource.projectId) : null;

  const formatTime = (date) => {
    if (!date) return '시간 미정';
    try {
      return moment(date).format('HH:mm');
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '시간 오류';
    }
  };

  // 참여자 정보 가져오기
  const getParticipants = () => {
    const participants = resource?.participants || [];
    if (!participants || participants.length === 0) return null;

    try {
      // 참여자 이름 목록 생성
      const participantNames = participants.map(participantId => {
        if (!participantId) return '알 수 없음';
        const user = dbUsers.find(u => u && u.id === participantId);
        return user ? user.name : '알 수 없음';
      }).filter(Boolean); // null 또는 undefined 제거

      if (!participantNames.length) return '참여자 없음';
      
      if (participantNames.length <= 3) {
        return participantNames.join(', ');
      } else {
        return `${participantNames[0]}, ${participantNames[1]} 외 ${participantNames.length - 2}명`;
      }
    } catch (error) {
      console.error('참여자 정보 처리 오류:', error);
      return '참여자 정보 오류';
    }
  };

  return (
    <div 
      className={styles.eventTooltip} 
      style={{ 
        left: `${position.x || 0}px`, 
        top: `${position.y || 0}px` 
      }}
    >
      <div className={styles.tooltipHeader}>
        <div className={styles.tooltipTitle}>{title || '제목 없음'}</div>
        {project && <div className={styles.tooltipProject}>{project.title || '프로젝트 정보 없음'}</div>}
      </div>
      <div className={styles.tooltipTime}>
        {formatTime(start)} - {formatTime(end)}
      </div>
      {resource?.location && (
        <div className={styles.tooltipLocation}>📍 {resource.location}</div>
      )}
      {resource?.participants && resource.participants.length > 0 && (
        <div className={styles.tooltipParticipants}>
          👥 참여자: {getParticipants()}
        </div>
      )}
      {resource?.description && (
        <div className={styles.tooltipDescription}>{resource.description}</div>
      )}
    </div>
  );
};

/**
 * 에러 경계 컴포넌트
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('캘린더 컴포넌트 오류:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className={styles.errorMessage}>
          오류가 발생했습니다. 페이지를 새로고침 해주세요.
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 프로젝트 캘린더 뷰 컴포넌트
 * react-big-calendar를 사용하여 프로젝트 이벤트를 표시합니다.
 * 
 * @returns {JSX.Element}
 */
const CalendarView = () => {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(() => {
    // 데이터베이스에서 이벤트 가져와서 react-big-calendar 형식으로 변환
    return dbProjectEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: false,
      resource: {
        description: event.description || '',
        location: event.location || '',
        projectId: event.projectId,
        taskId: event.taskId,
        colorTag: event.colorTag || getProjectColorTag(event.projectId),
        participants: event.assignees || (event.assigneeId ? [event.assigneeId] : [])
      }
    }));
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'add', 'edit'
  
  // 툴팁 관련 상태
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // 이벤트 선택 핸들러
  const handleSelectEvent = useCallback((event) => {
    if (!event) {
      console.warn('선택한 이벤트가 유효하지 않습니다.');
      return;
    }
    
    try {
      setSelectedEvent(event);
      setModalType('edit');
      setShowModal(true);
    } catch (error) {
      console.error('이벤트 선택 처리 중 오류 발생:', error);
    }
  }, []);

  // 슬롯 선택 핸들러 (캘린더 빈 공간 클릭 또는 드래그)
  const handleSelectSlot = useCallback(({ start, end }) => {
    if (!start || !end) {
      console.warn('선택한 시간 슬롯이 유효하지 않습니다.');
      return;
    }
    
    try {
      // 최소 30분 간격으로 설정
      const minDuration = 30 * 60 * 1000; // 30분을 밀리초로
      if (end - start < minDuration) {
        end = new Date(start.getTime() + minDuration);
      }
      
      setSelectedEvent({
        start,
        end,
        title: '',
        resource: {
          description: '',
          location: '',
          colorTag: 1,
          participants: []
        }
      });
      setModalType('add');
      setShowModal(true);
    } catch (error) {
      console.error('시간 슬롯 선택 처리 중 오류 발생:', error);
    }
  }, []);
  
  // 이벤트 드래그 앤 드롭 핸들러
  const moveEvent = useCallback(({ event, start, end }) => {
    if (!event || !start || !end) {
      console.warn('이벤트 이동에 필요한 정보가 누락되었습니다.');
      return;
    }
    
    try {
      setEvents(prev => 
        prev.map(ev => 
          ev.id === event.id 
            ? { ...ev, start, end }
            : ev
        )
      );
    } catch (error) {
      console.error('이벤트 이동 중 오류 발생:', error);
    }
  }, []);
  
  // 이벤트 크기 조절 핸들러
  const resizeEvent = useCallback(({ event, start, end }) => {
    if (!event || !start || !end) {
      console.warn('이벤트 크기 조절에 필요한 정보가 누락되었습니다.');
      return;
    }
    
    try {
      setEvents(prev => 
        prev.map(ev => 
          ev.id === event.id 
            ? { ...ev, start, end }
            : ev
        )
      );
    } catch (error) {
      console.error('이벤트 크기 조절 중 오류 발생:', error);
    }
  }, []);

  // 이벤트 추가 핸들러
  const handleAddEvent = useCallback((eventData) => {
    if (!eventData || !eventData.title) {
      console.warn('이벤트 데이터가 유효하지 않습니다.');
      return;
    }
    
    try {
      const newEvent = {
        id: `event-${Date.now()}`,
        title: eventData.title,
        start: eventData.start || new Date(),
        end: eventData.end || new Date(Date.now() + 60 * 60 * 1000),
        allDay: Boolean(eventData.allDay),
        resource: {
          description: eventData.description || '',
          location: eventData.location || '',
          colorTag: eventData.colorTag || 1,
          participants: eventData.participants || []
        }
      };

      setEvents(prev => [...prev, newEvent]);
      setShowModal(false);
    } catch (error) {
      console.error('이벤트 추가 중 오류 발생:', error);
    }
  }, []);

  // 이벤트 수정 핸들러
  const handleEditEvent = useCallback((eventData) => {
    if (!eventData || !eventData.id) {
      console.warn('수정할 이벤트 데이터가 유효하지 않습니다.');
      return;
    }
    
    try {
      setEvents(prev => prev.map(event => 
        event.id === eventData.id 
          ? {
              ...event,
              title: eventData.title || event.title,
              start: eventData.start || event.start,
              end: eventData.end || event.end,
              resource: {
                ...event.resource,
                description: eventData.description ?? event.resource?.description,
                location: eventData.location ?? event.resource?.location,
                colorTag: eventData.colorTag ?? event.resource?.colorTag,
                participants: eventData.participants ?? event.resource?.participants
              }
            }
          : event
      ));
      setShowModal(false);
    } catch (error) {
      console.error('이벤트 수정 중 오류 발생:', error);
    }
  }, []);

  // 이벤트 삭제 핸들러
  const handleDeleteEvent = useCallback((eventId) => {
    if (!eventId) {
      console.warn('삭제할 이벤트 ID가 유효하지 않습니다.');
      return;
    }
    
    try {
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setShowModal(false);
    } catch (error) {
      console.error('이벤트 삭제 중 오류 발생:', error);
    }
  }, []);

  // 이벤트 스타일 계산하는 헬퍼 함수
  const getEventColor = useCallback((colorTag) => {
    // 기본 색상 맵
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
    };
    
    // 유효한 colorTag인지 확인하고 기본값 반환
    const tag = Number(colorTag) || 1;
    return colorMap[tag] || colorMap[1];
  }, []);

  // 뷰별 이벤트 스타일 처리
  const eventStyleGetter = useCallback((event) => {
    if (!event || !event.resource) return {};
    
    const colorTag = event.resource.colorTag || 1;
    const backgroundColor = getEventColor(colorTag);
    
    return {
      className: styles.calendarEvent,
      style: {
        backgroundColor,
        color: '#fff',
        borderColor: 'transparent',
        padding: '2px 5px',
        fontSize: '0.9em',
        fontWeight: 500,
        borderRadius: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    };
  }, [getEventColor]);

  // 커스텀 이벤트 컴포넌트
  const EventComponent = ({ event }) => {
    if (!event) return null;
    
    const colorTag = event?.resource?.colorTag || 1;
    const backgroundColor = getEventColor(colorTag);
    
    return (
      <div 
        className={styles.customEvent}
        style={{
          backgroundColor,
          color: '#fff'
        }}
      >
        {event.title || '제목 없음'}
      </div>
    );
  };

  // 이벤트 내용 컴포넌트 (주로 주간/일간 뷰에서 사용)
  const EventContentsComponent = ({ event }) => {
    if (!event) return null;
    
    const colorTag = event?.resource?.colorTag || 1;
    const backgroundColor = getEventColor(colorTag);
    
    return (
      <div 
        className={styles.eventContents}
        style={{
          backgroundColor,
          color: '#fff'
        }}
      >
        <div className={styles.eventTitle}>{event.title || '제목 없음'}</div>
        {event.resource?.location && (
          <div className={styles.eventLocation}>📍 {event.resource.location}</div>
        )}
      </div>
    );
  };

  // 모든 뷰에서 사용되는 이벤트 래퍼 컴포넌트
  const EventWrapperComponent = ({ event, children }) => {
    const eventRef = useRef(null);
    
    const handleMouseEnter = useCallback((e) => {
      if (!e || !eventRef.current || !event) return;
      
      e.stopPropagation();
      const rect = eventRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5
      });
      setTooltipEvent(event);
      setShowTooltip(true);
    }, [event]);

    const handleMouseLeave = useCallback((e) => {
      if (!e) return;
      
      e.stopPropagation();
      setShowTooltip(false);
    }, []);

    // 안전하게 이벤트 확인
    if (!event || !children) {
      return children || null;
    }

    // 이벤트 스타일 계산
    const colorTag = event?.resource?.colorTag || 1;
    const backgroundColor = getEventColor(colorTag);
    
    try {
      // React.Children.only로 안전하게 자식 확인
      const child = React.Children.only(children);
      
      if (!child) return children;
      
      // 원래 클래스 이름 가져오기 (안전하게)
      const originalClassNames = (child.props && child.props.className) || '';
      
      return (
        <div
          ref={eventRef}
          className={styles.eventWrapper}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'relative', height: '100%', width: '100%' }}
        >
          {React.cloneElement(child, {
            className: `${originalClassNames} ${styles.calendarEvent}`,
            style: {
              ...(child.props?.style || {}),
              backgroundColor,
              color: '#fff',
              borderColor: 'transparent',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease',
              zIndex: 1
            }
          })}
        </div>
      );
    } catch (error) {
      console.error('이벤트 래퍼 렌더링 오류:', error);
      return children || null;
    }
  };
  
  // 이벤트 툴팁 컴포넌트 렌더링 안전하게 처리
  const renderEventTooltip = useCallback(() => {
    if (!showTooltip || !tooltipEvent || !tooltipPosition) return null;
    
    try {
      return (
        <EventTooltip 
          event={tooltipEvent} 
          position={tooltipPosition} 
        />
      );
    } catch (error) {
      console.error('툴팁 렌더링 오류:', error);
      return null;
    }
  }, [showTooltip, tooltipEvent, tooltipPosition]);

  // 캘린더 전체 에러 처리 함수
  const handleCalendarError = useCallback((error) => {
    console.error('캘린더 오류 발생:', error);
  }, []);

  // 이벤트 데이터가 유효한지 확인하는 헬퍼 함수
  const validateEvents = useCallback((eventsArray) => {
    if (!Array.isArray(eventsArray)) return [];
    
    return eventsArray.filter(event => {
      // 기본 필드 검사
      if (!event || !event.start || !event.end) {
        console.warn('유효하지 않은 이벤트 데이터 발견:', event);
        return false;
      }
      
      // 시작시간이 종료시간보다 뒤인 경우 수정
      if (new Date(event.start) > new Date(event.end)) {
        console.warn('이벤트 시작 시간이 종료 시간보다 뒤에 있습니다. 조정합니다:', event);
        event.end = new Date(new Date(event.start).getTime() + 60 * 60 * 1000); // 1시간 추가
      }
      
      return true;
    });
  }, []);

  // 시간 포맷 설정
  const formats = {
    dateFormat: 'D',
    dayFormat: 'D ddd',
    monthHeaderFormat: 'YYYY년 M월',
    dayHeaderFormat: 'YYYY년 M월 D일 dddd',
    dayRangeHeaderFormat: ({ start, end }) => {
      if (moment(start).month() !== moment(end).month()) {
        return `${moment(start).format('YYYY년 M월 D일')} - ${moment(end).format('YYYY년 M월 D일')}`;
      }
      return `${moment(start).format('YYYY년 M월 D일')} - ${moment(end).format('D일')}`;
    },
    agendaDateFormat: 'M월 D일 ddd',
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }) => {
      return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
    }
  };

  // 슬롯 관련 속성 설정
  const slotProps = {
    step: 15,  // 15분 단위로 슬롯 표시
    timeslots: 4, // 1시간에 4개의 슬롯 (15분 간격)
    min: moment().startOf('day').add(7, 'hours').toDate(), // 오전 7시 시작
    max: moment().startOf('day').add(22, 'hours').toDate(), // 저녁 10시 종료
  };

  // 날짜 셀 렌더링 커스터마이징
  const dayPropGetter = useCallback((date) => {
    const isToday = moment(date).isSame(moment(), 'day');
    const isWeekend = moment(date).day() === 0 || moment(date).day() === 6;
    
    return {
      className: isToday ? styles.todayCell : isWeekend ? styles.weekendCell : '',
      style: {
        backgroundColor: isToday ? 'rgba(66, 133, 244, 0.05)' : isWeekend ? 'rgba(0, 0, 0, 0.02)' : ''
      }
    };
  }, []);

  return (
    <div className={styles.calendarContainer}>
      <ErrorBoundary fallback={<div className={styles.errorMessage}>캘린더를 표시하는 중 오류가 발생했습니다.</div>}>
        <DnDCalendar
          ref={calendarRef}
          localizer={localizer}
          events={validateEvents(events)}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 180px)' }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView='month'
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          components={{
            event: EventComponent,
            eventWrapper: EventWrapperComponent,
            eventContents: EventContentsComponent
          }}
          formats={formats}
          {...slotProps}
          messages={{
            today: '오늘',
            previous: '이전',
            next: '다음',
            month: '월',
            week: '주',
            day: '일',
            agenda: '일정 목록',
            date: '날짜',
            time: '시간',
            event: '이벤트',
            allDay: '종일',
            noEventsInRange: '이 기간에 일정이 없습니다.'
          }}
          resizable
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          longPressThreshold={10} // 모바일에서 드래그 감지를 위한 설정
          onError={handleCalendarError}
          popup // 이벤트가 많을 때 팝업으로 표시
          tooltipAccessor={null} // 기본 툴팁 비활성화(커스텀 툴팁 사용)
        />
      </ErrorBoundary>
      
      {/* 이벤트 호버 툴팁 */}
      {renderEventTooltip()}

      {showModal && selectedEvent && (
        <ErrorBoundary fallback={<div className={styles.errorMessage}>이벤트 모달을 표시하는 중 오류가 발생했습니다.</div>}>
          <EventModal
            onClose={() => setShowModal(false)}
            onSave={modalType === 'add' ? handleAddEvent : handleEditEvent}
            onDelete={modalType === 'edit' ? handleDeleteEvent : undefined}
            event={modalType === 'edit' ? selectedEvent : null}
            initialDate={modalType === 'add' ? selectedEvent?.start : null}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default CalendarView;