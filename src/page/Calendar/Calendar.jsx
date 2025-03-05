import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ss from './Calendar.module.css'
import { 
    FaCalendarAlt, 
    FaPlus, 
    FaTrash, 
    FaEdit, 
    FaCheck, 
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaMapMarkerAlt,
    FaUsers,
    FaRegClock,
    FaRegStar,
    FaUser,
    FaCalendarDay
} from 'react-icons/fa'
import { events, addEvent, updateEvent, deleteEvent } from '../../data/mockDatabase'
import { users, currentUser } from '../../data/mockDatabase'
import EventModal from './EventModal'
import EventsModal from './EventsModal'
import QuickEventModal from './QuickEventModal'

/**
 * 캘린더 컴포넌트
 * 
 * @returns {JSX.Element}
 */
const Calendar = () => {
    const navigate = useNavigate()
    
    // 상태 관리
    const [events, setEvents] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [showEventForm, setShowEventForm] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [eventFormData, setEventFormData] = useState({
        title: '',
        start: '',
        end: '',
        location: '',
        participants: [],
        colorTag: Math.floor(Math.random() * 10) + 1 // 기본값으로 랜덤 컬러 태그 설정
    })
    const [viewMode, setViewMode] = useState('month') // month, week, day
    
    // 더 보기 모달 상태
    const [showEventsModal, setShowEventsModal] = useState(false)
    const [eventsModalDate, setEventsModalDate] = useState(null)
    const [eventsModalEvents, setEventsModalEvents] = useState([])
    
    // 퀵 이벤트 모달 상태
    const [showQuickModal, setShowQuickModal] = useState(false)
    const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 })
    const [draggedTimeRange, setDraggedTimeRange] = useState({ start: '', end: '' })
    
    // 드래그 관련 상태
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState(null)
    const [dragEnd, setDragEnd] = useState(null)
    const dragRef = useRef(null)
    
    // 초기 데이터 로드
    useEffect(() => {
        // 현재 날짜로 이벤트 날짜 업데이트
        const today = new Date();
        const updatedEvents = events.map(event => {
            // 이벤트 날짜를 현재 연도와 월로 업데이트
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            
            startDate.setFullYear(today.getFullYear());
            startDate.setMonth(today.getMonth());
            
            endDate.setFullYear(today.getFullYear());
            endDate.setMonth(today.getMonth());
            
            // 일부 이벤트는 다음 달에 배치
            if (event.id % 3 === 0) {
                startDate.setMonth(today.getMonth() + 1);
                endDate.setMonth(today.getMonth() + 1);
            }
            
            // 일부 이벤트는 이전 달에 배치
            if (event.id % 5 === 0) {
                startDate.setMonth(today.getMonth() - 1);
                endDate.setMonth(today.getMonth() - 1);
            }
            
            return {
                ...event,
                start: startDate.toISOString(),
                end: endDate.toISOString()
            };
        });
        
        setEvents(updatedEvents);
    }, [])
    
    // 날짜 관련 함수들
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate()
    }
    
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay()
    }
    
    const getPreviousMonthDays = (year, month) => {
        const firstDay = getFirstDayOfMonth(year, month)
        const prevMonthDays = []
        
        if (firstDay > 0) {
            const prevMonth = month === 0 ? 11 : month - 1
            const prevMonthYear = month === 0 ? year - 1 : year
            const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth)
            
            for (let i = 0; i < firstDay; i++) {
                const day = daysInPrevMonth - firstDay + i + 1
                prevMonthDays.push({
                    date: new Date(prevMonthYear, prevMonth, day),
                    isCurrentMonth: false
                })
            }
        }
        
        return prevMonthDays
    }
    
    const getCurrentMonthDays = (year, month) => {
        const daysInMonth = getDaysInMonth(year, month)
        const currentMonthDays = []
        
        for (let day = 1; day <= daysInMonth; day++) {
            currentMonthDays.push({
                date: new Date(year, month, day),
                isCurrentMonth: true
            })
        }
        
        return currentMonthDays
    }
    
    const getNextMonthDays = (year, month, currentDays) => {
        const totalDaysShown = 42 // 6 rows of 7 days
        const nextMonthDays = []
        const daysNeeded = totalDaysShown - currentDays.length
        
        if (daysNeeded > 0) {
            const nextMonth = month === 11 ? 0 : month + 1
            const nextMonthYear = month === 11 ? year + 1 : year
            
            for (let day = 1; day <= daysNeeded; day++) {
                nextMonthDays.push({
                    date: new Date(nextMonthYear, nextMonth, day),
                    isCurrentMonth: false
                })
            }
        }
        
        return nextMonthDays
    }
    
    const getAllDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        const prevMonthDays = getPreviousMonthDays(year, month)
        const currentMonthDays = getCurrentMonthDays(year, month)
        const allCurrentDays = [...prevMonthDays, ...currentMonthDays]
        const nextMonthDays = getNextMonthDays(year, month, allCurrentDays)
        
        return [...allCurrentDays, ...nextMonthDays]
    }
    
    const getWeekDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const date = currentDate.getDate()
        
        // 현재 날짜의 요일 (0: 일요일, 6: 토요일)
        const dayOfWeek = currentDate.getDay()
        
        // 주의 시작일 (일요일)
        const startDate = new Date(year, month, date - dayOfWeek)
        
        const weekDays = []
        
        // 일주일 (7일) 생성
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startDate)
            currentDay.setDate(startDate.getDate() + i)
            
            weekDays.push({
                date: currentDay,
                isCurrentMonth: currentDay.getMonth() === month
            })
        }
        
        return weekDays
    }
    
    // 이벤트 관련 함수들
    const getDayEvents = (date) => {
        if (!date) return []
        
        return events.filter(event => {
            const eventDate = new Date(event.start)
            
            // 날짜 비교 시 년, 월, 일만 비교하여 시간대 문제 해결
            return (
                eventDate.getFullYear() === date.getFullYear() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getDate() === date.getDate()
            )
        })
    }
    
    // 네비게이션 함수들
    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setMonth(prevDate.getMonth() - 1)
            return newDate
        })
    }
    
    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setMonth(prevDate.getMonth() + 1)
            return newDate
        })
    }
    
    const goToPreviousWeek = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() - 7)
            return newDate
        })
    }
    
    const goToNextWeek = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() + 7)
            return newDate
        })
    }
    
    const goToPreviousDay = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() - 1)
            return newDate
        })
    }
    
    const goToNextDay = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() + 1)
            return newDate
        })
    }
    
    const goToToday = () => {
        setCurrentDate(new Date())
    }
    
    // 이벤트 핸들러
    const handleDateClick = (date) => {
        setSelectedDate(date)
        
        // 현재 시간 가져오기
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        
        // 시작 시간 설정 (현재 시간)
        const startDate = new Date(date)
        startDate.setHours(hours)
        startDate.setMinutes(minutes)
        startDate.setSeconds(0)
        startDate.setMilliseconds(0)
        
        // 종료 시간 설정 (시작 시간 + 1시간)
        const endDate = new Date(startDate)
        endDate.setHours(hours + 1)
        
        setEventFormData({
            title: '',
            start: formatDateTimeForInput(startDate),
            end: formatDateTimeForInput(endDate),
            location: '',
            participants: [currentUser.id] // 현재 사용자를 기본 참석자로 추가
        })
        
        setSelectedEvent(null)
        setShowEventForm(true)
    }
    
    const handleEventClick = (event) => {
        setSelectedEvent(event)
        setEventFormData({
            title: event.title,
            start: formatDateTimeForInput(new Date(event.start)),
            end: formatDateTimeForInput(new Date(event.end)),
            location: event.location || '',
            participants: event.participants || []
        })
        setShowEventForm(true)
    }
    
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setEventFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    const handleParticipantChange = (userId) => {
        setEventFormData(prev => {
            const participants = [...prev.participants]
            
            if (participants.includes(userId)) {
                // 이미 선택된 참석자라면 제거
                return {
                    ...prev,
                    participants: participants.filter(id => id !== userId)
                }
            } else {
                // 선택되지 않은 참석자라면 추가
                return {
                    ...prev,
                    participants: [...participants, userId]
                }
            }
        })
    }
    
    const handleFormSubmit = (e) => {
        e.preventDefault()
        
        // 시간대 문제 해결을 위한 날짜 처리 수정
        const startDate = new Date(eventFormData.start)
        const endDate = new Date(eventFormData.end)
        
        const eventData = {
            ...eventFormData,
            start: startDate.toISOString(),
            end: endDate.toISOString()
        }
        
        if (selectedEvent) {
            // 기존 이벤트 수정
            const updatedEvent = {
                ...selectedEvent,
                ...eventData
            }
            
            // mockDatabase의 updateEvent 함수 호출
            updateEvent(updatedEvent)
            
            setEvents(prev => 
                prev.map(event => 
                    event.id === selectedEvent.id ? updatedEvent : event
                )
            )
        } else {
            // 새 이벤트 추가
            const newEvent = addEvent(eventData)
            setEvents(prev => [...prev, newEvent])
        }
        
        // 폼 초기화 및 닫기
        setShowEventForm(false)
        setSelectedEvent(null)
        setEventFormData({
            title: '',
            start: '',
            end: '',
            location: '',
            participants: []
        })
    }
    
    const handleDeleteEvent = () => {
        if (selectedEvent) {
            // mockDatabase의 deleteEvent 함수 호출
            deleteEvent(selectedEvent.id)
            
            setEvents(prev => prev.filter(event => event.id !== selectedEvent.id))
            
            // 폼 초기화 및 닫기
            setShowEventForm(false)
            setSelectedEvent(null)
        }
    }
    
    const handleCancelForm = () => {
        setShowEventForm(false)
        setSelectedEvent(null)
    }
    
    // 드래그 이벤트 핸들러
    const handleDragStart = (e, date) => {
        e.preventDefault()
        e.stopPropagation() // 이벤트 버블링 방지
        
        // 이미 드래그 중이면 이전 드래그 정리
        if (isDragging) {
            document.removeEventListener('mousemove', handleDragMove)
            document.removeEventListener('mouseup', handleDragEnd)
        }
        
        // 드래그 상태 설정
        setIsDragging(true)
        
        // 날짜 처리 - 문자열이면 Date 객체로 변환, 이미 Date 객체면 그대로 사용
        let dateObj;
        if (typeof date === 'string') {
            dateObj = new Date(date);
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            console.error('유효하지 않은 날짜 형식:', date);
            dateObj = new Date(); // 기본값으로 현재 날짜 사용
        }
        
        // 시작일 설정 (시간 부분 제거)
        const startDateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0)
        
        // 상태 업데이트
        setDragStart(startDateOnly)
        setDragEnd(startDateOnly)
        
        // 드래그 시작 시 참조 저장
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startDate: startDateOnly,
            endDate: startDateOnly, // 종료 날짜도 저장
            startElement: e.currentTarget
        }
        
        console.log('드래그 시작:', {
            date: dateObj.toLocaleString(),
            startDate: startDateOnly.toLocaleString()
        });
        
        // 드래그 시작 요소에 시각적 효과 추가
        const target = e.currentTarget;
        if (target) {
            target.classList.add(ss.dragOver);
        }
        
        // 전역 이벤트 리스너 추가
        document.addEventListener('mousemove', handleDragMove)
        document.addEventListener('mouseup', handleDragEnd)
    }
    
    const handleDragMove = (e) => {
        if (!isDragging || !dragRef.current) return
        
        // 마우스 이동 중 날짜 계산
        let currentElement = null;
        
        try {
            // elementsFromPoint 메서드 사용 (모던 브라우저)
            if (document.elementsFromPoint) {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                // 먼저 직접 data-date 속성을 가진 요소 찾기
                currentElement = elements.find(el => el.dataset && el.dataset.date);
                
                // 없으면 부모 요소 중에서 찾기
                if (!currentElement) {
                    for (const el of elements) {
                        let parent = el;
                        // 최대 5번까지만 부모 요소 탐색 (성능 고려)
                        for (let i = 0; i < 5 && parent; i++) {
                            if (parent.dataset && parent.dataset.date) {
                                currentElement = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                        if (currentElement) break;
                    }
                }
            } 
            // 대체 방법: elementFromPoint 사용 (이전 브라우저)
            else {
                currentElement = document.elementFromPoint(e.clientX, e.clientY);
                // 데이터 속성 확인
                if (!(currentElement && currentElement.dataset && currentElement.dataset.date)) {
                    // 부모 요소 확인 (가끔 내부 요소가 선택될 수 있음)
                    let parent = currentElement ? currentElement.parentElement : null;
                    // 최대 5번까지만 부모 요소 탐색 (성능 고려)
                    for (let i = 0; i < 5 && parent; i++) {
                        if (parent.dataset && parent.dataset.date) {
                            currentElement = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
            }
            
            if (currentElement && currentElement.dataset && currentElement.dataset.date) {
                const currentDate = new Date(currentElement.dataset.date);
                // 현재 날짜 설정 (시간 부분 제거)
                const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
                setDragEnd(currentDateOnly);
                
                // dragRef에도 종료 날짜 업데이트
                if (dragRef.current) {
                    dragRef.current.endDate = currentDateOnly;
                }
                
                console.log('드래그 이동:', {
                    endDate: currentDateOnly.toLocaleString()
                });
                
                // 모든 드래그 효과 제거
                // 월간 뷰
                document.querySelectorAll(`.${ss.calendarDay}`).forEach(el => {
                    el.classList.remove(ss.dragOver);
                });
                
                // 주간 뷰
                document.querySelectorAll(`.${ss.weekDayContent}`).forEach(el => {
                    el.classList.remove(ss.dragOver);
                });
                
                // 일간 뷰
                document.querySelectorAll(`.${ss.dayContent}`).forEach(el => {
                    el.classList.remove(ss.dragOver);
                });
                
                // 구간 드래그 효과 적용
                // 시작일과 종료일 정렬
                let startDate = new Date(dragRef.current.startDate);
                let endDate = currentDateOnly;
                
                if (startDate > endDate) {
                    [startDate, endDate] = [endDate, startDate];
                }
                
                // 날짜 범위 내의 모든 요소에 드래그 효과 적용
                // 월간 뷰
                document.querySelectorAll(`.${ss.calendarDay}[data-date]`).forEach(el => {
                    try {
                        const elDate = new Date(el.dataset.date);
                        // 날짜 비교를 위해 시간 부분을 제거
                        const elDateOnly = new Date(elDate.getFullYear(), elDate.getMonth(), elDate.getDate());
                        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                        
                        if (elDateOnly >= startDateOnly && elDateOnly <= endDateOnly) {
                            el.classList.add(ss.dragOver);
                        }
                    } catch (err) {
                        console.error('날짜 비교 오류:', err);
                    }
                });
                
                // 주간 뷰
                document.querySelectorAll(`.${ss.weekDayContent}[data-date]`).forEach(el => {
                    try {
                        const elDate = new Date(el.dataset.date);
                        // 날짜 비교를 위해 시간 부분을 제거
                        const elDateOnly = new Date(elDate.getFullYear(), elDate.getMonth(), elDate.getDate());
                        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                        
                        if (elDateOnly >= startDateOnly && elDateOnly <= endDateOnly) {
                            el.classList.add(ss.dragOver);
                        }
                    } catch (err) {
                        console.error('날짜 비교 오류:', err);
                    }
                });
                
                // 일간 뷰 (일간 뷰는 하나의 날짜만 표시하므로 현재 날짜가 범위 내에 있는지 확인)
                document.querySelectorAll(`.${ss.dayContent}[data-date]`).forEach(el => {
                    try {
                        const elDate = new Date(el.dataset.date);
                        // 날짜 비교를 위해 시간 부분을 제거
                        const elDateOnly = new Date(elDate.getFullYear(), elDate.getMonth(), elDate.getDate());
                        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                        
                        if (elDateOnly >= startDateOnly && elDateOnly <= endDateOnly) {
                            el.classList.add(ss.dragOver);
                        }
                    } catch (err) {
                        console.error('날짜 비교 오류:', err);
                    }
                });
            }
        } catch (err) {
            console.error('드래그 이동 오류:', err);
        }
    }
    
    const handleDragEnd = (e) => {
        if (!isDragging || !dragRef.current) return
        
        // 전역 이벤트 리스너 제거
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        
        // 마우스 아래에 있는 요소 찾기
        let endElement = null;
        
        try {
            // elementsFromPoint 메서드 사용 (모던 브라우저)
            if (document.elementsFromPoint) {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                endElement = elements.find(el => el.dataset && el.dataset.date);
            } 
            // 대체 방법: elementFromPoint 사용 (이전 브라우저)
            else {
                endElement = document.elementFromPoint(e.clientX, e.clientY);
                // 데이터 속성 확인
                if (!(endElement && endElement.dataset && endElement.dataset.date)) {
                    // 부모 요소 확인 (가끔 내부 요소가 선택될 수 있음)
                    let parent = endElement ? endElement.parentElement : null;
                    while (parent && !(parent.dataset && parent.dataset.date)) {
                        parent = parent.parentElement;
                    }
                    if (parent && parent.dataset && parent.dataset.date) {
                        endElement = parent;
                    }
                }
            }
            
            // 종료 날짜 설정
            if (endElement && endElement.dataset && endElement.dataset.date) {
                const endDate = new Date(endElement.dataset.date);
                // 종료일 설정 (시간 부분 제거)
                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0);
                setDragEnd(endDateOnly);
                
                // dragRef에도 종료 날짜 업데이트
                if (dragRef.current) {
                    dragRef.current.endDate = endDateOnly;
                }
            }
        } catch (err) {
            console.error('드래그 종료 오류:', err);
        }
        
        // 드래그 효과 제거 - 모든 뷰에 적용
        // 월간 뷰
        document.querySelectorAll(`.${ss.calendarDay}`).forEach(el => {
            el.classList.remove(ss.dragOver);
            el.classList.remove(ss.dragging);
        });
        
        // 주간 뷰
        document.querySelectorAll(`.${ss.weekDayContent}`).forEach(el => {
            el.classList.remove(ss.dragOver);
            el.classList.remove(ss.dragging);
        });
        
        // 일간 뷰
        document.querySelectorAll(`.${ss.dayContent}`).forEach(el => {
            el.classList.remove(ss.dragOver);
            el.classList.remove(ss.dragging);
        });
        
        // 드래그 종료 처리
        setIsDragging(false)
        
        // 시작일과 종료일이 있으면 퀵 모달 표시
        if (dragStart && dragEnd) {
            try {
                // 시작일이 종료일보다 나중이면 교체
                let startDate = dragRef.current ? new Date(dragRef.current.startDate) : new Date(dragStart);
                let endDate = dragRef.current ? new Date(dragRef.current.endDate) : new Date(dragEnd);
                
                console.log('드래그 종료 - 원본 날짜:', {
                    startDate: startDate.toLocaleString(),
                    endDate: endDate.toLocaleString()
                });
                
                if (startDate > endDate) {
                    [startDate, endDate] = [endDate, startDate];
                    console.log('날짜 교체 후:', {
                        startDate: startDate.toLocaleString(),
                        endDate: endDate.toLocaleString()
                    });
                }
                
                // 드래그된 시간 범위 설정 - 시작일은 00:00:00, 종료일은 23:59:59로 설정
                const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
                const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                
                setDraggedTimeRange({
                    start: rangeStart,
                    end: rangeEnd
                });
                
                console.log('설정된 draggedTimeRange:', {
                    start: rangeStart.toLocaleString(),
                    end: rangeEnd.toLocaleString()
                });
                
                // 퀵 모달 위치 설정 (마우스 위치 기준)
                setQuickModalPosition({
                    x: e.clientX,
                    y: e.clientY
                })
                
                // 약간의 지연 후 퀵 모달 표시 (상태 업데이트 보장)
                setTimeout(() => {
                    // 드래그 범위가 유효한지 다시 확인
                    if (rangeStart && rangeEnd && !isNaN(rangeStart.getTime()) && !isNaN(rangeEnd.getTime())) {
                        setShowQuickModal(true)
                        console.log('퀵 모달 표시됨');
                    } else {
                        console.error('유효하지 않은 드래그 범위로 인해 퀵 모달이 표시되지 않음');
                    }
                }, 50)
                
                console.log('드래그 구간:', {
                    start: startDate.toLocaleDateString(),
                    end: endDate.toLocaleDateString()
                });
            } catch (err) {
                console.error('드래그 종료 오류:', err);
            }
        }
    }
    
    const handleQuickModalSubmit = (title) => {
        // 퀵 모달에서 제목만 입력받아 이벤트 생성
        if (title) {
            try {
                // 시작일과 종료일 확인
                let startDate, endDate;
                
                // draggedTimeRange가 유효하면 사용, 아니면 dragRef에서 가져옴
                if (draggedTimeRange.start && draggedTimeRange.end) {
                    startDate = new Date(draggedTimeRange.start);
                    endDate = new Date(draggedTimeRange.end);
                } else if (dragRef.current && dragRef.current.startDate && dragRef.current.endDate) {
                    startDate = new Date(dragRef.current.startDate);
                    endDate = new Date(dragRef.current.endDate);
                    
                    // 시작일이 종료일보다 나중이면 교체
                    if (startDate > endDate) {
                        [startDate, endDate] = [endDate, startDate];
                    }
                    
                    // 종료일은 하루의 끝으로 설정
                    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                } else {
                    console.error('유효한 날짜 범위가 없습니다');
                    setShowQuickModal(false);
                    return;
                }
                
                console.log('이벤트 생성 시 사용된 날짜 범위:', {
                    start: startDate.toLocaleString(),
                    end: endDate.toLocaleString()
                });
                
                // 날짜가 유효한지 확인
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error('유효하지 않은 날짜:', { startDate, endDate });
                    setShowQuickModal(false);
                    return;
                }
                
                // 새 이벤트 생성 - 시간 설정 없이 그대로 사용
                const newEvent = {
                    title,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    location: '',
                    participants: [],
                    colorTag: Math.floor(Math.random() * 10) + 1
                }
                
                console.log('새 이벤트 생성:', {
                    title,
                    start: startDate.toLocaleString(),
                    end: endDate.toLocaleString()
                });
                
                // 이벤트 추가
                const addedEvent = addEvent(newEvent)
                setEvents(prev => [...prev, addedEvent])
                
                // 퀵 모달 닫기
                setShowQuickModal(false)
                
                // 선택적으로 전체 이벤트 폼 열기
                handleEventClick(addedEvent)
            } catch (err) {
                console.error('이벤트 생성 오류:', err);
                setShowQuickModal(false)
            }
        } else {
            // 퀵 모달 닫기
            setShowQuickModal(false)
        }
    }
    
    const handleQuickModalCancel = () => {
        setShowQuickModal(false)
    }
    
    // 더 보기 모달 핸들러
    const handleMoreEventsClick = (date, events) => {
        setEventsModalDate(date)
        setEventsModalEvents(events)
        setShowEventsModal(true)
    }
    
    const handleCloseEventsModal = () => {
        setShowEventsModal(false)
        setEventsModalDate(null)
        setEventsModalEvents([])
    }
    
    // 유틸리티 함수
    const formatDateTimeForInput = (date) => {
        // 로컬 시간대를 고려한 ISO 문자열 생성
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }
    
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        })
    }
    
    const formatMonth = (date) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long'
        })
    }
    
    const isToday = (date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }
    
    // 렌더링 함수들
    const renderMonthView = () => {
        const days = getAllDays()
        
        return (
            <div className={ss.monthView}>
                <div className={ss.weekDays}>
                    <div>일</div>
                    <div>월</div>
                    <div>화</div>
                    <div>수</div>
                    <div>목</div>
                    <div>금</div>
                    <div>토</div>
                </div>
                <div className={ss.calendarGrid}>
                    {days.map((day, index) => {
                        const dayEvents = getDayEvents(day.date)
                        const maxEventsToShow = 2 // 최대 2개만 표시하도록 수정
                        const hasMoreEvents = dayEvents.length > maxEventsToShow
                        
                        return (
                            <div 
                                key={index} 
                                className={`${ss.calendarDay} ${!day.isCurrentMonth ? ss.otherMonth : ''} ${isToday(day.date) ? ss.today : ''}`}
                                onClick={() => handleDateClick(day.date)}
                                onMouseDown={(e) => handleDragStart(e, day.date)}
                                data-date={day.date.toISOString()}
                            >
                                <div className={ss.dayNumber}>
                                    {day.date.getDate()}
                                    {isToday(day.date) && <div className={ss.todayIndicator}></div>}
                                </div>
                                <div className={ss.dayEvents}>
                                    {dayEvents.slice(0, maxEventsToShow).map(event => (
                                        <div 
                                            key={event.id} 
                                            className={ss.eventItem}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEventClick(event)
                                            }}
                                            style={{
                                                backgroundColor: `var(--color-tag-${event.colorTag || 1})`,
                                                borderLeft: `3px solid var(--color-tag-${event.colorTag || 1})`
                                            }}
                                        >
                                            <div className={ss.eventTime}>{formatTime(event.start)}</div>
                                            <div className={ss.eventTitle}>{event.title}</div>
                                        </div>
                                    ))}
                                    {hasMoreEvents && (
                                        <div 
                                            className={ss.moreEvents}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleMoreEventsClick(day.date, dayEvents)
                                            }}
                                        >
                                            +{dayEvents.length - maxEventsToShow}개 더보기
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    
    const renderWeekView = () => {
        const days = getWeekDays()
        
        return (
            <div className={ss.weekView}>
                <div className={ss.weekDayHeaders}>
                    {days.map((day, index) => (
                        <div 
                            key={index} 
                            className={`${ss.weekDayHeader} ${isToday(day.date) ? ss.today : ''} ${!day.isCurrentMonth ? ss.otherMonth : ''}`}
                        >
                            <div className={ss.weekDayName}>{day.date.toLocaleDateString('ko-KR', { weekday: 'short' })}</div>
                            <div className={ss.weekDayNumber}>{day.date.getDate()}</div>
                        </div>
                    ))}
                </div>
                <div className={ss.weekDayContents}>
                    {days.map((day, index) => {
                        const dayEvents = getDayEvents(day.date)
                        // 주간 뷰에서는 높이를 고려하여 최대 이벤트 수 설정
                        const maxEventsToShow = 4
                        const hasMoreEvents = dayEvents.length > maxEventsToShow
                        
                        return (
                            <div 
                                key={index} 
                                className={ss.weekDayContent}
                                onClick={() => handleDateClick(day.date)}
                                onMouseDown={(e) => handleDragStart(e, day.date)}
                                data-date={day.date.toISOString()}
                            >
                                {dayEvents.slice(0, maxEventsToShow).map(event => (
                                    <div 
                                        key={event.id} 
                                        className={ss.weekEventItem}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEventClick(event)
                                        }}
                                    >
                                        <div className={ss.weekEventTime}>
                                            <FaRegClock className={ss.eventIcon} />
                                            {formatTime(event.start)}
                                        </div>
                                        <div className={ss.weekEventTitle}>{event.title}</div>
                                        {event.location && (
                                            <div className={ss.weekEventLocation}>
                                                <FaMapMarkerAlt className={ss.eventIcon} /> {event.location}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {hasMoreEvents && (
                                    <div 
                                        className={ss.moreEvents}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleMoreEventsClick(day.date, dayEvents)
                                        }}
                                    >
                                        +{dayEvents.length - maxEventsToShow}개 더보기
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    
    const renderDayView = () => {
        const dayEvents = getDayEvents(currentDate)
        
        return (
            <div className={ss.dayView}>
                <div className={ss.dayHeader}>
                    <div className={`${ss.dayHeaderDate} ${isToday(currentDate) ? ss.today : ''}`}>
                        {formatDate(currentDate)}
                    </div>
                </div>
                <div 
                    className={ss.dayContent} 
                    onClick={() => handleDateClick(currentDate)}
                    onMouseDown={(e) => handleDragStart(e, currentDate)}
                    data-date={currentDate.toISOString()}
                >
                    {dayEvents.length === 0 ? (
                        <div className={ss.noEvents}>
                            <p>일정이 없습니다.</p>
                            <button 
                                className={ss.addEventButton}
                                onClick={() => handleDateClick(currentDate)}
                            >
                                <FaPlus /> 일정 추가
                            </button>
                        </div>
                    ) : (
                        dayEvents.map(event => (
                            <div 
                                key={event.id} 
                                className={ss.dayEventItem}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleEventClick(event)
                                }}
                            >
                                <div className={ss.dayEventTime}>
                                    <FaRegClock className={ss.eventIcon} />
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                                <div className={ss.dayEventTitle}>{event.title}</div>
                                {event.location && (
                                    <div className={ss.dayEventLocation}>
                                        <FaMapMarkerAlt className={ss.eventIcon} /> {event.location}
                                    </div>
                                )}
                                {event.participants && (
                                    <div className={ss.dayEventParticipants}>
                                        <FaUsers className={ss.eventIcon} /> {event.participants.length}명 참석
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }
    
    return (
        <div className={ss.calendarContainer}>
            <div className={ss.header}>
                <h1><FaCalendarAlt className={ss.headerIcon} /> 캘린더</h1>
                <p>일정 및 이벤트를 관리하는 캘린더입니다.</p>
            </div>
            
            <div className={ss.calendarControls}>
                <div className={ss.calendarNavigation}>
                    <button 
                        className={ss.todayButton}
                        onClick={goToToday}
                    >
                        <FaRegStar className={ss.buttonIcon} /> 오늘
                    </button>
                    <div className={ss.navigationButtons}>
                        <button onClick={
                            viewMode === 'month' ? goToPreviousMonth : 
                            viewMode === 'week' ? goToPreviousWeek : 
                            goToPreviousDay
                        }>
                            <FaChevronLeft />
                        </button>
                        <button onClick={
                            viewMode === 'month' ? goToNextMonth : 
                            viewMode === 'week' ? goToNextWeek : 
                            goToNextDay
                        }>
                            <FaChevronRight />
                        </button>
                    </div>
                    <div className={ss.currentPeriod}>
                        {viewMode === 'month' && formatMonth(currentDate)}
                        {viewMode === 'week' && `${formatMonth(currentDate)} ${currentDate.getDate()}일 주`}
                        {viewMode === 'day' && formatDate(currentDate)}
                    </div>
                </div>
                <div className={ss.viewModeButtons}>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'month' ? ss.active : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        Month
                    </button>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'week' ? ss.active : ''}`}
                        onClick={() => setViewMode('week')}
                    >
                        Week
                    </button>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'day' ? ss.active : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        Day
                    </button>
                </div>
            </div>
            
            <div className={ss.calendarContent}>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </div>
            
            {showEventForm && (
                <EventModal
                    isOpen={showEventForm}
                    onClose={handleCancelForm}
                    onSubmit={handleFormSubmit}
                    event={selectedEvent}
                    eventFormData={eventFormData}
                    handleFormChange={handleFormChange}
                    handleParticipantChange={handleParticipantChange}
                />
            )}
            
            {showEventsModal && (
                <EventsModal
                    isOpen={showEventsModal}
                    onClose={handleCloseEventsModal}
                    date={eventsModalDate}
                    events={eventsModalEvents}
                />
            )}
            
            {showQuickModal && (
                <QuickEventModal
                    position={quickModalPosition}
                    onSubmit={handleQuickModalSubmit}
                    onCancel={handleQuickModalCancel}
                    timeRange={draggedTimeRange}
                />
            )}
        </div>
    )
}

export default Calendar