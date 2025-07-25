import React, { useState, useEffect } from 'react'
import ss from './Home.module.css'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import api from '../../utils/api'
import { 
    FaSun,
    FaMoon
} from 'react-icons/fa'

// 위젯 그리드 및 위젯 컴포넌트 임포트
import WidgetGrid, { WidgetGridItem } from '../../common/WidgetGrid'
import TodoWidget from '../../common/widgets/TodoWidget'

import StudioWidget from '../../common/widgets/StudioWidget'
import ProjectWidget from '../../common/widgets/ProjectWidget'



const Home = () => {
    const navigate = useNavigate()
    
    // 사용자 ID 상태 추가
    const [userId, setUserId] = useState(null)
    
    // 사용자 정보 상태 추가
    const [user, setUser] = useState(null)
    
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
    
    // 기본 레이아웃 설정 - 3개 위젯 구조
    const defaultLayouts = {
        lg: [
            // 첫 번째 행: Todo List, Studio Status
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 1, y: 0, w: 1, h: 2 },
            // 두 번째 행: Project Status (중앙 배치)
            { i: 'project-widget', x: 0, y: 2, w: 2, h: 2 }
        ],
        md: [
            // 태블릿 레이아웃 (2열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 1, y: 0, w: 1, h: 2 },
            { i: 'project-widget', x: 0, y: 2, w: 2, h: 2 }
        ],
        sm: [
            // 모바일 레이아웃 (1열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'project-widget', x: 0, y: 4, w: 1, h: 2 }
        ],
        xs: [
            // 작은 모바일 레이아웃 (1열)
            { i: 'todo-widget', x: 0, y: 0, w: 1, h: 2 },
            { i: 'studio-widget', x: 0, y: 2, w: 1, h: 2 },
            { i: 'project-widget', x: 0, y: 4, w: 1, h: 2 }
        ]
    };
    
    // 테마 상태 관리
    const [theme, setTheme] = useState(() => {
        // 로컬 스토리지에서 테마 설정 불러오기
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'light'
    })
    
    // 위젯 레이아웃 상태 관리 - 초기값을 null로 설정
    const [layouts, setLayouts] = useState(null)
    
    // JWT 토큰에서 사용자 ID 추출 및 사용자 정보 가져오기
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login') // 토큰이 없으면 로그인 페이지로
            return
        }
        
        try {
            const decoded = jwtDecode(token)
            setUserId(decoded.userId)
            
            // 사용자 정보 가져오기
            const getUserInfo = async () => {
                try {
                    const response = await api.get(`/get-user-info?userId=${decoded.userId}`)
                    setUser(response.data)
                } catch (error) {
                    console.error('사용자 정보 가져오기 실패:', error)
                }
            }
            
            getUserInfo()
        } catch (error) {
            console.error('토큰 디코딩 실패:', error)
            navigate('/login')
        }
    }, [navigate])
    
    // 서버에서 레이아웃 불러오기
    const loadLayoutFromServer = async () => {
        if (!userId) return
        
        try {
            const response = await api.get(`dashboard/layout?userId=${userId}`)
            const savedLayouts = response.data.mainLayout
            
            // 저장된 레이아웃이 있고 비어있지 않으면 사용, 그렇지 않으면 기본 레이아웃 사용
            if (savedLayouts && Object.keys(savedLayouts).length > 0) {
                setLayouts(savedLayouts)
            } else {
                setLayouts(defaultLayouts)
            }
        } catch (error) {
            console.error('레이아웃 불러오기 실패:', error)
            // 에러 발생 시 기본 레이아웃 사용
            setLayouts(defaultLayouts)
        }
    }
    
    // 사용자 ID가 설정되면 레이아웃 로드
    useEffect(() => {
        if (userId) {
            loadLayoutFromServer()
        }
    }, [userId])
    
    // 커스터마이징 모드 상태 관리
    const [isCustomizeMode, setIsCustomizeMode] = useState(false);
    
    // 임시 레이아웃 상태 (커스터마이징 모드에서 사용)
    const [tempLayouts, setTempLayouts] = useState(null);
    
    // 레이아웃 초기화 함수
    const resetLayout = async () => {
        if (isCustomizeMode) {
            setTempLayouts(defaultLayouts);
        } else {
            setLayouts(defaultLayouts);
            // 서버에 기본 레이아웃 저장
            if (userId) {
                try {
                    await api.patch(`dashboard/layout?userId=${userId}`, { layouts: defaultLayouts });
                } catch (error) {
                    console.error('레이아웃 초기화 저장 실패:', error);
                }
            }
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
    
    // 커스터마이징 모드 저장 함수 - 서버에 저장
    const saveCustomization = async () => {
        if (tempLayouts && userId) {
            try {
                // 서버에 레이아웃 저장
                await api.patch(`dashboard/layout?userId=${userId}`, { layouts: tempLayouts });
                
                // 성공 시 로컬 상태 업데이트
                setLayouts(tempLayouts);
                
                alert('레이아웃이 저장되었습니다.');
            } catch (error) {
                console.error('레이아웃 저장 실패:', error);
                alert('레이아웃 저장에 실패했습니다.');
                return; // 저장 실패 시 모드 종료하지 않음
            }
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
            // 실시간 변경은 서버에 저장하지 않고 로컬 상태만 업데이트
            setLayouts(newLayouts);
        }
    }
    
    // 테마 변경 시 HTML 속성 업데이트
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])
    
    // 데이터 상태 관리
    const [todoList, setTodoList] = useState([])
    const [rooms, setRooms] = useState([])
    const [projects, setProjects] = useState([])
    const [roomReservations, setRoomReservations] = useState([])
    const [loading, setLoading] = useState(true)
    
    // 실제 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            if (!userId) return
            
            setLoading(true)
            try {
                // 병렬로 모든 데이터 가져오기 - 사용자별 데이터 요청
                const [todosRes, roomsRes, projectsRes] = await Promise.all([
                    api.get(`/todos?userId=${userId}`), // 사용자별 투두리스트 (쿼리 파라미터)
                    api.get('/rooms'),  
                    api.get('/projects') // 모든 프로젝트 (클라이언트에서 필터링)
                ])
                
                // 할일 목록 (서버에서 이미 필터링됨)
                setTodoList(todosRes.data)
                
                // 방 목록
                setRooms(roomsRes.data)
                
                // 프로젝트 목록 - 사용자가 참여하는 프로젝트만 필터링
                const userProjects = projectsRes.data.filter(project => 
                    project.team && project.team.some(member => {
                        const memberId = typeof member === 'object' ? member._id : member;
                        return memberId.toString() === userId.toString();
                    })
                );
                setProjects(userProjects)
                
                // 방 예약 정보 (rooms에서 추출)
                const allReservations = []
                roomsRes.data.forEach(room => {
                    if (room.reservations) {
                        room.reservations.forEach(reservation => {
                            allReservations.push({
                                ...reservation,
                                roomId: room._id
                            })
                        })
                    }
                })
                setRoomReservations(allReservations)
                
            } catch (error) {
                console.error('데이터 로드 실패:', error)
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
    }, [userId])

    // 투두 상태 변경 함수
    const toggleTodo = async (id) => {
        const todo = todoList.find(todo => todo._id === id)
        if (todo) {
            try {
                const response = await api.patch(`/todos/${id}/toggle?userId=${userId}`)
                if (response.data) {
                    setTodoList(todoList.map(t => t._id === id ? response.data : t))
                }
            } catch (error) {
                console.error('투두 업데이트 실패:', error)
            }
        }
    }
    
    // 프로젝트 진행률 계산
    const calculateProgress = (project) => {
        // API에서 progress 값을 직접 제공하는 경우
        if (project.progress !== undefined) {
            return project.progress
        }
        
        // tasks가 있는 경우 계산
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
    

    
    // 사용자가 참여하는 모든 프로젝트 (최신순 정렬)
    const userProjects = [...projects]
        .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
    
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
        <div className={ss.home_container}>
            {/* 모바일일 경우 간단한 환영 메시지만 표시 */}
            {isMobile ? (
                <div className={ss.mobile_welcome}>
                    <h1 className={ss.welcome_title}>Welcome, {user?.name || 'Guest'}!</h1>
                    <p className={ss.welcome_subtitle}>{formattedDate} {formattedTime}</p>
                </div>
            ) : (
                <>
                    {/* 대시보드 헤더 */}
                    <header className={ss.dashboard_header}>
                        <div className={ss.header_content}>
                            <h1 className={ss.dashboard_title}>
                                {isCustomizeMode ? 'Edit Mode' : 'My Dashboard'}
                            </h1>
                            <p className={ss.dashboard_date}>{formattedDate} {formattedTime}</p>
                        </div>
                        
                        {/* 커스터마이징 모드 컨트롤 - 모바일에서는 표시하지 않음 */}
                        <div className={ss.header_controls}>
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
                    </header>
                    
                    {/* 위젯 그리드 레이아웃 */}
                    <main className={ss.dashboard_content}>
                        {loading ? (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '400px',
                                fontSize: '1.2rem',
                                color: '#6b7280'
                            }}>
                                데이터를 불러오는 중...
                            </div>
                        ) : layouts ? (
                            <WidgetGrid 
                                columns={2} 
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
                                        onViewAllClick={() => navigate('/todo')}
                                        formatDate={formatDate}
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
                                        projects={userProjects}
                                        calculateProgress={calculateProgress}
                                        calculateRemainingDays={calculateRemainingDays}
                                        formatDate={formatDate}
                                        onViewAllClick={() => navigate('/projects')}
                                    />
                                </WidgetGridItem>




                            </WidgetGrid>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '400px',
                                fontSize: '1.2rem',
                                color: '#6b7280'
                            }}>
                                대시보드 레이아웃을 불러오는 중...
                            </div>
                        )}
                    </main>
                </>
            )}
        </div>
    )
}

export default Home