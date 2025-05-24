import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ss from './Calendar.module.css'
import { FaSync, FaPlus, FaCalendarAlt, FaGoogle } from 'react-icons/fa'
import PublicCalendarService from '../../utils/publicCalendarService'

// moment 한국어 설정
moment.locale('ko')
const localizer = momentLocalizer(moment)

const CalendarPage = () => {
    const [events, setEvents] = useState([])
    const [currentView, setCurrentView] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [calendarStatus, setCalendarStatus] = useState(null)

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
    const loadEvents = async () => {
        setIsLoading(true)
        try {
            // 현재 보기에 따른 날짜 범위 계산
            const { start, end } = getDateRange()
            
            const loadedEvents = await PublicCalendarService.getEvents(start, end)
            setEvents(loadedEvents)
            
            console.log(`${loadedEvents.length}개의 이벤트를 로드했습니다.`)
        } catch (error) {
            console.error('이벤트 로드 실패:', error)
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
        const startTime = moment(event.start).format('YYYY-MM-DD HH:mm')
        const endTime = moment(event.end).format('YYYY-MM-DD HH:mm')
        const timeInfo = event.allDay ? '종일' : `${startTime} - ${endTime}`
        
        let eventDetails = `📅 ${event.title}\n⏰ ${timeInfo}`
        
        if (event.location) {
            eventDetails += `\n📍 ${event.location}`
        }
        
        if (event.description) {
            eventDetails += `\n📝 ${event.description}`
        }
        
        if (event.source === 'google') {
            eventDetails += `\n\n🔗 구글 캘린더에서 동기화됨`
        }
        
        alert(eventDetails)
    }

    // 날짜 클릭 핸들러 (새 이벤트 생성)
    const handleSelectSlot = (slotInfo) => {
        const title = window.prompt('새 일정 제목을 입력하세요:')
        if (title) {
            const newEvent = {
                id: `user-${Date.now()}`,
                title: `📝 ${title}`,
                start: slotInfo.start,
                end: slotInfo.end,
                allDay: slotInfo.slots.length === 1,
                type: 'user',
                source: 'user'
            }
            setEvents([...events, newEvent])
            alert('일정이 추가되었습니다! (로컬 저장)')
        }
    }

    // 새로고침 핸들러
    const handleRefresh = () => {
        console.log('캘린더 새로고침 시작...')
        loadEvents()
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
            <div className={ss.calendar_header}>
                <div className={ss.header_left}>
                    <h1 className={ss.page_title}>
                        <FaCalendarAlt className={ss.title_icon} />
                        캘린더
                    </h1>
                    <p className={ss.page_subtitle}>
                        팀 일정을 확인하고 새로운 일정을 추가하세요
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
                
                <div className={ss.header_actions}>
                    <button 
                        className={ss.refresh_btn}
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <FaSync className={isLoading ? ss.spinning : ''} />
                        새로고침
                    </button>
                    
                    <button 
                        className={ss.add_btn}
                        onClick={() => handleSelectSlot({ 
                            start: new Date(), 
                            end: new Date(Date.now() + 60*60*1000),
                            slots: [new Date()]
                        })}
                    >
                        <FaPlus />
                        새 일정
                    </button>
                </div>
            </div>

            {/* 캘린더 */}
            <div className={ss.calendar_wrapper}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 220px)' }}
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

            {/* 로딩 오버레이 */}
            {isLoading && (
                <div className={ss.loading_overlay}>
                    <div className={ss.loading_spinner}>
                        <FaSync className={ss.spinning} />
                        <p>구글 캘린더에서 데이터를 불러오는 중...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalendarPage