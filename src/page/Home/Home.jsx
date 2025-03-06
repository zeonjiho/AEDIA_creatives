import React, { useState, useEffect } from 'react'
import ss from './Home.module.css'
import { useNavigate } from 'react-router-dom'
import { 
    FaSun,
    FaMoon
} from 'react-icons/fa'
import { 
    todos, 
    events, 
    rooms, 
    projects, 
    users, 
    notifications,
    roomReservations,
    addTodo,
    updateTodo,
    deleteTodo
} from '../../data/mockDatabase'

// 위젯 그리드 및 위젯 컴포넌트 임포트
import WidgetGrid, { WidgetGridItem } from '../../common/WidgetGrid'
import TodoWidget from '../../common/widgets/TodoWidget'
import ScheduleWidget from '../../common/widgets/ScheduleWidget'
import StudioWidget from '../../common/widgets/StudioWidget'
import ProjectWidget from '../../common/widgets/ProjectWidget'
import TeamWidget from '../../common/widgets/TeamWidget'
import NotificationWidget from '../../common/widgets/NotificationWidget'

const Home = () => {
    const navigate = useNavigate()
    
    // 화면 크기 감지를 위한 상태 추가
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    
    // 화면 크기 변경 감지
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // 기본 레이아웃 설정 - 이미지에 보이는 레이아웃과 동일하게 설정
    const defaultLayouts = {
        lg: [
            // 첫 번째 행: Todo List, Today's Schedule, Studio Status
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'schedule-widget', x: 1, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 2, y: 0, w: 1, h: 2 },
            // 두 번째 행: Project Status, Team Members, Notifications
            { i: 'project-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'team-widget', x: 1, y: 2, w: 1, h: 2 },
            { i: 'notification-widget', x: 2, y: 2, w: 1, h: 2 }
        ],
        md: [
            // 태블릿 레이아웃 (2열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'schedule-widget', x: 1, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'project-widget', x: 1, y: 2, w: 1, h: 2 },
            { i: 'team-widget', x: 0, y: 4, w: 1, h: 2 },
            { i: 'notification-widget', x: 1, y: 4, w: 1, h: 2 }
        ],
        sm: [
            // 모바일 레이아웃 (1열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'schedule-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'studio-widget', x: 0, y: 4, w: 1, h: 2 },
            { i: 'project-widget', x: 0, y: 6, w: 1, h: 2 },
            { i: 'team-widget', x: 0, y: 8, w: 1, h: 2 },
            { i: 'notification-widget', x: 0, y: 10, w: 1, h: 2 }
        ],
        xs: [
            // 작은 모바일 레이아웃 (1열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'schedule-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'studio-widget', x: 0, y: 4, w: 1, h: 2 },
            { i: 'project-widget', x: 0, y: 6, w: 1, h: 2 },
            { i: 'team-widget', x: 0, y: 8, w: 1, h: 2 },
            { i: 'notification-widget', x: 0, y: 10, w: 1, h: 2 }
        ]
    };
    
    // 테마 상태 관리
    const [theme, setTheme] = useState(() => {
        // 로컬 스토리지에서 테마 설정 불러오기
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'light'
    })
    
    // 위젯 레이아웃 상태 관리
    const [layouts, setLayouts] = useState(() => {
        // 로컬 스토리지에서 레이아웃 설정 불러오기
        const savedLayouts = localStorage.getItem('dashboard_layouts')
        
        // 저장된 레이아웃이 없으면 기본 레이아웃 사용
        if (!savedLayouts) {
            // 초기 실행 시 기본 레이아웃을 로컬 스토리지에 저장
            localStorage.setItem('dashboard_layouts', JSON.stringify(defaultLayouts))
            return defaultLayouts
        }
        
        return JSON.parse(savedLayouts)
    })
    
    // 커스터마이징 모드 상태 관리
    const [isCustomizeMode, setIsCustomizeMode] = useState(false);
    
    // 임시 레이아웃 상태 (커스터마이징 모드에서 사용)
    const [tempLayouts, setTempLayouts] = useState(null);
    
    // 레이아웃 초기화 함수
    const resetLayout = () => {
        if (isCustomizeMode) {
            setTempLayouts(defaultLayouts);
        } else {
            setLayouts(defaultLayouts);
            localStorage.setItem('dashboard_layouts', JSON.stringify(defaultLayouts));
        }
    }
    
    // 커스터마이징 모드 변경 함수
    const handleCustomizeModeChange = (mode) => {
        if (mode) {
            // 커스터마이징 모드 활성화 시 현재 레이아웃 백업
            setTempLayouts({...layouts});
        }
        setIsCustomizeMode(mode);
    }
    
    // 커스터마이징 모드 저장 함수
    const saveCustomization = () => {
        if (tempLayouts) {
            setLayouts(tempLayouts);
            localStorage.setItem('dashboard_layouts', JSON.stringify(tempLayouts));
        }
        setIsCustomizeMode(false);
        setTempLayouts(null);
    }
    
    // 커스터마이징 모드 취소 함수
    const cancelCustomization = () => {
        setIsCustomizeMode(false);
        setTempLayouts(null);
    }
    
    // 레이아웃 변경 함수
    const handleLayoutChange = (newLayouts) => {
        if (isCustomizeMode) {
            setTempLayouts(newLayouts);
        } else {
            setLayouts(newLayouts);
            localStorage.setItem('dashboard_layouts', JSON.stringify(newLayouts));
        }
    }
    
    // 테마 변경 시 HTML 속성 업데이트
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])
    
    // 투두 리스트 상태 관리
    const [todoList, setTodoList] = useState([])
    const [newTodo, setNewTodo] = useState('')
    
    // 초기 데이터 로드
    useEffect(() => {
        // 현재 사용자의 할 일만 필터링 (예시로 userId 1 사용)
        const currentUserId = 1
        setTodoList(todos.filter(todo => todo.userId === currentUserId))
    }, [])

    // 투두 상태 변경 함수
    const toggleTodo = (id) => {
        const todo = todoList.find(todo => todo.id === id)
        if (todo) {
            const updated = updateTodo(id, { completed: !todo.completed })
            if (updated) {
                setTodoList(todoList.map(t => t.id === id ? updated : t))
            }
        }
    }

    // 투두 추가 함수
    const handleAddTodo = (e) => {
        e.preventDefault()
        if (newTodo.trim()) {
            const added = addTodo({
                userId: 1, // 현재 사용자 ID
                text: newTodo,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 일주일 후
            })
            if (added) {
                setTodoList([...todoList, added])
                setNewTodo('')
            }
        }
    }
    
    // 프로젝트 진행률 계산
    const calculateProgress = (project) => {
        if (!project.tasks || project.tasks.length === 0) return 0
        const completedTasks = project.tasks.filter(task => task.status === '완료').length
        return Math.round((completedTasks / project.tasks.length) * 100)
    }
    
    // 오늘 날짜 구하기
    const today = new Date()
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    
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
    
    // 시간 포맷팅 - 영어로 변경
    const formattedTime = currentTime.toLocaleTimeString('en-US')
    
    // 오늘의 이벤트 필터링
    const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === today.toDateString()
    })
    
    // 가장 가까운 마감일 프로젝트 찾기
    const upcomingProjects = [...projects]
        .filter(project => new Date(project.deadline) > today)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3)
    
    // 날짜 포맷팅 함수 - 영어로 변경
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }
    
    // 남은 일수 계산
    const calculateRemainingDays = (deadline) => {
        const deadlineDate = new Date(deadline)
        const timeDiff = deadlineDate - today
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    }

    return (
        <div className={ss.wrap}>
            {/* 대시보드 헤더 */}
            <div className={ss.dashboard_header}>
                <div>
                    <h1 className={ss.dashboard_title}>
                        {isCustomizeMode ? 'Edit Mode' : 'My Dashboard'}
                    </h1>
                    <p className={ss.dashboard_date}>{formattedDate} {formattedTime}</p>
                </div>
                
                {/* 커스터마이징 모드 컨트롤 - 모바일에서는 표시하지 않음 */}
                {isCustomizeMode ? (
                    <div className={ss.customize_controls}>
                        <button 
                            className={`${ss.customize_btn} ${ss.save_btn}`} 
                            onClick={saveCustomization}
                        >
                            저장
                        </button>
                        <button 
                            className={`${ss.customize_btn} ${ss.cancel_btn}`} 
                            onClick={cancelCustomization}
                        >
                            취소
                        </button>
                    </div>
                ) : (
                    !isMobile && (
                        <button 
                            className={`${ss.customize_btn} ${ss.edit_btn}`} 
                            onClick={() => handleCustomizeModeChange(true)}
                        >
                            Change Layout
                        </button>
                    )
                )}
            </div>
            
            {/* 위젯 그리드 레이아웃 */}
            <WidgetGrid 
                columns={3} 
                gap="15px" 
                className={ss.dashboard_grid}
                layouts={isCustomizeMode ? tempLayouts || layouts : layouts}
                onLayoutChange={handleLayoutChange}
                isCustomizeMode={isCustomizeMode}
                onCustomizeModeChange={handleCustomizeModeChange}
            >
                {/* 투두 리스트 위젯 */}
                <WidgetGridItem 
                    key="todo-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <TodoWidget 
                        todos={todoList}
                        onToggleTodo={toggleTodo}
                        onAddTodo={handleAddTodo}
                        newTodo={newTodo}
                        onNewTodoChange={(e) => setNewTodo(e.target.value)}
                        onViewAllClick={() => navigate('/todos')}
                        formatDate={formatDate}
                    />
                </WidgetGridItem>

                {/* 오늘의 일정 위젯 */}
                <WidgetGridItem 
                    key="schedule-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <ScheduleWidget 
                        events={todayEvents}
                        onViewAllClick={() => navigate('/calendar')}
                    />
                </WidgetGridItem>

                {/* 스튜디오 현황 위젯 */}
                <WidgetGridItem 
                    key="studio-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <StudioWidget 
                        rooms={rooms.slice(0, 4)}
                        reservations={roomReservations}
                        onReservationClick={() => navigate('/room-reservation')}
                    />
                </WidgetGridItem>

                {/* 프로젝트 현황 위젯 */}
                <WidgetGridItem 
                    key="project-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <ProjectWidget 
                        projects={upcomingProjects}
                        calculateProgress={calculateProgress}
                        calculateRemainingDays={calculateRemainingDays}
                        formatDate={formatDate}
                        onViewAllClick={() => navigate('/projects')}
                    />
                </WidgetGridItem>

                {/* 팀 멤버 위젯 */}
                <WidgetGridItem 
                    key="team-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <TeamWidget 
                        members={users.slice(0, 4)}
                        onViewAllClick={() => navigate('/team')}
                    />
                </WidgetGridItem>

                {/* 알림 위젯 */}
                <WidgetGridItem 
                    key="notification-widget"
                    onCustomizeModeChange={handleCustomizeModeChange}
                >
                    <NotificationWidget 
                        notifications={notifications.slice(0, 3)}
                        onViewAllClick={() => navigate('/notifications')}
                    />
                </WidgetGridItem>
            </WidgetGrid>
        </div>
    )
}

export default Home