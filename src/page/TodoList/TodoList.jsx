import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ss from './TodoList.module.css'
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaCalendarAlt } from 'react-icons/fa'
import { todos as initialTodos, addTodo, updateTodo, deleteTodo, currentUser } from '../../data/mockDatabase'

const TodoList = () => {
    const navigate = useNavigate()
    
    // 할 일 목록 상태
    const [todos, setTodos] = useState([])
    const [newTodoText, setNewTodoText] = useState('')
    const [filter, setFilter] = useState('all') // all, active, completed
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState('')
    const [dueDate, setDueDate] = useState('')
    
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
        
        const newTodo = addTodo({
            userId: currentUser.id,
            text: newTodoText,
            dueDate: dueDate || new Date().toISOString().split('T')[0]
        })
        
        setTodos([...todos, newTodo])
        setNewTodoText('')
        setDueDate('')
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
    }
    
    // 할 일 편집 저장
    const handleSaveEdit = (id) => {
        if (!editText.trim()) return
        
        const updatedTodo = updateTodo(id, { 
            text: editText,
            dueDate: dueDate
        })
        
        setTodos(todos.map(t => t.id === id ? updatedTodo : t))
        setEditingId(null)
        setEditText('')
        setDueDate('')
    }
    
    // 할 일 편집 취소
    const handleCancelEdit = () => {
        setEditingId(null)
        setEditText('')
        setDueDate('')
    }
    
    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }
    
    return (
        <div className={ss.todoListContainer}>
            <div className={ss.header}>
                <h1>할 일 목록</h1>
                <p>효율적인 업무 관리를 위한 할 일 목록입니다.</p>
            </div>
            
            {/* 할 일 추가 폼 */}
            <form className={ss.addTodoForm} onSubmit={handleAddTodo}>
                <div className={ss.inputGroup}>
                    <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder="새 할 일을 입력하세요"
                        className={ss.todoInput}
                    />
                    <div className={ss.datePickerContainer}>
                        <FaCalendarAlt className={ss.calendarIcon} />
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className={ss.datePicker}
                        />
                    </div>
                    <button type="submit" className={ss.addButton}>
                        <FaPlus /> 추가
                    </button>
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
            
            {/* 할 일 목록 */}
            <div className={ss.todoList}>
                {filteredTodos.length === 0 ? (
                    <div className={ss.emptyState}>
                        <p>할 일이 없습니다.</p>
                    </div>
                ) : (
                    filteredTodos.map(todo => (
                        <div 
                            key={todo.id} 
                            className={`${ss.todoItem} ${todo.completed ? ss.completed : ''}`}
                        >
                            {editingId === todo.id ? (
                                // 편집 모드
                                <div className={ss.editMode}>
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className={ss.editInput}
                                        autoFocus
                                    />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className={ss.editDatePicker}
                                    />
                                    <div className={ss.editActions}>
                                        <button 
                                            onClick={() => handleSaveEdit(todo.id)}
                                            className={ss.saveButton}
                                        >
                                            <FaCheck />
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className={ss.cancelButton}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // 보기 모드
                                <>
                                    <div className={ss.todoCheckbox}>
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={() => handleToggleTodo(todo.id)}
                                            id={`todo-${todo.id}`}
                                        />
                                        <label htmlFor={`todo-${todo.id}`}></label>
                                    </div>
                                    <div className={ss.todoContent}>
                                        <span className={ss.todoText}>{todo.text}</span>
                                        {todo.dueDate && (
                                            <span className={ss.todoDueDate}>
                                                <FaCalendarAlt /> {formatDate(todo.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={ss.todoActions}>
                                        <button 
                                            onClick={() => handleStartEdit(todo)}
                                            className={ss.editButton}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTodo(todo.id)}
                                            className={ss.deleteButton}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            {/* 통계 */}
            <div className={ss.todoStats}>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>전체:</span>
                    <span className={ss.statValue}>{todos.length}</span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>완료:</span>
                    <span className={ss.statValue}>{todos.filter(t => t.completed).length}</span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>진행 중:</span>
                    <span className={ss.statValue}>{todos.filter(t => !t.completed).length}</span>
                </div>
            </div>
        </div>
    )
}

export default TodoList 