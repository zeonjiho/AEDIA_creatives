import React, { useState, useEffect, useRef } from 'react'
import styles from './GanttView.module.css'
import { 
    FaChevronLeft, 
    FaChevronRight, 
    FaRegStar,
    FaPlus,
    FaEllipsisH,
    FaTrash,
    FaEdit,
    FaChevronDown,
    FaChevronUp,
    FaCheck,
    FaTimes,
    FaCalendarAlt,
    FaUser,
    FaTag,
    FaGripLines
} from 'react-icons/fa'
import { events as dbEvents, addEvent, updateEvent, deleteEvent } from '../../data/mockDatabase'
import { users, currentUser } from '../../data/mockDatabase'

/**
 * 간트차트 뷰 컴포넌트
 * 프로젝트와 일정을 간트차트 형식으로 표시
 * 
 * @returns {JSX.Element}
 */
const GanttView = () => {
    // 상태 관리
    const [events, setEvents] = useState([])
    const [projects, setProjects] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewRange, setViewRange] = useState(30) // 기본 30일 표시
    const [viewMode, setViewMode] = useState('day') // 'day', 'week', 'month', 'year'
    const [showEventOptions, setShowEventOptions] = useState(null)
    const [collapsedProjects, setCollapsedProjects] = useState([])
    const [draggedEvent, setDraggedEvent] = useState(null)
    const [resizingEvent, setResizingEvent] = useState(null)
    const [eventDetailModal, setEventDetailModal] = useState(null)
    const [hoveredEvent, setHoveredEvent] = useState(null)
    const [sidebarWidth, setSidebarWidth] = useState(200)
    const [resizingSidebar, setResizingSidebar] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [mouseDownTime, setMouseDownTime] = useState(0)
    const ganttBodyRef = useRef(null)
    const sidebarRef = useRef(null)
    
    // 초기 데이터 로드
    useEffect(() => {
        // 이벤트 데이터 로드
        const today = new Date()
        const updatedEvents = dbEvents.map(event => {
            // 이벤트 날짜를 현재 연도와 월로 업데이트
            const startDate = new Date(event.start)
            const endDate = new Date(event.end)
            
            startDate.setFullYear(today.getFullYear())
            startDate.setMonth(today.getMonth())
            
            endDate.setFullYear(today.getFullYear())
            endDate.setMonth(today.getMonth())
            
            // 일부 이벤트는 다음 달에 배치
            if (event.id % 3 === 0) {
                startDate.setMonth(today.getMonth() + 1)
                endDate.setMonth(today.getMonth() + 1)
            }
            
            // 일부 이벤트는 이전 달에 배치
            if (event.id % 5 === 0) {
                startDate.setMonth(today.getMonth() - 1)
                endDate.setMonth(today.getMonth() - 1)
            }
            
            // 일정 기간을 랜덤하게 설정 (간트차트용)
            const randomDuration = Math.floor(Math.random() * 5) + 1 // 1~5일
            endDate.setDate(startDate.getDate() + randomDuration)
            
            return {
                ...event,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                progress: Math.floor(Math.random() * 100), // 랜덤 진행률
                assignees: [users[Math.floor(Math.random() * users.length)].id]
            }
        })
        
        setEvents(updatedEvents)
        
        // 프로젝트 데이터 생성 (임시)
        const tempProjects = [
            { id: 1, name: '웹사이트 리뉴얼', color: 1 },
            { id: 2, name: '모바일 앱 개발', color: 3 },
            { id: 3, name: '마케팅 캠페인', color: 5 },
            { id: 4, name: '신제품 출시', color: 7 },
            { id: 5, name: '인프라 구축', color: 9 }
        ]
        
        // 이벤트에 랜덤 프로젝트 할당
        const eventsWithProject = updatedEvents.map(event => ({
            ...event,
            projectId: tempProjects[Math.floor(Math.random() * tempProjects.length)].id
        }))
        
        setEvents(eventsWithProject)
        setProjects(tempProjects)
    }, [])
    
    // 날짜 관련 함수
    const getDaysArray = () => {
        const startDate = new Date(currentDate)
        
        if (viewMode === 'day') {
            // 일별 뷰: 현재 날짜 중심으로 viewRange일 표시
            startDate.setDate(startDate.getDate() - Math.floor(viewRange / 2))
            
            const days = []
            for (let i = 0; i < viewRange; i++) {
                const day = new Date(startDate)
                day.setDate(startDate.getDate() + i)
                days.push(day)
            }
            
            return days
        } else if (viewMode === 'week') {
            // 주별 뷰: 주 단위로 표시
            const weeks = []
            
            // 시작 날짜를 현재 날짜가 포함된 주의 첫날(일요일)로 설정
            startDate.setDate(startDate.getDate() - startDate.getDay())
            
            // viewRange 주 만큼 표시
            for (let i = 0; i < viewRange; i++) {
                const weekStart = new Date(startDate)
                weekStart.setDate(weekStart.getDate() + (i * 7))
                
                // 한 주의 시작일을 배열에 추가
                weeks.push(weekStart)
            }
            
            return weeks
        } else if (viewMode === 'month') {
            // 월별 뷰: 월 단위로 표시
            const months = []
            
            // 시작 날짜를 현재 월의 1일로 설정
            startDate.setDate(1)
            startDate.setMonth(startDate.getMonth() - Math.floor(viewRange / 2))
            
            // viewRange 개월 만큼 표시
            for (let i = 0; i < viewRange; i++) {
                const monthStart = new Date(startDate)
                monthStart.setMonth(monthStart.getMonth() + i)
                months.push(monthStart)
            }
            
            return months
        } else if (viewMode === 'year') {
            // 연도별 뷰: 년 단위로 표시
            const years = []
            
            // 시작 연도를 현재 연도로 설정
            startDate.setMonth(0, 1) // 1월 1일
            startDate.setFullYear(startDate.getFullYear() - Math.floor(viewRange / 2))
            
            // viewRange 년 만큼 표시
            for (let i = 0; i < viewRange; i++) {
                const yearStart = new Date(startDate)
                yearStart.setFullYear(yearStart.getFullYear() + i)
                years.push(yearStart)
            }
            
            return years
        }
    }
    
    // 네비게이션 함수
    const goToPrevious = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            
            if (viewMode === 'day') {
                newDate.setDate(prevDate.getDate() - 7)
            } else if (viewMode === 'week') {
                newDate.setDate(prevDate.getDate() - 7 * 4) // 4주 이동
            } else if (viewMode === 'month') {
                newDate.setMonth(prevDate.getMonth() - 3) // 3개월 이동
            } else if (viewMode === 'year') {
                newDate.setFullYear(prevDate.getFullYear() - 1) // 1년 이동
            }
            
            return newDate
        })
    }
    
    const goToNext = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            
            if (viewMode === 'day') {
                newDate.setDate(prevDate.getDate() + 7)
            } else if (viewMode === 'week') {
                newDate.setDate(prevDate.getDate() + 7 * 4) // 4주 이동
            } else if (viewMode === 'month') {
                newDate.setMonth(prevDate.getMonth() + 3) // 3개월 이동
            } else if (viewMode === 'year') {
                newDate.setFullYear(prevDate.getFullYear() + 1) // 1년 이동
            }
            
            return newDate
        })
    }
    
    const goToToday = () => {
        setCurrentDate(new Date())
    }
    
    // 헬퍼 함수
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        })
    }
    
    const formatMonthYear = (date) => {
        if (viewMode === 'year') {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric'
            })
        } else {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long'
            })
        }
    }
    
    const isToday = (date) => {
        const today = new Date()
        
        if (viewMode === 'day') {
            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            )
        } else if (viewMode === 'week') {
            // 오늘이 이 주에 속하는지 확인
            const weekStart = new Date(date)
            const weekEnd = new Date(date)
            weekEnd.setDate(weekStart.getDate() + 6)
            
            return today >= weekStart && today <= weekEnd
        } else if (viewMode === 'month') {
            return (
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            )
        } else if (viewMode === 'year') {
            return date.getFullYear() === today.getFullYear()
        }
        
        return false
    }
    
    // 드래그 인식 처리
    const isDragEvent = () => {
        return Date.now() - mouseDownTime > 150; // 150ms 이상 눌렀으면 드래그로 간주
    }
    
    // 간트 차트 헬퍼 함수
    const getEventPosition = (event, daysArray) => {
        const startDate = new Date(event.start)
        const endDate = new Date(event.end)
        let startPercent, widthPercent
        
        if (viewMode === 'day') {
            // 일별 뷰
            // 시작일이 표시 범위 이전인 경우
            const firstDayTime = daysArray[0].getTime()
            if (startDate.getTime() < firstDayTime) {
                startDate.setTime(firstDayTime)
            }
            
            // 종료일이 표시 범위 이후인 경우
            const lastDayTime = daysArray[daysArray.length - 1].getTime()
            if (endDate.getTime() > lastDayTime) {
                endDate.setTime(lastDayTime)
            }
            
            // 시작일의 위치 계산 (퍼센트)
            const rangeStartTime = daysArray[0].getTime()
            const rangeEndTime = daysArray[daysArray.length - 1].getTime()
            const totalRange = rangeEndTime - rangeStartTime
            
            const eventStartOffset = startDate.getTime() - rangeStartTime
            const eventEndOffset = endDate.getTime() - rangeStartTime
            
            startPercent = (eventStartOffset / totalRange) * 100
            widthPercent = ((eventEndOffset - eventStartOffset) / totalRange) * 100
        } else if (viewMode === 'week') {
            // 주별 뷰
            const firstWeekStart = daysArray[0]
            const lastWeekStart = daysArray[daysArray.length - 1]
            const lastWeekEnd = new Date(lastWeekStart)
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
            
            const totalDays = (lastWeekEnd.getTime() - firstWeekStart.getTime()) / (1000 * 60 * 60 * 24)
            const startOffset = (startDate.getTime() - firstWeekStart.getTime()) / (1000 * 60 * 60 * 24)
            const endOffset = (endDate.getTime() - firstWeekStart.getTime()) / (1000 * 60 * 60 * 24)
            
            startPercent = (startOffset / totalDays) * 100
            widthPercent = ((endOffset - startOffset) / totalDays) * 100
        } else if (viewMode === 'month') {
            // 월별 뷰
            const firstMonth = daysArray[0]
            const lastMonth = daysArray[daysArray.length - 1]
            const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
            
            // 총 일수 계산
            let totalDays = 0
            let currentMonth = new Date(firstMonth)
            
            while (currentMonth <= lastMonthEnd) {
                totalDays++
                currentMonth.setDate(currentMonth.getDate() + 1)
            }
            
            // 시작일과 종료일의 오프셋 계산
            const startOffset = Math.max(0, (startDate.getTime() - firstMonth.getTime()) / (1000 * 60 * 60 * 24))
            const endOffset = Math.min(totalDays, (endDate.getTime() - firstMonth.getTime()) / (1000 * 60 * 60 * 24))
            
            startPercent = (startOffset / totalDays) * 100
            widthPercent = ((endOffset - startOffset) / totalDays) * 100
        } else if (viewMode === 'year') {
            // 연도별 뷰
            const firstYear = daysArray[0]
            const lastYear = daysArray[daysArray.length - 1]
            const lastYearEnd = new Date(lastYear.getFullYear(), 11, 31)
            
            // 총 일수 계산 (대략적으로 일 단위로 계산)
            const totalDays = (lastYearEnd.getTime() - firstYear.getTime()) / (1000 * 60 * 60 * 24)
            
            // 시작일과 종료일의 오프셋 계산
            const startOffset = (startDate.getTime() - firstYear.getTime()) / (1000 * 60 * 60 * 24)
            const endOffset = (endDate.getTime() - firstYear.getTime()) / (1000 * 60 * 60 * 24)
            
            startPercent = (startOffset / totalDays) * 100
            widthPercent = ((endOffset - startOffset) / totalDays) * 100
        }
        
        return {
            left: `${startPercent}%`,
            width: `${Math.max(0.5, widthPercent)}%` // 최소 너비 설정
        }
    }
    
    // 뷰 모드 변경
    const handleViewModeChange = (mode) => {
        setViewMode(mode)
        
        // 뷰 모드에 따른 적절한 기본 범위 설정
        if (mode === 'day') {
            setViewRange(30) // 30일
        } else if (mode === 'week') {
            setViewRange(8) // 8주
        } else if (mode === 'month') {
            setViewRange(6) // 6개월
        } else if (mode === 'year') {
            setViewRange(3) // 3년
        }
    }
    
    // 드래그 앤 드롭 관련 함수
    const handleDragStart = (event, e) => {
        e.preventDefault(); // 기본 드래그 동작 방지
        setIsDragging(true);
        setMouseDownTime(Date.now());
        
        setDraggedEvent({
            eventId: event.id,
            startX: e.clientX,
            originalStart: new Date(event.start),
            originalEnd: new Date(event.end)
        })
        e.currentTarget.classList.add(styles.dragging);
        
        // 전역 이벤트 리스너 추가
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
    
    const handleDragEnd = (e) => {
        const wasDragging = isDragEvent();
        setIsDragging(false);
        
        if (draggedEvent) {
            const elements = document.querySelectorAll(`.${styles.dragging}`);
            elements.forEach(el => el.classList.remove(styles.dragging));
            setDraggedEvent(null);
            
            // 전역 이벤트 리스너 제거
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleDragEnd);
            
            // 드래그 완료 후 클릭 방지
            if (wasDragging) {
                e.stopPropagation();
            }
        }
    }
    
    const handleMouseMove = (e) => {
        if (draggedEvent) {
            setIsDragging(true);
            const days = getDaysArray();
            const ganttRect = ganttBodyRef.current.getBoundingClientRect();
            const deltaX = e.clientX - draggedEvent.startX;
            
            // 날짜 계산을 위한 값
            const pixelsPerDay = ganttRect.width / days.length;
            const daysDelta = Math.round(deltaX / pixelsPerDay);
            
            // 새로운 시작일/종료일 계산
            const newStartDate = new Date(draggedEvent.originalStart);
            newStartDate.setDate(newStartDate.getDate() + daysDelta);
            
            const newEndDate = new Date(draggedEvent.originalEnd);
            newEndDate.setDate(newEndDate.getDate() + daysDelta);
            
            // 이벤트 업데이트
            setEvents(prevEvents => 
                prevEvents.map(event => 
                    event.id === draggedEvent.eventId
                        ? { 
                            ...event, 
                            start: newStartDate.toISOString(),
                            end: newEndDate.toISOString()
                        }
                        : event
                )
            )
        }
    }
    
    // 리사이징 관련 함수
    const handleResizeStart = (event, e, direction) => {
        e.preventDefault(); // 기본 드래그 동작 방지
        e.stopPropagation(); // 상위 요소로 이벤트 전파 방지
        setIsDragging(true);
        setMouseDownTime(Date.now());
        
        setResizingEvent({
            eventId: event.id,
            startX: e.clientX,
            originalStart: new Date(event.start),
            originalEnd: new Date(event.end),
            direction
        })
        e.currentTarget.parentElement.classList.add(styles.resizing);
        
        // 전역 이벤트 리스너 추가
        document.addEventListener('mousemove', handleMouseMoveForResize);
        document.addEventListener('mouseup', handleResizeEnd);
    }
    
    const handleResizeEnd = (e) => {
        const wasDragging = isDragEvent();
        setIsDragging(false);
        
        if (resizingEvent) {
            const elements = document.querySelectorAll(`.${styles.resizing}`);
            elements.forEach(el => el.classList.remove(styles.resizing));
            setResizingEvent(null);
            
            // 전역 이벤트 리스너 제거
            document.removeEventListener('mousemove', handleMouseMoveForResize);
            document.removeEventListener('mouseup', handleResizeEnd);
            
            // 드래그 완료 후 클릭 방지
            if (wasDragging) {
                e.stopPropagation();
            }
        }
    }
    
    const handleMouseMoveForResize = (e) => {
        if (resizingEvent) {
            setIsDragging(true);
            const days = getDaysArray();
            const ganttRect = ganttBodyRef.current.getBoundingClientRect();
            const deltaX = e.clientX - resizingEvent.startX;
            
            // 날짜 계산을 위한 값
            const pixelsPerDay = ganttRect.width / days.length;
            const daysDelta = Math.round(deltaX / pixelsPerDay);
            
            // 새로운 시작일/종료일 계산
            let newStartDate = new Date(resizingEvent.originalStart);
            let newEndDate = new Date(resizingEvent.originalEnd);
            
            if (resizingEvent.direction === 'left') {
                newStartDate.setDate(newStartDate.getDate() + daysDelta);
                // 시작일이 종료일을 넘어가지 않도록
                if (newStartDate >= newEndDate) {
                    newStartDate = new Date(newEndDate);
                    newStartDate.setDate(newEndDate.getDate() - 1);
                }
            } else {
                newEndDate.setDate(newEndDate.getDate() + daysDelta);
                // 종료일이 시작일보다 이전이 되지 않도록
                if (newEndDate <= newStartDate) {
                    newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newStartDate.getDate() + 1);
                }
            }
            
            // 이벤트 업데이트
            setEvents(prevEvents => 
                prevEvents.map(event => 
                    event.id === resizingEvent.eventId
                        ? { 
                            ...event, 
                            start: newStartDate.toISOString(),
                            end: newEndDate.toISOString()
                        }
                        : event
                )
            )
        }
    }
    
    // 사이드바 리사이징 함수
    const handleSidebarResizeStart = (e) => {
        e.preventDefault();
        setResizingSidebar(true);
        
        // 리사이즈 이벤트 리스너 추가
        document.addEventListener('mousemove', handleSidebarResize);
        document.addEventListener('mouseup', handleSidebarResizeEnd);
    }
    
    const handleSidebarResize = (e) => {
        if (resizingSidebar) {
            // 최소 너비 150px, 최대 너비 500px로 제한
            const newWidth = Math.max(150, Math.min(500, e.clientX));
            setSidebarWidth(newWidth);
            
            // 사이드바 관련 요소들 스타일 업데이트
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        }
    }
    
    const handleSidebarResizeEnd = () => {
        setResizingSidebar(false);
        
        // 리사이즈 이벤트 리스너 제거
        document.removeEventListener('mousemove', handleSidebarResize);
        document.removeEventListener('mouseup', handleSidebarResizeEnd);
    }
    
    // 사이드바 CSS 변수 설정
    useEffect(() => {
        // 초기 사이드바 너비 설정
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }, []);
    
    // 이벤트 상세 모달 표시
    const showEventDetail = (event) => {
        // 드래그 중에는 모달 열지 않음
        if (!isDragging && !isDragEvent()) {
            setEventDetailModal(event);
        }
    }
    
    // 프로젝트 접기/펼치기
    const toggleProjectCollapse = (projectId) => {
        setCollapsedProjects(prev => {
            if (prev.includes(projectId)) {
                return prev.filter(id => id !== projectId);
            } else {
                return [...prev, projectId];
            }
        })
    }
    
    // 이벤트 옵션 토글
    const toggleEventOptions = (eventId, e) => {
        e.stopPropagation();
        if (showEventOptions === eventId) {
            setShowEventOptions(null);
        } else {
            setShowEventOptions(eventId);
        }
    }
    
    // 이벤트 호버
    const handleEventHover = (event) => {
        setHoveredEvent(event.id);
    }
    
    const handleEventLeave = () => {
        setHoveredEvent(null);
    }
    
    // 뷰 렌더링
    const renderGanttHeader = () => {
        const days = getDaysArray();
        
        return (
            <div className={styles.ganttHeader}>
                <div 
                    className={styles.ganttSidebarHeader}
                    style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
                >
                    <span>프로젝트 / 일정</span>
                </div>
                <div className={styles.sidebarResizeHandle} onMouseDown={handleSidebarResizeStart}>
                    <FaGripLines />
                </div>
                <div className={styles.ganttTimelineHeader}>
                    {days.map((day, index) => {
                        // 뷰 모드에 따라 헤더 렌더링 방식 변경
                        if (viewMode === 'day') {
                            return (
                                <div
                                    key={index}
                                    className={`${styles.ganttHeaderDay} ${isToday(day) ? styles.today : ''} ${
                                        day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''
                                    }`}
                                >
                                    {index === 0 || day.getDate() === 1 ? (
                                        <div className={styles.ganttHeaderMonth}>
                                            {day.toLocaleDateString('ko-KR', { month: 'short' })}
                                        </div>
                                    ) : null}
                                    <div className={styles.ganttHeaderDayNumber}>
                                        {day.getDate()}
                                    </div>
                                    <div className={styles.ganttHeaderDayName}>
                                        {day.toLocaleDateString('ko-KR', { weekday: 'short' })}
                                    </div>
                                </div>
                            )
                        } else if (viewMode === 'week') {
                            // 주간 뷰
                            const weekEnd = new Date(day)
                            weekEnd.setDate(day.getDate() + 6)
                            
                            return (
                                <div
                                    key={index}
                                    className={`${styles.ganttHeaderWeek} ${isToday(day) ? styles.today : ''}`}
                                >
                                    <div className={styles.ganttHeaderMonth}>
                                        {index === 0 || day.getDate() <= 7 ? 
                                            day.toLocaleDateString('ko-KR', { month: 'short' }) : ''}
                                    </div>
                                    <div className={styles.ganttHeaderWeekNumber}>
                                        {`${day.getDate()}일 - ${weekEnd.getDate()}일`}
                                    </div>
                                    <div className={styles.ganttHeaderWeekLabel}>
                                        {getWeekNumber(day)}주차
                                    </div>
                                </div>
                            )
                        } else if (viewMode === 'month') {
                            // 월간 뷰
                            return (
                                <div
                                    key={index}
                                    className={`${styles.ganttHeaderMonth} ${isToday(day) ? styles.today : ''}`}
                                >
                                    <div className={styles.ganttHeaderMonthYear}>
                                        {index === 0 || day.getMonth() === 0 ? 
                                            day.getFullYear() : ''}
                                    </div>
                                    <div className={styles.ganttHeaderMonthName}>
                                        {day.toLocaleDateString('ko-KR', { month: 'long' })}
                                    </div>
                                </div>
                            )
                        } else if (viewMode === 'year') {
                            // 연간 뷰
                            return (
                                <div
                                    key={index}
                                    className={`${styles.ganttHeaderYear} ${isToday(day) ? styles.today : ''}`}
                                >
                                    <div className={styles.ganttHeaderYearNumber}>
                                        {day.getFullYear()}
                                    </div>
                                </div>
                            )
                        }
                    })}
                </div>
            </div>
        )
    }
    
    // 주 번호 계산
    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    
    const renderGanttBody = () => {
        const days = getDaysArray();
        const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
        
        return (
            <div 
                className={styles.ganttBody} 
                ref={ganttBodyRef}
            >
                {sortedProjects.map(project => {
                    const projectEvents = events.filter(event => event.projectId === project.id);
                    const isCollapsed = collapsedProjects.includes(project.id);
                    
                    return (
                        <div key={project.id} className={styles.ganttProjectGroup}>
                            <div className={styles.ganttProjectRow}>
                                <div 
                                    className={styles.ganttSidebarCell}
                                    style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
                                >
                                    <button 
                                        className={styles.collapseButton}
                                        onClick={() => toggleProjectCollapse(project.id)}
                                    >
                                        {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                                    </button>
                                    <div 
                                        className={styles.projectLabel}
                                        style={{ 
                                            backgroundColor: `var(--color-tag-${project.color})`
                                        }}
                                    >
                                        {project.name}
                                    </div>
                                    <div className={styles.taskCount}>
                                        {projectEvents.length}개 일정
                                    </div>
                                </div>
                                <div className={styles.sidebarResizeHandleBody} onMouseDown={handleSidebarResizeStart}>
                                    <FaGripLines />
                                </div>
                                <div className={styles.ganttTimelineCell}>
                                    {days.map((day, dayIndex) => {
                                        if (viewMode === 'day') {
                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`${styles.ganttTimelineDay} ${
                                                        isToday(day) ? styles.today : ''
                                                    } ${
                                                        day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''
                                                    }`}
                                                />
                                            )
                                        } else if (viewMode === 'week') {
                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`${styles.ganttTimelineWeek} ${
                                                        isToday(day) ? styles.today : ''
                                                    }`}
                                                />
                                            )
                                        } else if (viewMode === 'month') {
                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`${styles.ganttTimelineMonth} ${
                                                        isToday(day) ? styles.today : ''
                                                    }`}
                                                />
                                            )
                                        } else if (viewMode === 'year') {
                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`${styles.ganttTimelineYear} ${
                                                        isToday(day) ? styles.today : ''
                                                    }`}
                                                />
                                            )
                                        }
                                    })}
                                    
                                    {!isCollapsed && projectEvents.map(event => (
                                        <div 
                                            key={event.id}
                                            className={`${styles.ganttBar} ${hoveredEvent === event.id ? styles.hovered : ''}`}
                                            style={{
                                                ...getEventPosition(event, days),
                                                backgroundColor: `var(--color-tag-${project.color})`
                                            }}
                                            onMouseDown={(e) => handleDragStart(event, e)}
                                            onClick={(e) => {
                                                if (!isDragEvent()) {
                                                    showEventDetail(event);
                                                }
                                            }}
                                            onMouseEnter={() => handleEventHover(event)}
                                            onMouseLeave={handleEventLeave}
                                        >
                                            <div 
                                                className={styles.resizeHandleLeft}
                                                onMouseDown={(e) => handleResizeStart(event, e, 'left')}
                                            />
                                            
                                            <div 
                                                className={styles.ganttBarProgress}
                                                style={{ width: `${event.progress}%` }}
                                            />
                                            
                                            <div className={styles.ganttBarLabel}>
                                                {event.title}
                                                {event.progress > 0 && viewMode !== 'year' && (
                                                    <span className={styles.progressText}>
                                                        {event.progress}%
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <button 
                                                className={styles.ganttBarOptions}
                                                onClick={(e) => toggleEventOptions(event.id, e)}
                                            >
                                                <FaEllipsisH />
                                            </button>
                                            
                                            <div 
                                                className={styles.resizeHandleRight}
                                                onMouseDown={(e) => handleResizeStart(event, e, 'right')}
                                            />
                                            
                                            {showEventOptions === event.id && (
                                                <div className={styles.ganttBarOptionsMenu}>
                                                    <button onClick={() => showEventDetail(event)}>
                                                        <FaEdit /> 수정
                                                    </button>
                                                    <button>
                                                        <FaTrash /> 삭제
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {!isCollapsed && projectEvents.map(event => (
                                <div key={event.id} className={styles.ganttTaskRow}>
                                    <div 
                                        className={styles.ganttSidebarCell}
                                        style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
                                    >
                                        <div className={styles.taskLabel}>
                                            {event.title}
                                        </div>
                                    </div>
                                    <div className={styles.ganttTimelineCell}>
                                        {days.map((day, dayIndex) => {
                                            if (viewMode === 'day') {
                                                return (
                                                    <div 
                                                        key={dayIndex} 
                                                        className={`${styles.ganttTimelineDay} ${
                                                            isToday(day) ? styles.today : ''
                                                        } ${
                                                            day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''
                                                        }`}
                                                    />
                                                )
                                            } else if (viewMode === 'week') {
                                                return (
                                                    <div 
                                                        key={dayIndex} 
                                                        className={`${styles.ganttTimelineWeek} ${
                                                            isToday(day) ? styles.today : ''
                                                        }`}
                                                    />
                                                )
                                            } else if (viewMode === 'month') {
                                                return (
                                                    <div 
                                                        key={dayIndex} 
                                                        className={`${styles.ganttTimelineMonth} ${
                                                            isToday(day) ? styles.today : ''
                                                        }`}
                                                    />
                                                )
                                            } else if (viewMode === 'year') {
                                                return (
                                                    <div 
                                                        key={dayIndex} 
                                                        className={`${styles.ganttTimelineYear} ${
                                                            isToday(day) ? styles.today : ''
                                                        }`}
                                                    />
                                                )
                                            }
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
        )
    }
    
    // 이벤트 상세 모달 렌더링
    const renderEventDetailModal = () => {
        if (!eventDetailModal) return null;
        
        const event = eventDetailModal;
        const project = projects.find(p => p.id === event.projectId);
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const assignee = users.find(user => event.assignees && event.assignees.includes(user.id));
        
        return (
            <div className={styles.modalOverlay} onClick={() => setEventDetailModal(null)}>
                <div className={styles.eventDetailModal} onClick={e => e.stopPropagation()}>
                    <div 
                        className={styles.eventDetailHeader} 
                        style={{ backgroundColor: `var(--color-tag-${project.color})` }}
                    >
                        <h3>{event.title}</h3>
                        <button onClick={() => setEventDetailModal(null)}>
                            <FaTimes />
                        </button>
                    </div>
                    
                    <div className={styles.eventDetailContent}>
                        <div className={styles.eventDetailInfo}>
                            <div className={styles.eventDetailInfoItem}>
                                <FaCalendarAlt />
                                <div>
                                    <div className={styles.infoLabel}>기간</div>
                                    <div>
                                        {startDate.toLocaleDateString('ko-KR')} - {endDate.toLocaleDateString('ko-KR')}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.eventDetailInfoItem}>
                                <FaTag />
                                <div>
                                    <div className={styles.infoLabel}>프로젝트</div>
                                    <div>
                                        <span 
                                            className={styles.projectTag}
                                            style={{ backgroundColor: `var(--color-tag-${project.color})` }}
                                        >
                                            {project.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {assignee && (
                                <div className={styles.eventDetailInfoItem}>
                                    <FaUser />
                                    <div>
                                        <div className={styles.infoLabel}>담당자</div>
                                        <div>{assignee.name}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.eventProgressContainer}>
                            <div className={styles.progressHeader}>
                                <h4>진행률</h4>
                                <span>{event.progress}%</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBar}
                                    style={{ 
                                        width: `${event.progress}%`,
                                        backgroundColor: `var(--color-tag-${project.color})`
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className={styles.eventActions}>
                            <button className={styles.actionButton}>
                                <FaEdit /> 수정
                            </button>
                            <button className={styles.deleteButton}>
                                <FaTrash /> 삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    // 메인 렌더링
    return (
        <div className={styles.ganttContainer}>
            <div className={styles.ganttControls}>
                <div className={styles.ganttNavigation}>
                    <button className={styles.todayButton} onClick={goToToday}>
                        <FaRegStar /> 오늘
                    </button>
                    <button className={styles.navButton} onClick={goToPrevious}><FaChevronLeft /></button>
                    <span className={styles.dateDisplay}>{formatMonthYear(currentDate)}</span>
                    <button className={styles.navButton} onClick={goToNext}><FaChevronRight /></button>
                </div>
                
                <div className={styles.ganttViewOptions}>
                    <div className={styles.viewModeSelector}>
                        <button 
                            className={`${styles.viewModeButton} ${viewMode === 'day' ? styles.active : ''}`}
                            onClick={() => handleViewModeChange('day')}
                        >
                            일
                        </button>
                        <button 
                            className={`${styles.viewModeButton} ${viewMode === 'week' ? styles.active : ''}`}
                            onClick={() => handleViewModeChange('week')}
                        >
                            주
                        </button>
                        <button 
                            className={`${styles.viewModeButton} ${viewMode === 'month' ? styles.active : ''}`}
                            onClick={() => handleViewModeChange('month')}
                        >
                            월
                        </button>
                        <button 
                            className={`${styles.viewModeButton} ${viewMode === 'year' ? styles.active : ''}`}
                            onClick={() => handleViewModeChange('year')}
                        >
                            년
                        </button>
                    </div>
                    
                    {viewMode === 'day' && (
                        <select 
                            value={viewRange}
                            onChange={(e) => setViewRange(Number(e.target.value))}
                            className={styles.viewRangeSelect}
                        >
                            <option value={14}>2주</option>
                            <option value={30}>1개월</option>
                            <option value={60}>2개월</option>
                            <option value={90}>3개월</option>
                        </select>
                    )}
                    
                    {viewMode === 'week' && (
                        <select 
                            value={viewRange}
                            onChange={(e) => setViewRange(Number(e.target.value))}
                            className={styles.viewRangeSelect}
                        >
                            <option value={4}>4주</option>
                            <option value={8}>8주</option>
                            <option value={12}>12주</option>
                            <option value={16}>16주</option>
                        </select>
                    )}
                    
                    {viewMode === 'month' && (
                        <select 
                            value={viewRange}
                            onChange={(e) => setViewRange(Number(e.target.value))}
                            className={styles.viewRangeSelect}
                        >
                            <option value={3}>3개월</option>
                            <option value={6}>6개월</option>
                            <option value={9}>9개월</option>
                            <option value={12}>12개월</option>
                        </select>
                    )}
                    
                    {viewMode === 'year' && (
                        <select 
                            value={viewRange}
                            onChange={(e) => setViewRange(Number(e.target.value))}
                            className={styles.viewRangeSelect}
                        >
                            <option value={3}>3년</option>
                            <option value={5}>5년</option>
                            <option value={10}>10년</option>
                        </select>
                    )}
                    
                    <button className={styles.addTaskButton}>
                        <FaPlus /> 일정 추가
                    </button>
                </div>
            </div>
            
            <div className={styles.ganttChart}>
                {renderGanttHeader()}
                {renderGanttBody()}
            </div>
            
            {renderEventDetailModal()}
        </div>
    )
}

export default GanttView
