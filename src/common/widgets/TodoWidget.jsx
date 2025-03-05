import React, { useState, useRef, useEffect } from 'react';
import Widget from '../Widget';
import styles from './TodoWidget.module.css';
import { FaTasks } from 'react-icons/fa';

/**
 * Todo 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.todos - 할 일 목록
 * @param {Function} props.onToggleTodo - 할 일 완료 상태 토글 함수
 * @param {Function} props.onAddTodo - 할 일 추가 함수
 * @param {string} props.newTodo - 새 할 일 입력값
 * @param {Function} props.onNewTodoChange - 새 할 일 입력값 변경 함수
 * @param {Function} props.onViewAllClick - '모든 할 일 보기' 클릭 함수
 * @param {Function} props.formatDate - 날짜 포맷팅 함수
 * @returns {JSX.Element}
 */
const TodoWidget = ({
  todos = [],
  onToggleTodo,
  onAddTodo,
  newTodo = '',
  onNewTodoChange,
  onViewAllClick,
  formatDate
}) => {
  const [todosState, setTodos] = useState(todos);
  const [newTodoState, setNewTodo] = useState(newTodo);
  const todoListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const listElement = e.target;
    if (listElement) {
      listElement.classList.add('scrolling');
      
      // 이전 타임아웃 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 3초 후에 scrolling 클래스 제거
      scrollTimeoutRef.current = setTimeout(() => {
        if (listElement) {
          listElement.classList.remove('scrolling');
        }
      }, 3000);
    }
  };
  
  // 컴포넌트 마운트 시 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const listElement = todoListRef.current;
    
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 타임아웃 정리
    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Widget
      icon={<FaTasks />}
      title="Todo List"
      footerText="모든 할 일 보기"
      onFooterClick={onViewAllClick}
    >
      <form onSubmit={onAddTodo} className={styles.todo_form}>
        <input 
          type="text" 
          value={newTodoState}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="새 할 일 추가"
          className={styles.todo_input}
        />
        <button type="submit" className={styles.todo_button}>추가</button>
      </form>
      
      <ul className={styles.todo_list} ref={todoListRef}>
        {todosState.map(todo => (
          <li key={todo.id} className={styles.todo_item}>
            <input 
              type="checkbox" 
              checked={todo.completed}
              onChange={() => onToggleTodo(todo.id)}
              className={styles.todo_checkbox}
            />
            <span className={todo.completed ? styles.completed : ''}>
              {todo.text}
            </span>
            {todo.dueDate && formatDate && (
              <span className={styles.todo_date}>
                {formatDate(todo.dueDate)}
              </span>
            )}
          </li>
        ))}
        {todosState.length === 0 && (
          <li className={styles.no_todos}>할 일이 없습니다.</li>
        )}
      </ul>
    </Widget>
  );
};

export default TodoWidget; 