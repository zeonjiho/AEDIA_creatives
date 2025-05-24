import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ss from './Calendar.module.css'
import { FaSync, FaPlus, FaCalendarAlt, FaGoogle, FaTimes } from 'react-icons/fa'
import PublicCalendarService from '../../utils/publicCalendarService'
import EventModal from './components/EventModal'
import AddEventModal from './components/AddEventModal'

// moment 한국어 설정
moment.locale('ko')
const localizer = momentLocalizer(moment)

const CalendarPage = () => {
    const [events, setEvents] = useState([])
    const [currentView, setCurrentView] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [calendarStatus, setCalendarStatus] = useState(null)
    
    // 통합 토스트 상태
    const [toast, setToast] = useState(null) // { type: 'loading'|'success', message: string }
    const [toastExiting, setToastExiting] = useState(false)
    
    // 모달 상태
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)

    // 현재 시간을 표시하기 위한 상태 추가
    const [currentTime, setCurrentTime] = useState(new Date())
    
    // 1초마다 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearInterval(timer)
    }, [])

    // 토스트 자동 숨김
    useEffect(() => {
        if (toast && toast.type === 'success') {
            const timer = setTimeout(() => {
                hideToast()
            }, 2000) // 2초 후 자동 숨김
            
            return () => clearTimeout(timer)
        }
    }, [toast])

    // 토스트 숨기기 함수 (애니메이션 포함)
    const hideToast = () => {
        setToastExiting(true)
        setTimeout(() => {
            setToast(null)
            setToastExiting(false)
        }, 250) // exit 애니메이션 시간과 맞춤
    }

    // 컴포넌트 마운트 시 이벤트 로드
    useEffect(() => {
        loadEvents()
        checkCalendarStatus()
    }, [])

    // 날짜 변경 시 이벤트 다시 로드
    useEffect(() => {
        loadEvents()
    }, [currentDate, currentView])

    // 캘린더 상태 확인
    const checkCalendarStatus = () => {
        const status = PublicCalendarService.getStatus()
        setCalendarStatus(status)
        console.log('캘린더 상태:', status)
    }

    // 이벤트 로드
    const loadEvents = async (showToast = false) => {
        setIsLoading(true)
        if (showToast) {
            setToast({ type: 'loading', message: 'Google Calendar에서 데이터 가져오는 중...' })
        }
        
        try {
            // 현재 보기에 따른 날짜 범위 계산
            const { start, end } = getDateRange()
            
            const loadedEvents = await PublicCalendarService.getEvents(start, end)
            setEvents(loadedEvents)
            
            console.log(`${loadedEvents.length}개의 이벤트를 로드했습니다.`)
            
            // 수동 새로고침일 때만 성공 토스트 표시
            if (showToast) {
                setToast({ type: 'success', message: '동기화 완료!' })
            }
        } catch (error) {
            console.error('이벤트 로드 실패:', error)
            if (showToast) {
                setToast({ type: 'error', message: '동기화 실패' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 현재 뷰에 따른 날짜 범위 계산
    const getDateRange = () => {
        const start = new Date(currentDate)
        const end = new Date(currentDate)

        switch (currentView) {
            case 'month':
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                end.setMonth(end.getMonth() + 1)
                end.setDate(0)
                end.setHours(23, 59, 59, 999)
                break
            case 'week':
                const startOfWeek = start.getDate() - start.getDay()
                start.setDate(startOfWeek)
                start.setHours(0, 0, 0, 0)
                end.setDate(startOfWeek + 6)
                end.setHours(23, 59, 59, 999)
                break
            case 'day':
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            default:
                // agenda의 경우 현재 월 전체
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                end.setMonth(end.getMonth() + 1)
                end.setDate(0)
                end.setHours(23, 59, 59, 999)
        }

        return { start, end }
    }

    // 이벤트 클릭 핸들러
    const handleSelectEvent = (event) => {
        setSelectedEvent(event)
        setIsEventModalOpen(true)
    }

    // 날짜 클릭 핸들러 (새 이벤트 생성)
    const handleSelectSlot = (slotInfo) => {
        setSelectedSlot(slotInfo)
        setIsAddModalOpen(true)
    }

    // 새 일정 저장 핸들러
    const handleSaveNewEvent = (newEvent) => {
        setEvents([...events, newEvent])
        console.log('새 일정이 추가되었습니다:', newEvent.title)
    }

    // 새 일정 버튼 클릭 핸들러
    const handleAddEventClick = () => {
        setSelectedSlot({ 
            start: new Date(), 
            end: new Date(Date.now() + 60*60*1000),
            slots: [new Date()]
        })
        setIsAddModalOpen(true)
    }

    // 새로고침 핸들러
    const handleRefresh = () => {
        console.log('캘린더 새로고침 시작...')
        loadEvents(true)
    }

    // 이벤트 스타일 설정
    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad'
        
        switch (event.type) {
            case 'meeting':
                backgroundColor = '#ff9800'
                break
            case 'deadline':
                backgroundColor = '#f44336'
                break
            case 'holiday':
                backgroundColor = '#4caf50'
                break
            case 'client':
                backgroundColor = '#9c27b0'
                break
            case 'user':
                backgroundColor = '#2196f3'
                break
            case 'personal':
                backgroundColor = '#00bcd4'
                break
            default:
                backgroundColor = '#3174ad'
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    // 캘린더 메시지 한국어 설정
    const messages = {
        allDay: '종일',
        previous: '이전',
        next: '다음',
        today: '오늘',
        month: '월',
        week: '주',
        day: '일',
        agenda: '일정',
        date: '날짜',
        time: '시간',
        event: '이벤트',
        noEventsInRange: '해당 기간에 일정이 없습니다.',
        showMore: (total) => `+${total} 더보기`
    }

    return (
        <div className={ss.calendar_container}>
            {/* 헤더 */}
            <header className={ss.dashboard_header}>
                <div className={ss.header_content}>
                    <h1 className={ss.dashboard_title}>
                        Calendar
                    </h1>
                    <p className={ss.dashboard_date}>
                        {currentTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })} {currentTime.toLocaleTimeString('en-US')}
                        {calendarStatus && (
                            <span style={{ marginLeft: '0.5rem' }}>
                                {calendarStatus.isEnabled ? (
                                    <span style={{ color: '#4caf50' }}>
                                        <FaGoogle style={{ marginRight: '0.3rem' }} />
                                        구글 캘린더 연결됨
                                    </span>
                                ) : (
                                    <span style={{ color: '#ff9800' }}>
                                        📋 샘플 데이터 모드
                                    </span>
                                )}
                            </span>
                        )}
                    </p>
                </div>
                
                <div className={ss.header_controls}>
                    <button 
                        className={ss.customize_btn}
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <FaSync className={isLoading ? ss.spinning : ''} />
                        새로고침
                    </button>
                    
                    <button 
                        className={`${ss.customize_btn} ${ss.save_btn}`}
                        onClick={handleAddEventClick}
                    >
                        <FaPlus />
                        새 일정
                    </button>
                </div>
            </header>

            {/* 커스텀 캘린더 네비게이션 */}
            <div className={ss.calendar_navigation}>
                <div className={ss.nav_left}>
                    <button 
                        className={ss.today_btn}
                        onClick={() => setCurrentDate(new Date())}
                    >
                        오늘
                    </button>
                    
                    <div className={ss.nav_arrows}>
                        <button 
                            className={ss.nav_btn}
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                if (currentView === 'month') {
                                    newDate.setMonth(newDate.getMonth() - 1);
                                } else if (currentView === 'week') {
                                    newDate.setDate(newDate.getDate() - 7);
                                } else {
                                    newDate.setDate(newDate.getDate() - 1);
                                }
                                setCurrentDate(newDate);
                            }}
                        >
                            ←
                        </button>
                        
                        <span className={ss.current_period}>
                            {currentView === 'month' && 
                                currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                            }
                            {currentView === 'week' && 
                                `${currentDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 주`
                            }
                            {currentView === 'day' && 
                                currentDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
                            }
                        </span>
                        
                        <button 
                            className={ss.nav_btn}
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                if (currentView === 'month') {
                                    newDate.setMonth(newDate.getMonth() + 1);
                                } else if (currentView === 'week') {
                                    newDate.setDate(newDate.getDate() + 7);
                                } else {
                                    newDate.setDate(newDate.getDate() + 1);
                                }
                                setCurrentDate(newDate);
                            }}
                        >
                            →
                        </button>
                    </div>
                </div>
                
                <div className={ss.view_buttons}>
                    {['month', 'week', 'day', 'agenda'].map((view) => (
                        <button
                            key={view}
                            className={`${ss.view_btn} ${currentView === view ? ss.active : ''}`}
                            onClick={() => setCurrentView(view)}
                        >
                            {view === 'month' && '월'}
                            {view === 'week' && '주'}
                            {view === 'day' && '일'}
                            {view === 'agenda' && '목록'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 캘린더 */}
            <div className={ss.calendar_wrapper}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ 
                        height: window.innerWidth <= 768 
                            ? 'calc(100vh - 280px)' 
                            : 'calc(100vh - 320px)',
                        minHeight: '400px'
                    }}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable={true}
                    views={['month', 'week', 'day', 'agenda']}
                    view={currentView}
                    onView={setCurrentView}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    eventPropGetter={eventStyleGetter}
                    messages={messages}
                    popup={true}
                    step={30}
                    showMultiDayTimes={true}
                    toolbar={false}
                    formats={{
                        timeGutterFormat: 'HH:mm',
                        eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                            localizer.format(start, 'HH:mm', culture) + ' - ' + 
                            localizer.format(end, 'HH:mm', culture),
                        dayFormat: 'MM/DD dddd',
                        monthHeaderFormat: 'YYYY년 MM월',
                        dayHeaderFormat: 'MM월 DD일 dddd',
                        agendaDateFormat: 'MM월 DD일',
                        agendaTimeFormat: 'HH:mm',
                        agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                            localizer.format(start, 'HH:mm', culture) + ' - ' + 
                            localizer.format(end, 'HH:mm', culture)
                    }}
                />
            </div>

            {/* 이벤트 타입 범례 */}
            <div className={ss.legend}>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#ff9800'}}></span>
                    <span>회의</span>
                </div>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#f44336'}}></span>
                    <span>마감일</span>
                </div>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#4caf50'}}></span>
                    <span>휴일</span>
                </div>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#9c27b0'}}></span>
                    <span>클라이언트</span>
                </div>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#00bcd4'}}></span>
                    <span>개인일정</span>
                </div>
                <div className={ss.legend_item}>
                    <span className={ss.legend_color} style={{backgroundColor: '#2196f3'}}></span>
                    <span>사용자 추가</span>
                </div>
            </div>

            {/* 이벤트 통계 */}
            {events.length > 0 && (
                <div className={ss.legend} style={{ marginTop: '1rem' }}>
                    <div className={ss.legend_item}>
                        <span>📊 총 이벤트: {events.length}개</span>
                    </div>
                    <div className={ss.legend_item}>
                        <span>🔗 구글 캘린더: {events.filter(e => e.source === 'google').length}개</span>
                    </div>
                    <div className={ss.legend_item}>
                        <span>📝 로컬 추가: {events.filter(e => e.source === 'user').length}개</span>
                    </div>
                    <div className={ss.legend_item}>
                        <span>🕒 현재 보기: {currentView === 'month' ? '월간' : currentView === 'week' ? '주간' : currentView === 'day' ? '일간' : '일정목록'}</span>
                    </div>
                </div>
            )}

            {/* 통합 토스트 */}
            {toast && (
                <div className={`${ss.toast} ${toastExiting ? ss.exit : ''}`}>
                    {toast.type === 'loading' && <FaSync className={ss.spinning} />}
                    {toast.type === 'success' && <FaCalendarAlt />}
                    {toast.type === 'error' && <span>⚠️</span>}
                    <span>{toast.message}</span>
                    {toast.type !== 'loading' && (
                        <button 
                            className={ss.toast_close}
                            onClick={hideToast}
                        >
                            ×
                        </button>
                    )}
                </div>
            )}

            {/* 이벤트 모달 */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                />
            )}

            {/* 새 일정 모달 */}
            {selectedSlot && (
                <AddEventModal
                    initialDate={selectedSlot.start}
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveNewEvent}
                />
            )}
        </div>
    )
}

export default CalendarPage