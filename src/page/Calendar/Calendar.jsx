import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ss from './Calendar.module.css'
import { FaSync, FaPlus, FaCalendarAlt, FaGoogle, FaTimes, FaLink } from 'react-icons/fa'
import PublicCalendarService from '../../utils/publicCalendarService'
import EventModal from './components/EventModal'
import AddEventModal from './components/AddEventModal'
import ProjectInfoModal from './components/ProjectInfoModal'
import ProjectLinkModal from './components/ProjectLinkModal'

// moment 한국어 설정
moment.locale('ko')
const localizer = momentLocalizer(moment)

const CalendarPage = () => {
    const [events, setEvents] = useState([])
    const [projects, setProjects] = useState([]) // 프로젝트 데이터
    const [eventProjectLinks, setEventProjectLinks] = useState([]) // 이벤트-프로젝트 연결 정보
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
    const [isProjectLinkModalOpen, setIsProjectLinkModalOpen] = useState(false) // 프로젝트 연동 모달

    // 프로젝트 정보 호버 모달 상태
    const [hoveredEvent, setHoveredEvent] = useState(null)
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false)
    const [hoverTimeout, setHoverTimeout] = useState(null)

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
        loadProjects()
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

    // 이벤트 호버 시작 핸들러
    const handleEventMouseEnter = (event, mouseEvent) => {
        // 기존 타이머가 있다면 클리어
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
        }

        const rect = mouseEvent.currentTarget.getBoundingClientRect()
        const modalWidth = window.innerWidth <= 768 ? 280 : 320 // 반응형 모달 너비
        const modalHeight = 400 // 예상 모달 높이
        const gap = 15 // 이벤트와 모달 사이 간격
        
        // 스크롤 위치 고려
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft
        const scrollY = window.pageYOffset || document.documentElement.scrollTop
        
        // 화면 크기
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // 기본 위치 (이벤트 중앙 상단)
        let x = rect.left + scrollX + (rect.width / 2)
        let y = rect.top + scrollY - gap
        
        // 오른쪽 경계 체크 (모달이 화면 밖으로 나가지 않도록)
        if (x + modalWidth / 2 > viewportWidth + scrollX - 20) {
            x = viewportWidth + scrollX - modalWidth / 2 - 20 // 20px 여백
        }
        
        // 왼쪽 경계 체크
        if (x - modalWidth / 2 < scrollX + 20) {
            x = scrollX + modalWidth / 2 + 20 // 20px 여백
        }
        
        // 상단 경계 체크 (모달이 위로 나가면 아래쪽에 표시)
        if (y - modalHeight < scrollY + 20) {
            y = rect.bottom + scrollY + gap
        }
        
        // 하단 경계 체크
        if (y + modalHeight > viewportHeight + scrollY - 20) {
            y = rect.top + scrollY - gap - modalHeight
        }
        
        setHoveredEvent(event)
        setHoverPosition({ x, y })
        
        // 약간의 딜레이 후 모달 표시 (200ms로 단축)
        const timeout = setTimeout(() => {
            setIsProjectModalVisible(true)
        }, 200)
        
        setHoverTimeout(timeout)
    }

    // 이벤트 호버 종료 핸들러
    const handleEventMouseLeave = () => {
        // 타이머가 있다면 클리어 (모달이 나타나기 전에 마우스를 뗀 경우)
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
            setHoverTimeout(null)
        }
        
        // 즉시 모달 숨기기
        setIsProjectModalVisible(false)
        setHoveredEvent(null)
    }

    // 프로젝트 모달 호버 유지 핸들러
    const handleProjectModalMouseEnter = () => {
        // 모달에 마우스가 올라가면 숨기기 취소
        setIsProjectModalVisible(true)
    }

    // 프로젝트 모달 호버 종료 핸들러
    const handleProjectModalMouseLeave = () => {
        setIsProjectModalVisible(false)
        setHoveredEvent(null)
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

    // 커스텀 이벤트 컴포넌트
    const CustomEvent = ({ event }) => {
        return (
            <div 
                style={{ 
                    height: '100%', 
                    width: '100%',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.stopPropagation()
                    handleEventMouseEnter(event, e)
                }}
                onMouseLeave={(e) => {
                    e.stopPropagation()
                    handleEventMouseLeave()
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    handleSelectEvent(event)
                }}
            >
                <span style={{ 
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {event.title}
                </span>
            </div>
        )
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

    // 프로젝트 데이터 로드 함수
    const loadProjects = async () => {
        try {
            // 실제 API 호출 (예시)
            // const response = await fetch('/api/projects')
            // const projectData = await response.json()
            
            // 임시 목업 데이터 (실제 DB 스키마에 맞춤)
            const mockProjects = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    title: 'AEDIA 창작 플랫폼',
                    description: 'AI 기반 창작 도구 개발 프로젝트',
                    status: 'production',
                    progress: 75,
                    thumbnail: 'aedia_thumbnail.jpg',
                    deadline: new Date('2024-12-31'),
                    team: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
                    staffList: [
                        {
                            roleName: '프로젝트 매니저',
                            members: [{ userId: '507f191e810c19729de860ea' }]
                        },
                        {
                            roleName: '개발자',
                            members: [{ userId: '507f191e810c19729de860eb' }, { userId: '507f191e810c19729de860ec' }]
                        }
                    ],
                    createdAt: new Date('2024-01-15'),
                    updatedAt: new Date('2024-11-01')
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    title: '모바일 앱 UI/UX 리뉴얼',
                    description: '사용자 경험 개선을 위한 전면 리뉴얼',
                    status: 'post_production',
                    progress: 90,
                    thumbnail: 'mobile_app_thumbnail.jpg',
                    deadline: new Date('2024-11-15'),
                    team: ['507f191e810c19729de860ed', '507f191e810c19729de860ee'],
                    staffList: [
                        {
                            roleName: 'UI/UX 디자이너',
                            members: [{ userId: '507f191e810c19729de860ed' }]
                        },
                        {
                            roleName: '프론트엔드 개발자',
                            members: [{ userId: '507f191e810c19729de860ee' }]
                        }
                    ],
                    createdAt: new Date('2024-02-01'),
                    updatedAt: new Date('2024-10-28')
                },
                {
                    _id: '507f1f77bcf86cd799439013',
                    title: '브랜드 아이덴티티 구축',
                    description: '새로운 브랜드 로고 및 가이드라인 제작',
                    status: 'development',
                    progress: 45,
                    thumbnail: 'brand_identity_thumbnail.jpg',
                    deadline: new Date('2024-12-20'),
                    team: ['507f191e810c19729de860ef', '507f191e810c19729de860f0', '507f191e810c19729de860f1'],
                    staffList: [
                        {
                            roleName: '브랜드 디자이너',
                            members: [{ userId: '507f191e810c19729de860ef' }]
                        },
                        {
                            roleName: '그래픽 디자이너',
                            members: [{ userId: '507f191e810c19729de860f0' }, { userId: '507f191e810c19729de860f1' }]
                        }
                    ],
                    createdAt: new Date('2024-03-10'),
                    updatedAt: new Date('2024-10-30')
                },
                {
                    _id: '507f1f77bcf86cd799439014',
                    title: '개인 포트폴리오 사이트',
                    description: '개인 작업물 전시를 위한 포트폴리오 웹사이트',
                    status: 'pre_production',
                    progress: 60,
                    thumbnail: 'portfolio_thumbnail.jpg',
                    deadline: new Date('2024-11-30'),
                    team: ['507f191e810c19729de860f2'],
                    staffList: [
                        {
                            roleName: '풀스택 개발자',
                            members: [{ userId: '507f191e810c19729de860f2' }]
                        }
                    ],
                    createdAt: new Date('2024-04-01'),
                    updatedAt: new Date('2024-10-25')
                }
            ]
            
            setProjects(mockProjects)
        } catch (error) {
            console.error('프로젝트 로드 실패:', error)
        }
    }

    // 프로젝트 연동 관련 함수들
    const handleLinkProject = (event, project) => {
        const eventId = event.id || event.title
        
        // 기존 연결이 있으면 제거
        const updatedLinks = eventProjectLinks.filter(link => link.eventId !== eventId)
        
        // 새 연결 추가
        const newLink = {
            eventId: eventId,
            projectId: project._id,
            linkedAt: new Date()
        }
        
        setEventProjectLinks([...updatedLinks, newLink])
        setToast({ type: 'success', message: `${event.title}이(가) ${project.title}과(와) 연동되었습니다.` })
        
        console.log('프로젝트 연동:', event.title, '->', project.title)
    }

    const handleUnlinkProject = (eventId) => {
        const updatedLinks = eventProjectLinks.filter(link => link.eventId !== eventId)
        setEventProjectLinks(updatedLinks)
        setToast({ type: 'success', message: '프로젝트 연동이 해제되었습니다.' })
        
        console.log('프로젝트 연동 해제:', eventId)
    }

    // 연동된 프로젝트 찾기 (이제 실제 연동 데이터 사용)
    const getLinkedProjectForEvent = (event) => {
        const eventId = event.id || event.title
        const link = eventProjectLinks.find(link => link.eventId === eventId)
        return link ? projects.find(p => p._id === link.projectId) : null
    }

    // 기존 getProjectForEvent 함수를 수정 (연동된 프로젝트 우선)
    const getProjectForEvent = (event) => {
        // 먼저 연동된 프로젝트가 있는지 확인
        const linkedProject = getLinkedProjectForEvent(event)
        if (linkedProject) {
            return linkedProject
        }

        // 연동된 프로젝트가 없으면 기존 자동 매칭 로직 사용
        const matchedProject = projects.find(project => {
            // 제목으로 매칭
            const titleMatch = event.title && project.title.toLowerCase().includes(event.title.toLowerCase())
            // 이벤트 타입에 따른 프로젝트 상태 매칭
            const statusMatch = getProjectByEventType(event.type, project)
            
            return titleMatch || statusMatch
        })
        
        return matchedProject || null
    }

    // 이벤트 타입에 따른 프로젝트 매칭
    const getProjectByEventType = (eventType, project) => {
        const typeMapping = {
            'meeting': ['concept', 'development', 'pre_production'],
            'deadline': ['post_production', 'quality_check', 'delivery'],
            'client': ['production', 'vfx', 'sound_design'],
            'personal': ['concept', 'development'],
            'user': ['development', 'production']
        }
        
        return typeMapping[eventType]?.includes(project.status)
    }

    // 프로젝트 상태를 한국어로 변환
    const getStatusInKorean = (status) => {
        const statusMap = {
            'concept': '기획',
            'development': '개발',
            'pre_production': '프리 프로덕션',
            'production': '프로덕션',
            'post_production': '포스트 프로덕션',
            'vfx': 'VFX',
            'sound_design': '사운드 디자인',
            'quality_check': '품질 검수',
            'delivery': '납품'
        }
        
        return statusMap[status] || status
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
                        className={ss.customize_btn}
                        onClick={() => setIsProjectLinkModalOpen(true)}
                    >
                        <FaLink />
                        프로젝트 연동
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
                    components={{
                        event: CustomEvent
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

            {/* 프로젝트 정보 모달 */}
            {isProjectModalVisible && (
                <ProjectInfoModal
                    event={hoveredEvent}
                    position={hoverPosition}
                    isVisible={isProjectModalVisible}
                    onMouseEnter={handleProjectModalMouseEnter}
                    onMouseLeave={handleProjectModalMouseLeave}
                    project={getProjectForEvent(hoveredEvent)}
                />
            )}

            {/* 프로젝트 연동 모달 */}
            <ProjectLinkModal
                isOpen={isProjectLinkModalOpen}
                onClose={() => setIsProjectLinkModalOpen(false)}
                projects={projects}
                events={events}
                eventProjectLinks={eventProjectLinks}
                onLinkProject={handleLinkProject}
                onUnlinkProject={handleUnlinkProject}
            />
        </div>
    )
}

export default CalendarPage