import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import api from '../../utils/api'
import ss from './TodoList.module.css'
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaCalendarAlt, FaClipboardCheck, FaRegClock, FaInfoCircle, FaProjectDiagram, FaFilter, FaShare, FaUser } from 'react-icons/fa'
import { parseNaturalLanguageTodo, formatParsedTodo } from '../../utils/naturalLanguageUtils'
import ProjectSelectModal from '../../components/ProjectSelectModal/ProjectSelectModal'

const TodoList = () => {
    const navigate = useNavigate()
    
    // 사용자 ID
    const [userId, setUserId] = useState(null)
    
    // 할 일 목록 상태
    const [todos, setTodos] = useState([])
    const [newTodoText, setNewTodoText] = useState('')
    const [filter, setFilter] = useState('all') // all, active, completed
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [editTime, setEditTime] = useState('')
    const [parsedTodo, setParsedTodo] = useState(null)
    const [showParsedPreview, setShowParsedPreview] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // 프로젝트 관련 상태
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedProjectName, setSelectedProjectName] = useState('') // 프로젝트 이름 표시용
    const [editProject, setEditProject] = useState('')
    const [projectFilter, setProjectFilter] = useState('all') // 프로젝트별 필터링
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false) // 프로젝트 선택 모달
    
    // 현재 날짜 및 시간 상태
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentTime, setCurrentTime] = useState(new Date())
    
    // JWT 토큰에서 사용자 ID 추출
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login') // 토큰이 없으면 로그인 페이지로
            return
        }
        
        try {
            const decoded = jwtDecode(token)
            setUserId(decoded.userId)
        } catch (error) {
            console.error('토큰 디코딩 실패:', error)
            navigate('/login')
        }
    }, [navigate])
    
    // 할 일 목록 로드
    const fetchTodos = async () => {
        if (!userId) return
        
        setLoading(true)
        try {
            const response = await api.get(`todos?userId=${userId}`)
            setTodos(response.data)
        } catch (error) {
            console.error('할 일 목록 조회 실패:', error)
            alert('할 일 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }
    
    // 사용자 ID가 설정되면 할 일 목록 로드
    useEffect(() => {
        if (userId) {
            fetchTodos()
        }
    }, [userId])
    
    // 날짜 및 시간 업데이트를 위한 효과
    useEffect(() => {
        const dateTimer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000); // 1분마다 업데이트
        
        return () => clearInterval(dateTimer);
    }, []);
    
    // 1초마다 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearInterval(timer)
    }, [])
    
    // 포맷된 날짜 - 영어로 변경
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // 시간 포맷팅 - 영어로 변경 (초 단위 포함)
    const formattedTime = currentTime.toLocaleTimeString('en-US');
    
    // 프로젝트별로 필터링된 할 일 목록
    const projectFilteredTodos = todos.filter(todo => {
        if (projectFilter === 'all') return true
        if (projectFilter === 'no-project') return !todo.projectId
        return todo.projectId === projectFilter
    });
    
    // 상태별로 필터링된 할 일 목록
    const filteredTodos = projectFilteredTodos.filter(todo => {
        if (filter === 'all') return true
        if (filter === 'active') return !todo.completed
        if (filter === 'completed') return todo.completed
        return true
    });
    
    // 할 일 추가
    const handleAddTodo = async (e) => {
        e.preventDefault()
        if (!newTodoText.trim()) return
        
        // 자연어 처리된 할 일 정보 사용
        const todoInfo = parsedTodo || parseNaturalLanguageTodo(newTodoText);
        
        const todoData = {
            text: todoInfo.text,
            dueDate: todoInfo.dueDate || new Date().toISOString().split('T')[0],
            dueTime: todoInfo.dueTime || null,
            projectId: selectedProject || null
        }
        
        setLoading(true)
        try {
            const response = await api.post(`todos?userId=${userId}`, todoData)
            setTodos([response.data, ...todos])
            
            // 폼 초기화
            setNewTodoText('')
            setDueDate('')
            setSelectedProject('')
            setSelectedProjectName('')
            setParsedTodo(null)
            setShowParsedPreview(false)
        } catch (error) {
            console.error('할 일 추가 실패:', error)
            alert('할 일 추가에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }
    
    // 할 일 상태 변경
    const handleToggleTodo = async (id) => {
        setLoading(true)
        try {
            const response = await api.patch(`todos/${id}/toggle?userId=${userId}`)
            setTodos(todos.map(t => t._id === id ? response.data : t))
        } catch (error) {
            console.error('할 일 상태 변경 실패:', error)
            alert('할 일 상태 변경에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }
    
    // 할 일 삭제
    const handleDeleteTodo = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return
        
        setLoading(true)
        try {
            await api.delete(`todos/${id}?userId=${userId}`)
            setTodos(todos.filter(t => t._id !== id))
        } catch (error) {
            console.error('할 일 삭제 실패:', error)
            alert('할 일 삭제에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }
    
    // 할 일 편집 시작
    const handleStartEdit = (todo) => {
        setEditingId(todo._id)
        setEditText(todo.text)
        setDueDate(todo.dueDate || '')
        setEditProject(todo.projectId || '')
        // 편집 중인 할 일의 시간 정보 저장
        if (todo.dueTime) {
            setEditTime(todo.dueTime)
        } else {
            setEditTime('')
        }
    }
    
    // 할 일 편집 저장
    const handleSaveEdit = async (id) => {
        if (!editText.trim()) return
        
        const todoData = {
            text: editText,
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            dueTime: editTime || null,
            projectId: editProject || null
        }
        
        setLoading(true)
        try {
            const response = await api.put(`todos/${id}?userId=${userId}`, todoData)
            setTodos(todos.map(t => t._id === id ? response.data : t))
            
            // 편집 모드 종료
            setEditingId(null)
            setEditText('')
            setDueDate('')
            setEditTime('')
            setEditProject('')
        } catch (error) {
            console.error('할 일 수정 실패:', error)
            alert('할 일 수정에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }
    
    // 할 일 편집 취소
    const handleCancelEdit = () => {
        setEditingId(null)
        setEditText('')
        setDueDate('')
        setEditTime('')
        setEditProject('')
    }
    
    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return ''
        
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (date.toDateString() === today.toDateString()) {
            return '오늘'
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '내일'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '어제'
        } else {
            return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
        }
    }

    // 날짜와 시간 포맷팅
    const formatDateTime = (dateString, timeString) => {
        const formattedDate = formatDate(dateString);
        
        if (!timeString) return formattedDate;
        
        // 시간 포맷팅 (예: 14:00 -> 오후 2시)
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const minute = parseInt(minutes);
        
        let timeFormat = '';
        if (hour < 12) {
            timeFormat = `오전 ${hour}시`;
        } else if (hour === 12) {
            timeFormat = `오후 12시`;
        } else {
            timeFormat = `오후 ${hour - 12}시`;
        }
        
        if (minute > 0) {
            timeFormat += ` ${minute}분`;
        }
        
        return `${formattedDate} ${timeFormat}`;
    }

    // 오늘 날짜인지 확인하는 함수
    const isToday = (dateString) => {
        if (!dateString) return false
        const today = new Date()
        const date = new Date(dateString)
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    // 만료된 날짜인지 확인하는 함수
    const isOverdue = (dateString) => {
        if (!dateString) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const date = new Date(dateString)
        return date < today
    }
    
    // 자연어 입력 처리
    const handleNaturalLanguageInput = (e) => {
        const text = e.target.value;
        setNewTodoText(text);
        
        if (text.trim()) {
            const parsed = parseNaturalLanguageTodo(text);
            setParsedTodo(parsed);
            setShowParsedPreview(true);
            
            // 날짜 필드 업데이트
            if (parsed.dueDate) {
                setDueDate(parsed.dueDate);
            }
        } else {
            setParsedTodo(null);
            setShowParsedPreview(false);
        }
    };
    
    // 자연어 미리보기 닫기
    const handleClosePreview = () => {
        setShowParsedPreview(false);
    };
    
    // 프로젝트 이름 가져오기
    const getProjectName = (projectId) => {
        if (!projectId) return null;
        // 프로젝트 기능이 아직 미개발이므로 일단 ID 반환
        return `Project ${projectId}`;
    };
    
    // 프로젝트 색상 가져오기
    const getProjectColor = (projectId) => {
        if (!projectId) return '';
        // 기본 색상 반환
        return '#007bff';
    };
    
    // 프로젝트 드롭다운 토글
    const toggleProjectDropdown = () => {
        setShowProjectDropdown(!showProjectDropdown);
    };
    
    // 프로젝트 ID로 참여자 목록 가져오기
    const getProjectMembers = (projectId) => {
        // 프로젝트 기능이 아직 미개발이므로 빈 배열 반환
        return [];
    };
    
    // 공유 처리 함수
    const handleShareTodo = () => {
        if (!selectedProject) return;
        
        // 프로젝트 기능이 아직 미개발이므로 일단 알림만
        alert('프로젝트 기능은 아직 개발 중입니다.');
    };
    
    // 작성자 이름 가져오기
    const getAuthorName = (poster) => {
        // poster가 populate된 객체라면 name을 반환, 그렇지 않으면 기본값
        if (poster && typeof poster === 'object' && poster.name) {
            return poster.name;
        }
        return 'Unknown';
    };
    
    // 프로젝트 모달 핸들러
    const handleProjectSelect = (project) => {
        if (project) {
            setSelectedProject(project.id);
            setSelectedProjectName(project.title);
        } else {
            setSelectedProject('');
            setSelectedProjectName('');
        }
        setShowProjectModal(false);
    };
    
    const handleOpenProjectModal = () => {
        setShowProjectModal(true);
    };
    
    const handleCloseProjectModal = () => {
        setShowProjectModal(false);
    };
    
    return (
        <div className={ss.todoListContainer}>
            {/* 대시보드 헤더 */}
            <header className={ss.dashboard_header}>
                <div className={ss.header_content}>
                    <h1 className={ss.dashboard_title}>My Todo List</h1>
                    <p className={ss.dashboard_date}>{formattedDate} {formattedTime}</p>
                </div>
                
                <div className={ss.header_controls}>
                    {/* 프로젝트 필터 드롭다운 */}
                    <div className={ss.projectFilterContainer}>
                        <button 
                            className={`${ss.customize_btn} ${ss.projectFilterButton}`}
                            onClick={toggleProjectDropdown}
                        >
                            <FaFilter />
                            <span>{projectFilter === 'all' ? '모든 프로젝트' : 
                                   projectFilter === 'no-project' ? '프로젝트 없음' : 
                                   getProjectName(projectFilter)}</span>
                        </button>
                        
                        {showProjectDropdown && (
                            <div className={ss.projectDropdown}>
                                <div 
                                    className={`${ss.projectOption} ${projectFilter === 'all' ? ss.selected : ''}`}
                                    onClick={() => {
                                        setProjectFilter('all');
                                        setShowProjectDropdown(false);
                                    }}
                                >
                                    모든 프로젝트
                                </div>
                                <div 
                                    className={`${ss.projectOption} ${projectFilter === 'no-project' ? ss.selected : ''}`}
                                    onClick={() => {
                                        setProjectFilter('no-project');
                                        setShowProjectDropdown(false);
                                    }}
                                >
                                    프로젝트 없음
                                </div>
                                {/* 프로젝트 기능이 개발되면 아래 부분을 다시 활성화 */}
                                {/* {projects.map(project => (
                                    <div 
                                        key={project.id}
                                        className={`${ss.projectOption} ${projectFilter === project.id ? ss.selected : ''}`}
                                        onClick={() => {
                                            setProjectFilter(project.id);
                                            setShowProjectDropdown(false);
                                        }}
                                    >
                                        <span 
                                            className={ss.projectColor} 
                                            style={{ backgroundColor: project.color }}
                                        ></span>
                                        {project.name}
                                    </div>
                                ))} */}
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* 할 일 추가 폼 */}
            <form className={ss.addTodoForm} onSubmit={handleAddTodo}>
                <div className={ss.inputGroup}>
                    <input
                        type="text"
                        className={ss.todoInput}
                        placeholder="자연어로 할 일을 입력하세요 (예: 오후 2시 미팅가기)"
                        value={newTodoText}
                        onChange={handleNaturalLanguageInput}
                    />
                    <div className={ss.buttonGroup}>
                        <button type="submit" className={ss.addButton} disabled={loading}>
                            <FaPlus />
                            <span className={ss.addButtonText}>{loading ? '추가 중...' : '추가'}</span>
                        </button>
                        
                        {/* 공유 버튼 - 프로젝트가 선택된 경우에만 활성화 */}
                        <button 
                            type="button" 
                            className={`${ss.shareButton} ${!selectedProject ? ss.disabled : ''}`}
                            onClick={handleShareTodo}
                            disabled={!selectedProject || loading}
                        >
                            <FaShare />
                            <span className={ss.shareButtonText}>공유</span>
                        </button>
                    </div>
                </div>
                
                <div className={ss.inputOptionsContainer}>
                    <div className={ss.dateTimePickerContainer}>
                        <div className={ss.datePickerContainer}>
                            <FaCalendarAlt className={ss.calendarIcon} />
                            <input
                                type="date"
                                className={ss.datePicker}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                        <div className={ss.timePickerContainer}>
                            <FaRegClock className={ss.clockIcon} />
                            <input
                                type="time"
                                className={ss.timePicker}
                                value={parsedTodo?.dueTime || ''}
                                onChange={(e) => {
                                    if (parsedTodo) {
                                        setParsedTodo({...parsedTodo, dueTime: e.target.value});
                                    }
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* 프로젝트 선택 버튼 */}
                    <div className={ss.projectSelectContainer}>
                        <FaProjectDiagram className={ss.projectIcon} />
                        <button
                            type="button"
                            className={ss.projectSelectButton}
                            onClick={handleOpenProjectModal}
                        >
                            {selectedProjectName || '프로젝트 선택 (옵션)'}
                        </button>
                    </div>
                </div>
                
                {/* 자연어 처리 미리보기 */}
                {showParsedPreview && parsedTodo && (
                    <div className={ss.parsedPreview}>
                        <p>
                            <strong>인식된 할 일:</strong> {formatParsedTodo(parsedTodo)}
                        </p>
                        <button 
                            type="button" 
                            className={ss.previewCloseBtn}
                            onClick={handleClosePreview}
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}
                
                {/* How to use 버튼 */}
                <div className={ss.howToUseContainer}>
                    <button type="button" className={ss.howToUseBtn}>
                        <FaInfoCircle className={ss.howToUseIcon} />
                        <span>사용 방법</span>
                    </button>
                    <div className={ss.howToUseTooltip}>
                        <h4>자연어로 할 일 입력하기</h4>
                        <p>다음과 같은 형식으로 할 일을 입력할 수 있습니다:</p>
                        <ul>
                            <li><strong>시간 포함:</strong> "오후 2시 미팅가기", "오전 9시 30분 회의"</li>
                            <li><strong>날짜 포함:</strong> "내일 보고서 제출하기", "다음주 금요일 발표 준비"</li>
                            <li><strong>날짜와 시간:</strong> "내일 오후 3시 고객 미팅", "금요일 오전 11시 팀 회의"</li>
                        </ul>
                        <h4>지원하는 날짜 형식</h4>
                        <ul>
                            <li>오늘, 내일, 모레</li>
                            <li>이번주/다음주 + 요일 (예: 이번주 수요일)</li>
                            <li>요일 (예: 월요일, 화요일)</li>
                            <li>날짜 (예: 12월 31일, 2023-12-31)</li>
                        </ul>
                        <h4>지원하는 시간 형식</h4>
                        <ul>
                            <li>오전/오후 + 시간 (예: 오전 9시, 오후 3시)</li>
                            <li>시간:분 (예: 14:30, 9:00)</li>
                            <li>시간 + 분 (예: 3시 30분)</li>
                        </ul>
                    </div>
                </div>
            </form>
            
            {/* 필터 버튼 */}
            <div className={ss.filterButtons}>
                <button 
                    className={`${ss.filterButton} ${filter === 'all' ? ss.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    전체
                </button>
                <button 
                    className={`${ss.filterButton} ${filter === 'active' ? ss.active : ''}`}
                    onClick={() => setFilter('active')}
                >
                    진행 중
                </button>
                <button 
                    className={`${ss.filterButton} ${filter === 'completed' ? ss.active : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    완료됨
                </button>
            </div>
            
            {/* 통계 */}
            <div className={ss.todoStats}>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>전체 작업</span>
                    <span className={ss.statValue}>{todos.length}</span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>완료된 작업</span>
                    <span className={ss.statValue}>{todos.filter(t => t.completed).length}</span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>진행 중 작업</span>
                    <span className={ss.statValue}>{todos.filter(t => !t.completed).length}</span>
                </div>
            </div>
            
            {/* 할 일 목록 */}
            <div className={ss.todoList}>
                {loading && (
                    <div className={ss.loadingState}>
                        <p>로딩 중...</p>
                    </div>
                )}
                {!loading && filteredTodos.length > 0 ? (
                    filteredTodos.map(todo => (
                        <div 
                            key={todo._id} 
                            className={`${ss.todoItem} ${todo.completed ? ss.completed : ''}`}
                        >
                            {editingId === todo._id ? (
                                <div className={ss.editMode}>
                                    <input
                                        type="text"
                                        className={ss.editInput}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                    />
                                    <div className={ss.editOptionsContainer}>
                                        <div className={ss.editDateTimeContainer}>
                                            <input
                                                type="date"
                                                className={ss.editDatePicker}
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                            />
                                            <input
                                                type="time"
                                                className={ss.editTimePicker}
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                            />
                                        </div>
                                        <div className={ss.editProjectContainer}>
                                            <input
                                                type="text"
                                                className={ss.editProjectSelect}
                                                placeholder="프로젝트 ID (옵션)"
                                                value={editProject}
                                                onChange={(e) => setEditProject(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className={ss.editActions}>
                                        <button 
                                            className={ss.saveButton} 
                                            onClick={() => handleSaveEdit(todo._id)}
                                            disabled={loading}
                                        >
                                            <FaCheck />
                                        </button>
                                        <button 
                                            className={ss.cancelButton} 
                                            onClick={handleCancelEdit}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={ss.todoCheckbox}>
                                        <input
                                            type="checkbox"
                                            id={`todo-${todo._id}`}
                                            checked={todo.completed}
                                            onChange={() => handleToggleTodo(todo._id)}
                                            disabled={loading}
                                        />
                                        <label htmlFor={`todo-${todo._id}`}></label>
                                    </div>
                                    <div className={ss.todoContent}>
                                        <div className={ss.todoText}>{todo.text}</div>
                                        <div className={ss.todoMeta}>
                                            <div 
                                                className={`${ss.todoDueDate} ${isToday(todo.dueDate) ? ss.today : ''} ${isOverdue(todo.dueDate) && !todo.completed ? ss.overdue : ''}`}
                                            >
                                                <FaRegClock />
                                                {formatDateTime(todo.dueDate, todo.dueTime)}
                                            </div>
                                            
                                            {/* 작성자 정보 */}
                                            <div className={ss.todoAuthor}>
                                                <FaUser />
                                                {getAuthorName(todo.poster)}
                                            </div>
                                            
                                            {/* 프로젝트 태그 */}
                                            {todo.projectId && (
                                                <div 
                                                    className={ss.todoProject}
                                                    style={{ 
                                                        backgroundColor: `${getProjectColor(todo.projectId)}20`, 
                                                        color: getProjectColor(todo.projectId),
                                                        borderColor: getProjectColor(todo.projectId)
                                                    }}
                                                >
                                                    <FaProjectDiagram /> {getProjectName(todo.projectId)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={ss.todoActions}>
                                        <button 
                                            className={ss.editButton} 
                                            onClick={() => handleStartEdit(todo)}
                                            disabled={loading}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className={ss.deleteButton} 
                                            onClick={() => handleDeleteTodo(todo._id)}
                                            disabled={loading}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                ) : !loading ? (
                    <div className={ss.emptyState}>
                        <FaClipboardCheck />
                        <p>할 일이 없습니다</p>
                    </div>
                ) : null}
            </div>
            
            {/* 프로젝트 선택 모달 */}
            <ProjectSelectModal
                isOpen={showProjectModal}
                projects={projects}
                selectedProject={selectedProjectName}
                onSelect={handleProjectSelect}
                onClose={handleCloseProjectModal}
            />
        </div>
    )
}

export default TodoList 