import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ss from './TodoList.module.css'
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaCalendarAlt, FaClipboardCheck, FaRegClock, FaInfoCircle } from 'react-icons/fa'
import { todos as initialTodos, addTodo, updateTodo, deleteTodo, currentUser } from '../../data/mockDatabase'
import { parseNaturalLanguageTodo, formatParsedTodo } from '../../utils/naturalLanguageUtils'

const TodoList = () => {
    const navigate = useNavigate()
    
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
    
    // 현재 날짜 및 시간 상태
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentTime, setCurrentTime] = useState(new Date())
    
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
    
    // 초기 데이터 로드
    useEffect(() => {
        // 현재 사용자의 할 일만 필터링
        const userTodos = initialTodos.filter(todo => todo.userId === currentUser.id)
        setTodos(userTodos)
    }, [])
    
    // 필터링된 할 일 목록
    const filteredTodos = todos.filter(todo => {
        if (filter === 'all') return true
        if (filter === 'active') return !todo.completed
        if (filter === 'completed') return todo.completed
        return true
    })
    
    // 할 일 추가
    const handleAddTodo = (e) => {
        e.preventDefault()
        if (!newTodoText.trim()) return
        
        // 자연어 처리된 할 일 정보 사용
        const todoInfo = parsedTodo || parseNaturalLanguageTodo(newTodoText);
        
        const newTodo = addTodo({
            userId: currentUser.id,
            text: todoInfo.text,
            dueDate: todoInfo.dueDate || new Date().toISOString().split('T')[0],
            dueTime: todoInfo.dueTime || null
        })
        
        setTodos([...todos, newTodo])
        setNewTodoText('')
        setDueDate('')
        setParsedTodo(null)
        setShowParsedPreview(false)
    }
    
    // 할 일 상태 변경
    const handleToggleTodo = (id) => {
        const todo = todos.find(t => t.id === id)
        if (!todo) return
        
        const updatedTodo = updateTodo(id, { completed: !todo.completed })
        setTodos(todos.map(t => t.id === id ? updatedTodo : t))
    }
    
    // 할 일 삭제
    const handleDeleteTodo = (id) => {
        deleteTodo(id)
        setTodos(todos.filter(t => t.id !== id))
    }
    
    // 할 일 편집 시작
    const handleStartEdit = (todo) => {
        setEditingId(todo.id)
        setEditText(todo.text)
        setDueDate(todo.dueDate || '')
        // 편집 중인 할 일의 시간 정보 저장
        if (todo.dueTime) {
            setEditTime(todo.dueTime)
        } else {
            setEditTime('')
        }
    }
    
    // 할 일 편집 저장
    const handleSaveEdit = (id) => {
        if (!editText.trim()) return
        
        const todo = todos.find(t => t.id === id)
        if (!todo) return
        
        const updatedTodo = updateTodo(id, { 
            text: editText, 
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            dueTime: editTime || null
        })
        
        setTodos(todos.map(t => t.id === id ? updatedTodo : t))
        setEditingId(null)
        setEditText('')
        setDueDate('')
        setEditTime('')
    }
    
    // 할 일 편집 취소
    const handleCancelEdit = () => {
        setEditingId(null)
        setEditText('')
        setDueDate('')
        setEditTime('')
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
    
    return (
        <div className={ss.todoListContainer}>
            {/* 대시보드 헤더 */}
            <div className={ss.dashboard_header}>
                <div>
                    <h1 className={ss.dashboard_title}>My Todo List</h1>
                    <p className={ss.dashboard_date}>{formattedDate} {formattedTime}</p>
                </div>
            </div>
            
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
                    <button type="submit" className={ss.addButton}>
                        <FaPlus />
                        <span className={ss.addButtonText}>추가</span>
                    </button>
                </div>
                
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
                {filteredTodos.length > 0 ? (
                    filteredTodos.map(todo => (
                        <div 
                            key={todo.id} 
                            className={`${ss.todoItem} ${todo.completed ? ss.completed : ''}`}
                        >
                            {editingId === todo.id ? (
                                <div className={ss.editMode}>
                                    <input
                                        type="text"
                                        className={ss.editInput}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                    />
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
                                    <div className={ss.editActions}>
                                        <button 
                                            className={ss.saveButton} 
                                            onClick={() => handleSaveEdit(todo.id)}
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
                                            id={`todo-${todo.id}`}
                                            checked={todo.completed}
                                            onChange={() => handleToggleTodo(todo.id)}
                                        />
                                        <label htmlFor={`todo-${todo.id}`}></label>
                                    </div>
                                    <div className={ss.todoContent}>
                                        <div className={ss.todoText}>{todo.text}</div>
                                        <div 
                                            className={`${ss.todoDueDate} ${isToday(todo.dueDate) ? ss.today : ''} ${isOverdue(todo.dueDate) && !todo.completed ? ss.overdue : ''}`}
                                        >
                                            <FaRegClock />
                                            {formatDateTime(todo.dueDate, todo.dueTime)}
                                        </div>
                                    </div>
                                    <div className={ss.todoActions}>
                                        <button 
                                            className={ss.editButton} 
                                            onClick={() => handleStartEdit(todo)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className={ss.deleteButton} 
                                            onClick={() => handleDeleteTodo(todo.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={ss.emptyState}>
                        <FaClipboardCheck />
                        <p>할 일이 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TodoList 