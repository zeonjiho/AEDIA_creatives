import React, { useState, useEffect, useRef } from 'react';
import styles from './CalendarContainer.module.css';
import { FaChevronLeft, FaChevronRight, FaPlus, FaFilter } from 'react-icons/fa';
import MultiDayEventRow from './MultiDayEventRow';
import CalendarDay from './CalendarDay';

import { 
    projectEvents as dbProjectEvents, 
    projects as dbProjects,
    users as dbUsers,
    projectStatuses,
    addProjectEvent, 
    updateProjectEvent, 
    deleteProjectEvent,
    getProjectById,
    getTaskById,
    getProjectColorTag
} from '../../data/mockDatabase';

// EventModal, QuickEventModal, EventsModal 컴포넌트를 임포트합니다.
// 이 컴포넌트들은 기존 위치에서 가져올 수 있습니다.
import EventModal from '../../page/Calendar/EventModal';
import QuickEventModal from '../../page/Calendar/QuickEventModal';
import EventsModal from '../../page/Calendar/EventsModal';

/**
 * 캘린더 컨테이너 컴포넌트
 * 전체 캘린더 뷰를 관리하고 렌더링합니다.
 * 
 * @returns {JSX.Element}
 */
const CalendarContainer = () => {
    // 현재 날짜 정보
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    
    // 날짜 범위 선택 상태 추가
    const [dateRangeSelection, setDateRangeSelection] = useState({
        start: null,
        end: null,
        isSelecting: false
    });
    
    // 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    
    // 임시 드래그 이벤트 상태 추가
    const [tempDragEvent, setTempDragEvent] = useState(null);
    
    // 드래그 중인 범위 시각적 표시를 위한 상태 - 사용하지 않음
    // const [dragVisualElement, setDragVisualElement] = useState(null);
    
    // 모달 상태 관리
    const [showEventModal, setShowEventModal] = useState(false);
    const [showQuickEventModal, setShowQuickEventModal] = useState(false);
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    
    // 이벤트 데이터 관리
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dateEvents, setDateEvents] = useState([]);

    // 프로젝트 필터링
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // 캘린더 데이터 계산
    const [calendarDays, setCalendarDays] = useState([]);
    
    // 캘린더 그리드 참조
    const calendarGridRef = useRef(null);
    
    // 데이터베이스에서 이벤트 로드
    useEffect(() => {
        loadEvents();
        loadProjects();
    }, []);
    
    // 전역 마우스 이벤트 핸들러 등록
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
                
                // 범위가 선택되었고 시작과 끝이 다른 경우에만 모달 표시
                if (dateRangeSelection.start && dateRangeSelection.end && 
                    dateRangeSelection.start.getTime() !== dateRangeSelection.end.getTime()) {
                    
                    // 임시 이벤트 생성 부분 제거 (handleDragEnd에서만 생성)
                    
                    setShowQuickEventModal(true);
                    
                    // 범위 선택 완료
                    setDateRangeSelection(prev => ({
                        ...prev,
                        isSelecting: false
                    }));
                } else {
                    // 범위 선택이 없거나 같은 날짜인 경우 임시 이벤트 초기화
                    setTempDragEvent(null);
                }
            }
        };
        
        // 마우스가 캘린더 외부로 나가도 드래그가 종료되도록 처리
        document.addEventListener('mouseup', handleGlobalMouseUp);
        
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dateRangeSelection]);
    
    // 이벤트 로드 함수
    const loadEvents = () => {
        // 데이터베이스에서 프로젝트 이벤트 가져오기
        const formattedEvents = dbProjectEvents.map(event => ({
            id: event.id,
            title: event.title,
            date: new Date(event.start),
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.location,
            description: event.description || '',
            projectId: event.projectId,
            taskId: event.taskId,
            assignees: event.assignees || [], // 다중 담당자 배열
            assigneeId: event.assigneeId, // 이전 버전 호환성 유지
            projectStatus: event.projectStatus || projectStatuses.IN_PROGRESS.id, // 프로젝트 상태
            color: `var(--color-tag-${event.colorTag || getProjectColorTag(event.projectId)})`,
            colorTag: event.colorTag || getProjectColorTag(event.projectId),
            isTemporary: false
        }));
        
        setEvents(formattedEvents);
    };

    // 프로젝트 로드 함수
    const loadProjects = () => {
        setProjects(dbProjects);
        setFilteredProjects(dbProjects.map(project => project.id));
    };
    
    // 캘린더 데이터 생성
    useEffect(() => {
        generateCalendarDays();
    }, [currentDate]);

    // 필터링된 이벤트 가져오기
    const getFilteredEvents = () => {
        // 필터링된 이벤트와 임시 드래그 이벤트를 함께 반환
        const filtered = filteredProjects.length === 0 ? [] : events.filter(event => filteredProjects.includes(event.projectId));
        
        // 드래그 중인 임시 이벤트가 있으면 추가
        if (tempDragEvent) {
            console.log('임시 드래그 이벤트:', tempDragEvent); // 디버깅용 로그
            return [...filtered, tempDragEvent];
        }
        
        return filtered;
    };

    // 캘린더 날짜 생성 함수
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // 해당 월의 첫 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 첫 날의 요일 (0: 일요일, 6: 토요일)
        const firstDayOfWeek = firstDay.getDay();
        
        // 이전 달의 마지막 날짜들
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // 이전 달의 날짜들
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                isToday: false
            });
        }
        
        // 현재 달의 날짜들
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: 
                    date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear()
            });
        }
        
        // 다음 달의 날짜들 (6주 채우기)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
                isToday: false
            });
        }
        
        setCalendarDays(days);
    };

    // 이전 달로 이동
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // 다음 달로 이동
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // 오늘로 이동
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // 날짜 선택 핸들러
    const handleDateClick = (day, e) => {
        // 드래그 중이면 클릭 이벤트 무시
        if (isDragging) {
            return;
        }
        
        // 일반 클릭은 단일 날짜 선택
        setSelectedDate(day.date);
        
        // 범위 선택 초기화
        setDateRangeSelection({
            start: null,
            end: null,
            isSelecting: false
        });
        
        // 해당 날짜의 이벤트 가져오기
        const events = getFilteredEvents().filter(event => 
            isDateInEventRange(day.date, event)
        );
        
        if (events.length > 0) {
            // 이벤트가 있으면 이벤트 목록 모달 표시
            setDateEvents(events);
            setShowEventsModal(true);
        } else {
            // 이벤트가 없으면 퀵 이벤트 모달 표시
            setShowQuickEventModal(true);
        }
        
        // 모달 위치 설정
        const rect = e.currentTarget.getBoundingClientRect();
        setModalPosition({
            x: rect.left + window.scrollX,
            y: rect.bottom + window.scrollY
        });
    };
    
    // 드래그 시작 핸들러
    const handleDragStart = (day, e) => {
        e.preventDefault(); // 기본 드래그 동작 방지
        
        // 모달 닫기
        setShowQuickEventModal(false);
        setShowEventsModal(false);
        
        // 드래그 시작 상태 설정
        setIsDragging(true);
        setDragStart(day.date);
        
        // 범위 선택 시작
        setDateRangeSelection({
            start: day.date,
            end: day.date,
            isSelecting: true
        });
        
        // 기존 임시 이벤트가 있으면 제거
        setTempDragEvent(null);
    };
    
    // 드래그 중 핸들러
    const handleDragOver = (day, e) => {
        e.preventDefault(); // 기본 드래그 동작 방지
        
        if (isDragging && dragStart) {
            const start = new Date(dragStart);
            const current = new Date(day.date);
            
            // 시작과 현재 날짜 순서 정렬
            let rangeStart, rangeEnd;
            if (start > current) {
                rangeStart = current;
                rangeEnd = start;
            } else {
                rangeStart = start;
                rangeEnd = current;
            }
            
            // 날짜 범위 선택 업데이트
            setDateRangeSelection({
                start: rangeStart,
                end: rangeEnd,
                isSelecting: true
            });
            
            // 임시 이벤트 업데이트
            if (rangeStart && rangeEnd) {
                const tempEvent = {
                    id: 'temp-' + Date.now(), // 고유 ID 생성
                    title: '새 일정 추가',
                    start: new Date(rangeStart),
                    end: new Date(rangeEnd),
                    isTemporary: true,
                    color: 'var(--text-primary)', // 색상 추가
                    colorTag: 2 // 색상 태그 추가
                };
                setTempDragEvent(tempEvent);
            }
        }
    };
    
    // 드래그 종료 핸들러
    const handleDragEnd = (day, e) => {
        // 드래그 상태 초기화
        setIsDragging(false);
        
        // 범위가 선택되었는지 확인
        if (dateRangeSelection.start) {
            // 범위 선택 완료
            setDateRangeSelection(prev => ({
                ...prev,
                isSelecting: false
            }));
            
            // 임시 이벤트 생성
            if (dateRangeSelection.start && dateRangeSelection.end) {
                const tempEvent = {
                    id: 'temp-' + Date.now(), // 고유 ID 생성
                    title: '새 일정 추가',
                    start: new Date(dateRangeSelection.start),
                    end: new Date(dateRangeSelection.end),
                    isTemporary: true,
                    color: 'var(--text-primary)', // 색상 추가
                    colorTag: 2 // 색상 태그 추가
                };
                setTempDragEvent(tempEvent);
            }
            
            // 퀵 이벤트 모달 표시
            setSelectedDate(day.date);
            setShowQuickEventModal(true);
            
            // 모달 위치 설정
            const rect = e.currentTarget.getBoundingClientRect();
            setModalPosition({
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY
            });
        }
        
        // 드래그 시작 상태 초기화
        setDragStart(null);
        
        // 모든 날짜 셀에서 범위 클래스 제거
        if (calendarGridRef.current) {
            const allCells = calendarGridRef.current.querySelectorAll('[data-date]');
            allCells.forEach(cell => {
                cell.classList.remove(styles.rangeStart);
                cell.classList.remove(styles.rangeEnd);
                cell.classList.remove(styles.inRange);
            });
        }
    };
    
    // 드래그 시각적 요소 생성 함수 - 사용하지 않음
    const createDragVisualElement = (startDate, endDate, startRect) => {
        // 비활성화
        return;
        
        /*
        if (!calendarGridRef.current) return;
        
        // 기존 요소가 있으면 제거
        if (dragVisualElement) {
            calendarGridRef.current.removeChild(dragVisualElement);
        }
        
        // 새 요소 생성
        const element = document.createElement('div');
        element.className = styles.dragVisualElement;
        
        // 텍스트 추가
        const textElement = document.createElement('div');
        textElement.textContent = '새 이벤트';
        textElement.style.fontWeight = '500';
        textElement.style.fontSize = '0.85rem';
        element.appendChild(textElement);
        
        // 요소 위치 및 크기 설정
        updateElementPosition(element, startDate, endDate);
        
        // 캘린더 그리드에 추가
        calendarGridRef.current.appendChild(element);
        
        // 상태 업데이트
        setDragVisualElement(element);
        
        // 날짜 셀에 범위 클래스 추가
        highlightDateRange(startDate, endDate);
        */
    };
    
    // 드래그 시각적 요소 업데이트 함수 - 사용하지 않음
    const updateDragVisualElement = (startDate, endDate) => {
        // 비활성화
        return;
        
        /*
        if (!dragVisualElement || !calendarGridRef.current) return;
        
        // 요소 위치 및 크기 업데이트
        updateElementPosition(dragVisualElement, startDate, endDate);
        */
    };
    
    // 요소 위치 및 크기 업데이트 함수
    const updateElementPosition = (element, startDate, endDate) => {
        if (!calendarGridRef.current) return;
        
        // 시작 날짜와 종료 날짜에 해당하는 셀 찾기
        const startCell = findDayCell(startDate);
        const endCell = findDayCell(endDate);
        
        if (!startCell || !endCell) return;
        
        // 캘린더 그리드 기준 상대 위치 계산
        const gridRect = calendarGridRef.current.getBoundingClientRect();
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        
        // 요소 위치 및 크기 설정
        const left = startRect.left - gridRect.left;
        const top = startRect.top - gridRect.top + 30; // 날짜 숫자 아래에 위치
        const width = (endRect.right - startRect.left);
        const height = 24; // 이벤트 높이
        
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        
        // 날짜 셀에 범위 클래스 업데이트
        highlightDateRange(startDate, endDate);
    };
    
    // 날짜 범위 하이라이트 함수
    const highlightDateRange = (startDate, endDate) => {
        if (!calendarGridRef.current) return;
        
        // 모든 날짜 셀에서 범위 클래스 제거
        const allCells = calendarGridRef.current.querySelectorAll('[data-date]');
        allCells.forEach(cell => {
            cell.classList.remove(styles.rangeStart);
            cell.classList.remove(styles.rangeEnd);
            cell.classList.remove(styles.inRange);
        });
        
        // 시작 날짜와 종료 날짜가 같으면 처리하지 않음
        if (startDate.getTime() === endDate.getTime()) return;
        
        // 시작 날짜와 종료 날짜 사이의 모든 날짜 계산
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        // 시작 날짜부터 종료 날짜까지 반복
        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const cell = calendarGridRef.current.querySelector(`[data-date="${dateStr}"]`);
            
            if (cell) {
                if (currentDate.getTime() === startDate.getTime()) {
                    cell.classList.add(styles.rangeStart);
                } else if (currentDate.getTime() === lastDate.getTime()) {
                    cell.classList.add(styles.rangeEnd);
                } else {
                    cell.classList.add(styles.inRange);
                }
            }
            
            // 다음 날짜로 이동
            currentDate.setDate(currentDate.getDate() + 1);
        }
    };
    
    // 날짜에 해당하는 셀 찾기 함수
    const findDayCell = (date) => {
        if (!calendarGridRef.current) return null;
        
        const dateStr = date.toISOString().split('T')[0];
        return calendarGridRef.current.querySelector(`[data-date="${dateStr}"]`);
    };

    // 이벤트 추가 버튼 클릭 핸들러
    const handleAddEventClick = () => {
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    // 프로젝트 필터 토글
    const toggleProjectFilter = (projectId) => {
        setFilteredProjects(prev => {
            if (prev.includes(projectId)) {
                return prev.filter(id => id !== projectId);
            } else {
                return [...prev, projectId];
            }
        });
    };

    // 모든 프로젝트 필터 토글
    const toggleAllProjects = () => {
        if (filteredProjects.length === projects.length) {
            setFilteredProjects([]);
        } else {
            setFilteredProjects(projects.map(project => project.id));
        }
    };

    // 이벤트 추가 핸들러
    const handleAddEvent = (newEvent) => {
        // 데이터베이스에 이벤트 추가
        const eventToAdd = {
            title: newEvent.title,
            start: newEvent.start.toISOString(),
            end: newEvent.end.toISOString(),
            location: newEvent.location || '',
            description: newEvent.description || '',
            projectId: newEvent.projectId || 1, // 기본 프로젝트 ID
            taskId: newEvent.taskId,
            assignees: newEvent.assignees || [], // 다중 담당자 배열
            assigneeId: newEvent.assigneeId, // 이전 버전 호환성 유지
            projectStatus: newEvent.projectStatus || projectStatuses.IN_PROGRESS.id, // 프로젝트 상태
            colorTag: newEvent.colorTag || getProjectColorTag(newEvent.projectId || 1)
        };
        
        const addedEvent = addProjectEvent(eventToAdd);
        
        // 로컬 상태 업데이트
        const formattedEvent = {
            id: addedEvent.id,
            title: addedEvent.title,
            date: new Date(addedEvent.start),
            start: new Date(addedEvent.start),
            end: new Date(addedEvent.end),
            location: addedEvent.location,
            description: addedEvent.description,
            projectId: addedEvent.projectId,
            taskId: addedEvent.taskId,
            assignees: addedEvent.assignees || [], // 다중 담당자 배열
            assigneeId: addedEvent.assigneeId, // 이전 버전 호환성 유지
            projectStatus: addedEvent.projectStatus, // 프로젝트 상태
            color: `var(--color-tag-${addedEvent.colorTag})`,
            colorTag: addedEvent.colorTag
        };
        
        setEvents([...events, formattedEvent]);
        setShowEventModal(false);
        setShowQuickEventModal(false);
        
        // 임시 이벤트 초기화
        setTempDragEvent(null);
        
        // 날짜 범위 선택 초기화
        setDateRangeSelection({
            start: null,
            end: null,
            isSelecting: false
        });
    };

    // 이벤트 수정 핸들러
    const handleEditEvent = (updatedEvent) => {
        // 데이터베이스에서 이벤트 업데이트
        const eventToUpdate = {
            id: updatedEvent.id,
            title: updatedEvent.title,
            start: updatedEvent.start.toISOString(),
            end: updatedEvent.end.toISOString(),
            location: updatedEvent.location || '',
            description: updatedEvent.description || '',
            projectId: updatedEvent.projectId,
            taskId: updatedEvent.taskId,
            assignees: updatedEvent.assignees || [], // 다중 담당자 배열
            assigneeId: updatedEvent.assigneeId, // 이전 버전 호환성 유지
            projectStatus: updatedEvent.projectStatus, // 프로젝트 상태
            colorTag: updatedEvent.colorTag
        };
        
        updateProjectEvent(eventToUpdate.id, eventToUpdate);
        
        // 로컬 상태 업데이트
        const updatedEvents = events.map(event => {
            if (event.id === updatedEvent.id) {
                return {
                    ...event,
                    title: updatedEvent.title,
                    start: new Date(updatedEvent.start),
                    end: new Date(updatedEvent.end),
                    location: updatedEvent.location,
                    description: updatedEvent.description,
                    projectId: updatedEvent.projectId,
                    taskId: updatedEvent.taskId,
                    assignees: updatedEvent.assignees || [], // 다중 담당자 배열
                    assigneeId: updatedEvent.assigneeId, // 이전 버전 호환성 유지
                    projectStatus: updatedEvent.projectStatus, // 프로젝트 상태
                    color: `var(--color-tag-${updatedEvent.colorTag})`,
                    colorTag: updatedEvent.colorTag
                };
            }
            return event;
        });
        
        setEvents(updatedEvents);
        setShowEventModal(false);
    };

    // 이벤트 삭제 핸들러
    const handleDeleteEvent = (eventId) => {
        // 데이터베이스에서 이벤트 삭제
        deleteProjectEvent(eventId);
        
        // 로컬 상태 업데이트
        setEvents(events.filter(event => event.id !== eventId));
        setShowEventModal(false);
        setShowEventsModal(false);
    };

    // 이벤트 선택 핸들러
    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
        setShowEventsModal(false);
    };

    // 날짜 포맷 함수
    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('ko-KR', options);
    };

    // 담당자 이름 가져오기
    const getAssigneeName = (assigneeId) => {
        const user = dbUsers.find(user => user.id === assigneeId);
        return user ? user.name : '미배정';
    };

    // 담당자 목록 가져오기 (다중 담당자 지원)
    const getAssigneeNames = (assignees) => {
        if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
            return '미배정';
        }
        
        if (assignees.length === 1) {
            return getAssigneeName(assignees[0]);
        }
        
        return `${getAssigneeName(assignees[0])} 외 ${assignees.length - 1}명`;
    };

    // 프로젝트 상태 이름 가져오기
    const getProjectStatusName = (statusId) => {
        const status = Object.values(projectStatuses).find(s => s.id === statusId);
        return status ? status.name : 'Unknown';
    };

    // 프로젝트 상태 색상 가져오기
    const getProjectStatusColor = (statusId) => {
        const status = Object.values(projectStatuses).find(s => s.id === statusId);
        return status ? status.color : 'var(--color-tag-1)';
    };

    // 요일 배열
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    // 이벤트가 여러 날에 걸쳐 있는지 확인
    const isMultiDayEvent = (event) => {
        if (!event) return false;
        
        // 임시 드래그 이벤트는 항상 멀티데이 이벤트로 처리
        if (event.isTemporary) return true;
        
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // 시작일과 종료일이 다른 경우 여러 날에 걸친 이벤트
        return start.getTime() !== end.getTime();
    };

    // 날짜가 이벤트 기간에 포함되는지 확인
    const isDateInEventRange = (date, event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // 날짜만 비교 (시간 제외)
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        const startDate = new Date(eventStart);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(eventEnd);
        endDate.setHours(0, 0, 0, 0);
        
        return checkDate >= startDate && checkDate <= endDate;
    };

    // 이벤트를 주 단위로 그룹화하는 함수
    const groupEventsByWeek = () => {
        // 캘린더 날짜를 주 단위로 그룹화
        const weeks = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
        }
        
        return weeks.map((week, weekIndex) => {
            return { week, weekIndex };
        });
    };

    return (
        <div className={styles.calendarContainer}>
            {/* 캘린더 헤더 */}
            <div className={styles.calendarHeader}>
                <div className={styles.calendarTitle}>
                    <h2>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h2>
                </div>
                <div className={styles.calendarControls}>
                    <button className={styles.controlButton} onClick={goToPrevMonth}>
                        <FaChevronLeft />
                    </button>
                    <button className={styles.todayButton} onClick={goToToday}>
                        오늘
                    </button>
                    <button className={styles.controlButton} onClick={goToNextMonth}>
                        <FaChevronRight />
                    </button>
                </div>
                <div className={styles.actionButtons}>
                    <button 
                        className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        필터
                    </button>
                    <button className={styles.addEventButton} onClick={handleAddEventClick}>
                        <FaPlus />
                        일정 추가
                    </button>
                </div>
            </div>
            
            {/* 날짜 범위 선택 안내 */}
            <div className={styles.rangeSelectionHelp}>
                <p>날짜를 드래그하여 범위를 선택할 수 있습니다.</p>
            </div>
            
            {/* 프로젝트 필터 */}
            {showFilters && (
                <div className={styles.projectFilters}>
                    <div className={styles.filterHeader}>
                        <h3>프로젝트 필터</h3>
                        <button 
                            onClick={toggleAllProjects}
                            className={styles.toggleAllButton}
                        >
                            {filteredProjects.length === projects.length ? '모두 해제' : '모두 선택'}
                        </button>
                    </div>
                    <div className={styles.filterList}>
                        {projects.map(project => (
                            <div key={project.id} className={styles.filterItem}>
                                <label className={styles.filterLabel}>
                                    <input
                                        type="checkbox"
                                        checked={filteredProjects.includes(project.id)}
                                        onChange={() => toggleProjectFilter(project.id)}
                                    />
                                    <span 
                                        className={styles.colorIndicator}
                                        style={{ backgroundColor: `var(--color-tag-${getProjectColorTag(project.id)})` }}
                                    ></span>
                                    {project.title}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 요일 헤더 */}
            <div className={styles.weekdaysHeader}>
                {weekdays.map((day, index) => (
                    <div key={index} className={styles.weekday}>
                        {day}
                    </div>
                ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className={styles.calendarGrid} ref={calendarGridRef}>
                {/* 주 단위로 렌더링 */}
                {groupEventsByWeek().map(({ week, weekIndex }) => {
                    // 이 주에 표시될 여러 날짜에 걸친 이벤트 찾기
                    const weekStart = new Date(week[0].date);
                    const weekEnd = new Date(week[6].date);
                    weekStart.setHours(0, 0, 0, 0);
                    weekEnd.setHours(23, 59, 59, 999);
                    
                    const filteredEvents = getFilteredEvents();
                    const multiDayEvents = filteredEvents.filter(event => {
                        if (!event) return false;
                        
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        eventStart.setHours(0, 0, 0, 0);
                        eventEnd.setHours(23, 59, 59, 999);
                        
                        // 이벤트가 이 주와 겹치는지 확인 (여러 날짜에 걸친 이벤트만)
                        return eventStart <= weekEnd && eventEnd >= weekStart && isMultiDayEvent(event);
                    });
                    
                    return (
                        <div key={`week-${weekIndex}`} className={styles.calendarWeek}>
                            {/* 날짜 셀 */}
                            {week.map((day, dayIndex) => {
                                // 날짜 범위 선택 스타일 클래스 계산
                                let rangeClass = '';
                                if (dateRangeSelection.start && dateRangeSelection.end) {
                                    const currentDate = new Date(day.date);
                                    currentDate.setHours(0, 0, 0, 0);
                                    
                                    const startDate = new Date(dateRangeSelection.start);
                                    startDate.setHours(0, 0, 0, 0);
                                    
                                    const endDate = new Date(dateRangeSelection.end);
                                    endDate.setHours(0, 0, 0, 0);
                                    
                                    if (currentDate.getTime() === startDate.getTime()) {
                                        rangeClass = styles.rangeStart;
                                    } else if (currentDate.getTime() === endDate.getTime()) {
                                        rangeClass = styles.rangeEnd;
                                    } else if (currentDate > startDate && currentDate < endDate) {
                                        rangeClass = styles.inRange;
                                    }
                                }

                                // 해당 날짜의 하루짜리 이벤트 필터링
                                const dayEvents = filteredEvents.filter(event => 
                                    isDateInEventRange(day.date, event) && !isMultiDayEvent(event)
                                );

                                // 날짜 문자열 생성 (데이터 속성용)
                                const dateStr = day.date.toISOString().split('T')[0];

                                return (
                                    <CalendarDay
                                        key={`day-${weekIndex}-${dayIndex}`}
                                        day={day}
                                        dayIndex={dayIndex}
                                        weekIndex={weekIndex}
                                        rangeClass={rangeClass}
                                        dayEvents={dayEvents}
                                        handleDragStart={(e) => handleDragStart(day, e)}
                                        handleDragOver={(e) => handleDragOver(day, e)}
                                        handleDragEnd={(e) => handleDragEnd(day, e)}
                                        handleDateClick={(e) => handleDateClick(day, e)}
                                        handleEventSelect={handleEventSelect}
                                        getAssigneeNames={getAssigneeNames}
                                        styles={styles}
                                        dataDate={dateStr}
                                    />
                                );
                            })}
                            
                            {/* 여러 날짜에 걸친 이벤트 렌더링 */}
                            <MultiDayEventRow
                                weekIndex={weekIndex}
                                weekStart={weekStart}
                                weekEnd={weekEnd}
                                multiDayEvents={multiDayEvents}
                                handleEventSelect={handleEventSelect}
                                getAssigneeNames={getAssigneeNames}
                                getProjectStatusColor={getProjectStatusColor}
                                dbProjects={dbProjects}
                                styles={styles}
                            />
                        </div>
                    );
                })}
            </div>
            
            {/* 퀵 이벤트 모달 */}
            {showQuickEventModal && (
                <QuickEventModal
                    position={modalPosition}
                    onClose={() => {
                        setShowQuickEventModal(false);
                        setTempDragEvent(null); // 임시 이벤트 초기화
                    }}
                    onSave={(eventData) => {
                        handleAddEvent(eventData);
                        setTempDragEvent(null); // 임시 이벤트 초기화
                    }}
                    date={selectedDate}
                    timeRange={dateRangeSelection.start && dateRangeSelection.end ? {
                        start: dateRangeSelection.start,
                        end: dateRangeSelection.end
                    } : null}
                    projects={projects}
                />
            )}
            
            {/* 이벤트 모달 */}
            {showEventModal && selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setShowEventModal(false)}
                    onSave={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    projects={projects}
                />
            )}
            
            {/* 이벤트 목록 모달 */}
            {showEventsModal && dateEvents.length > 0 && (
                <EventsModal
                    events={dateEvents}
                    date={selectedDate}
                    position={modalPosition}
                    onClose={() => setShowEventsModal(false)}
                    onEventSelect={handleEventSelect}
                    getAssigneeName={getAssigneeName}
                    getAssigneeNames={getAssigneeNames}
                    getProjectStatusName={getProjectStatusName}
                    getProjectStatusColor={getProjectStatusColor}
                />
            )}
        </div>
    );
};

export default CalendarContainer; 