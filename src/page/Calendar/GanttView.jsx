import React, { useState, useEffect } from 'react'
import styles from './GanttView.module.css'
import { 
    FaChevronLeft, 
    FaChevronRight, 
    FaRegStar, 
    FaPlus,
    FaEllipsisH,
    FaTrash,
    FaEdit
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
    const [showEventOptions, setShowEventOptions] = useState(null)
    
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
                progress: Math.floor(Math.random() * 100) // 랜덤 진행률
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
        startDate.setDate(startDate.getDate() - Math.floor(viewRange / 2))
        
        const days = []
        for (let i = 0; i < viewRange; i++) {
            const day = new Date(startDate)
            day.setDate(startDate.getDate() + i)
            days.push(day)
        }
        
        return days
    }
    
    // 네비게이션 함수
    const goToPrevious = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() - 7)
            return newDate
        })
    }
    
    const goToNext = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate)
            newDate.setDate(prevDate.getDate() + 7)
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
    
    // 간트 차트 헬퍼 함수
    const getEventPosition = (event, daysArray) => {
        const startDate = new Date(event.start)
        const endDate = new Date(event.end)
        
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
        
        const startPercent = (eventStartOffset / totalRange) * 100
        const widthPercent = ((eventEndOffset - eventStartOffset) / totalRange) * 100
        
        return {
            left: `${startPercent}%`,
            width: `${widthPercent}%`
        }
    }
    
    // 이벤트 옵션 토글
    const toggleEventOptions = (eventId) => {
        if (showEventOptions === eventId) {
            setShowEventOptions(null)
        } else {
            setShowEventOptions(eventId)
        }
    }
    
    // 뷰 렌더링
    const renderGanttHeader = () => {
        const days = getDaysArray()
        
        return (
            <div className={styles.ganttHeader}>
                <div className={styles.ganttSidebarHeader}>
                    <span>프로젝트 / 일정</span>
                </div>
                <div className={styles.ganttTimelineHeader}>
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`${styles.ganttHeaderDay} ${isToday(day) ? styles.today : ''}`}
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
                    ))}
                </div>
            </div>
        )
    }
    
    const renderGanttBody = () => {
        const days = getDaysArray()
        const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name))
        
        return (
            <div className={styles.ganttBody}>
                {sortedProjects.map(project => {
                    const projectEvents = events.filter(event => event.projectId === project.id)
                    
                    return (
                        <div key={project.id} className={styles.ganttProjectGroup}>
                            <div className={styles.ganttProjectRow}>
                                <div className={styles.ganttSidebarCell}>
                                    <div 
                                        className={styles.projectLabel}
                                        style={{ 
                                            backgroundColor: `var(--color-tag-${project.color})`
                                        }}
                                    >
                                        {project.name}
                                    </div>
                                </div>
                                <div className={styles.ganttTimelineCell}>
                                    {days.map((day, dayIndex) => (
                                        <div 
                                            key={dayIndex} 
                                            className={`${styles.ganttTimelineDay} ${
                                                isToday(day) ? styles.today : ''
                                            } ${
                                                day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            {projectEvents.map(event => (
                                <div key={event.id} className={styles.ganttTaskRow}>
                                    <div className={styles.ganttSidebarCell}>
                                        <div className={styles.taskLabel}>
                                            {event.title}
                                        </div>
                                    </div>
                                    <div className={styles.ganttTimelineCell}>
                                        {days.map((day, dayIndex) => (
                                            <div 
                                                key={dayIndex} 
                                                className={`${styles.ganttTimelineDay} ${
                                                    isToday(day) ? styles.today : ''
                                                } ${
                                                    day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''
                                                }`}
                                            />
                                        ))}
                                        
                                        <div 
                                            className={styles.ganttBar}
                                            style={{
                                                ...getEventPosition(event, days),
                                                backgroundColor: `var(--color-tag-${project.color})`
                                            }}
                                        >
                                            <div 
                                                className={styles.ganttBarProgress}
                                                style={{ width: `${event.progress}%` }}
                                            />
                                            <div className={styles.ganttBarLabel}>
                                                {event.title}
                                            </div>
                                            <button 
                                                className={styles.ganttBarOptions}
                                                onClick={() => toggleEventOptions(event.id)}
                                            >
                                                <FaEllipsisH />
                                            </button>
                                            
                                            {showEventOptions === event.id && (
                                                <div className={styles.ganttBarOptionsMenu}>
                                                    <button>
                                                        <FaEdit /> 수정
                                                    </button>
                                                    <button>
                                                        <FaTrash /> 삭제
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })}
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
                    <span>{formatMonthYear(currentDate)}</span>
                    <button className={styles.navButton} onClick={goToNext}><FaChevronRight /></button>
                </div>
                <div className={styles.ganttViewOptions}>
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
                    <button className={styles.addTaskButton}>
                        <FaPlus /> 일정 추가
                    </button>
                </div>
            </div>
            
            <div className={styles.ganttChart}>
                {renderGanttHeader()}
                {renderGanttBody()}
            </div>
        </div>
    )
}

export default GanttView
