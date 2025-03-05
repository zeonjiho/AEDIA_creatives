import React, { useState, useEffect } from 'react'
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
    FaUsers
} from 'react-icons/fa'
import { events as initialEvents, addEvent, updateEvent, deleteEvent, users, currentUser } from '../../data/mockDatabase'

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
        participants: []
    })
    const [viewMode, setViewMode] = useState('month') // month, week, day
    
    // 초기 데이터 로드
    useEffect(() => {
        setEvents(initialEvents)
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
        const daysInPreviousMonth = getDaysInMonth(year, month - 1)
        
        const days = []
        for (let i = 0; i < firstDay; i++) {
            days.unshift({
                date: new Date(year, month - 1, daysInPreviousMonth - i),
                isCurrentMonth: false
            })
        }
        
        return days
    }
    
    const getCurrentMonthDays = (year, month) => {
        const daysInMonth = getDaysInMonth(year, month)
        
        const days = []
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }
        
        return days
    }
    
    const getNextMonthDays = (year, month, currentDays) => {
        const totalDaysNeeded = 42 // 6 rows of 7 days
        const remainingDays = totalDaysNeeded - currentDays.length
        
        const days = []
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }
        
        return days
    }
    
    const getAllDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        const previousMonthDays = getPreviousMonthDays(year, month)
        const currentMonthDays = getCurrentMonthDays(year, month)
        const allCurrentDays = [...previousMonthDays, ...currentMonthDays]
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
        
        const days = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate)
            day.setDate(startDate.getDate() + i)
            days.push({
                date: day,
                isCurrentMonth: day.getMonth() === month
            })
        }
        
        return days
    }
    
    const getDayEvents = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start)
            return (
                eventDate.getFullYear() === date.getFullYear() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getDate() === date.getDate()
            )
        })
    }
    
    // 날짜 이동 함수
    const goToPreviousMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() - 1)
            return newDate
        })
    }
    
    const goToNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() + 1)
            return newDate
        })
    }
    
    const goToPreviousWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() - 7)
            return newDate
        })
    }
    
    const goToNextWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() + 7)
            return newDate
        })
    }
    
    const goToPreviousDay = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() - 1)
            return newDate
        })
    }
    
    const goToNextDay = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() + 1)
            return newDate
        })
    }
    
    const goToToday = () => {
        setCurrentDate(new Date())
    }
    
    // 이벤트 관련 함수들
    const handleDateClick = (date) => {
        setSelectedDate(date)
        setShowEventForm(true)
        
        // 폼 초기화
        const hours = new Date().getHours()
        const minutes = new Date().getMinutes()
        
        const startDateTime = new Date(date)
        startDateTime.setHours(hours)
        startDateTime.setMinutes(minutes)
        
        const endDateTime = new Date(date)
        endDateTime.setHours(hours + 1)
        endDateTime.setMinutes(minutes)
        
        setEventFormData({
            title: '',
            start: formatDateTimeForInput(startDateTime),
            end: formatDateTimeForInput(endDateTime),
            location: '',
            participants: [currentUser.id]
        })
        
        setSelectedEvent(null)
    }
    
    const handleEventClick = (event) => {
        setSelectedEvent(event)
        setShowEventForm(true)
        
        setEventFormData({
            title: event.title,
            start: formatDateTimeForInput(new Date(event.start)),
            end: formatDateTimeForInput(new Date(event.end)),
            location: event.location || '',
            participants: event.participants || []
        })
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
                return {
                    ...prev,
                    participants: participants.filter(id => id !== userId)
                }
            } else {
                return {
                    ...prev,
                    participants: [...participants, userId]
                }
            }
        })
    }
    
    const handleFormSubmit = (e) => {
        e.preventDefault()
        
        const eventData = {
            title: eventFormData.title,
            start: eventFormData.start,
            end: eventFormData.end,
            location: eventFormData.location,
            participants: eventFormData.participants
        }
        
        if (selectedEvent) {
            // 이벤트 수정
            const updatedEvent = updateEvent(selectedEvent.id, eventData)
            setEvents(events.map(event => event.id === selectedEvent.id ? updatedEvent : event))
        } else {
            // 새 이벤트 추가
            const newEvent = addEvent(eventData)
            setEvents([...events, newEvent])
        }
        
        // 폼 닫기
        setShowEventForm(false)
        setSelectedEvent(null)
    }
    
    const handleDeleteEvent = () => {
        if (selectedEvent) {
            deleteEvent(selectedEvent.id)
            setEvents(events.filter(event => event.id !== selectedEvent.id))
            setShowEventForm(false)
            setSelectedEvent(null)
        }
    }
    
    const handleCancelForm = () => {
        setShowEventForm(false)
        setSelectedEvent(null)
    }
    
    // 유틸리티 함수들
    const formatDateTimeForInput = (date) => {
        return date.toISOString().slice(0, 16)
    }
    
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        })
    }
    
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
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
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
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
                    {days.map((day, index) => (
                        <div 
                            key={index} 
                            className={`${ss.calendarDay} ${!day.isCurrentMonth ? ss.otherMonth : ''} ${isToday(day.date) ? ss.today : ''}`}
                            onClick={() => handleDateClick(day.date)}
                        >
                            <div className={ss.dayNumber}>{day.date.getDate()}</div>
                            <div className={ss.dayEvents}>
                                {getDayEvents(day.date).slice(0, 3).map(event => (
                                    <div 
                                        key={event.id} 
                                        className={ss.eventItem}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEventClick(event)
                                        }}
                                    >
                                        <div className={ss.eventTime}>{formatTime(event.start)}</div>
                                        <div className={ss.eventTitle}>{event.title}</div>
                                    </div>
                                ))}
                                {getDayEvents(day.date).length > 3 && (
                                    <div className={ss.moreEvents}>
                                        +{getDayEvents(day.date).length - 3} 더 보기
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
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
                            className={`${ss.weekDayHeader} ${!day.isCurrentMonth ? ss.otherMonth : ''} ${isToday(day.date) ? ss.today : ''}`}
                        >
                            <div className={ss.weekDayName}>{day.date.toLocaleDateString('ko-KR', { weekday: 'short' })}</div>
                            <div className={ss.weekDayNumber}>{day.date.getDate()}</div>
                        </div>
                    ))}
                </div>
                <div className={ss.weekDayContents}>
                    {days.map((day, index) => (
                        <div 
                            key={index} 
                            className={ss.weekDayContent}
                            onClick={() => handleDateClick(day.date)}
                        >
                            {getDayEvents(day.date).map(event => (
                                <div 
                                    key={event.id} 
                                    className={ss.weekEventItem}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleEventClick(event)
                                    }}
                                >
                                    <div className={ss.weekEventTime}>{formatTime(event.start)}</div>
                                    <div className={ss.weekEventTitle}>{event.title}</div>
                                    {event.location && (
                                        <div className={ss.weekEventLocation}>
                                            <FaMapMarkerAlt /> {event.location}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
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
                <div className={ss.dayContent} onClick={() => handleDateClick(currentDate)}>
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
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                                <div className={ss.dayEventTitle}>{event.title}</div>
                                {event.location && (
                                    <div className={ss.dayEventLocation}>
                                        <FaMapMarkerAlt /> {event.location}
                                    </div>
                                )}
                                {event.participants && (
                                    <div className={ss.dayEventParticipants}>
                                        <FaUsers /> {event.participants.length}명 참석
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
                <h1>캘린더</h1>
                <p>일정 및 이벤트를 관리하는 캘린더입니다.</p>
            </div>
            
            <div className={ss.calendarControls}>
                <div className={ss.calendarNavigation}>
                    <button 
                        className={ss.todayButton}
                        onClick={goToToday}
                    >
                        오늘
                    </button>
                    <div className={ss.navigationButtons}>
                        {viewMode === 'month' && (
                            <>
                                <button onClick={goToPreviousMonth}><FaChevronLeft /></button>
                                <span className={ss.currentPeriod}>{formatMonth(currentDate)}</span>
                                <button onClick={goToNextMonth}><FaChevronRight /></button>
                            </>
                        )}
                        {viewMode === 'week' && (
                            <>
                                <button onClick={goToPreviousWeek}><FaChevronLeft /></button>
                                <span className={ss.currentPeriod}>{formatDate(getWeekDays()[0].date)} - {formatDate(getWeekDays()[6].date)}</span>
                                <button onClick={goToNextWeek}><FaChevronRight /></button>
                            </>
                        )}
                        {viewMode === 'day' && (
                            <>
                                <button onClick={goToPreviousDay}><FaChevronLeft /></button>
                                <span className={ss.currentPeriod}>{formatDate(currentDate)}</span>
                                <button onClick={goToNextDay}><FaChevronRight /></button>
                            </>
                        )}
                    </div>
                </div>
                <div className={ss.viewModeButtons}>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'month' ? ss.active : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        월
                    </button>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'week' ? ss.active : ''}`}
                        onClick={() => setViewMode('week')}
                    >
                        주
                    </button>
                    <button 
                        className={`${ss.viewModeButton} ${viewMode === 'day' ? ss.active : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        일
                    </button>
                </div>
            </div>
            
            <div className={ss.calendarContent}>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </div>
            
            {/* 이벤트 폼 모달 */}
            {showEventForm && (
                <div className={ss.modalOverlay}>
                    <div className={ss.modal}>
                        <div className={ss.modalHeader}>
                            <h2>{selectedEvent ? '일정 수정' : '새 일정 추가'}</h2>
                            <button 
                                className={ss.closeButton}
                                onClick={handleCancelForm}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className={ss.formGroup}>
                                <label htmlFor="title">제목</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={eventFormData.title}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="일정 제목"
                                />
                            </div>
                            <div className={ss.formRow}>
                                <div className={ss.formGroup}>
                                    <label htmlFor="start">시작 시간</label>
                                    <input
                                        type="datetime-local"
                                        id="start"
                                        name="start"
                                        value={eventFormData.start}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className={ss.formGroup}>
                                    <label htmlFor="end">종료 시간</label>
                                    <input
                                        type="datetime-local"
                                        id="end"
                                        name="end"
                                        value={eventFormData.end}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={ss.formGroup}>
                                <label htmlFor="location">장소</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={eventFormData.location}
                                    onChange={handleFormChange}
                                    placeholder="장소 (선택사항)"
                                />
                            </div>
                            <div className={ss.formGroup}>
                                <label>참석자</label>
                                <div className={ss.participantsList}>
                                    {users.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={`${ss.participantItem} ${eventFormData.participants.includes(user.id) ? ss.selected : ''}`}
                                            onClick={() => handleParticipantChange(user.id)}
                                        >
                                            <img 
                                                src={user.avatar} 
                                                alt={user.name} 
                                                className={ss.participantAvatar}
                                            />
                                            <span className={ss.participantName}>{user.name}</span>
                                            {eventFormData.participants.includes(user.id) && (
                                                <FaCheck className={ss.checkIcon} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={ss.formActions}>
                                {selectedEvent && (
                                    <button 
                                        type="button" 
                                        className={ss.deleteButton}
                                        onClick={handleDeleteEvent}
                                    >
                                        <FaTrash /> 삭제
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    className={ss.cancelButton}
                                    onClick={handleCancelForm}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={ss.saveButton}
                                >
                                    {selectedEvent ? '수정' : '추가'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Calendar 