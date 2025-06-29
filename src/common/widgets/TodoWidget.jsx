import React, { useRef, useEffect } from 'react';
import Widget from '../Widget';
import styles from './TodoWidget.module.css';
import { FaTasks } from 'react-icons/fa';

/**
 * Todo 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.todos - 할 일 목록
 * @param {Function} props.onToggleTodo - 할 일 완료 상태 토글 함수
 * @param {Function} props.onViewAllClick - '모든 할 일 보기' 클릭 함수
 * @param {Function} props.formatDate - 날짜 포맷팅 함수
 * @returns {JSX.Element}
 */
const TodoWidget = ({
  todos = [],
  onToggleTodo,
  onViewAllClick,
  formatDate
}) => {
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
      <ul className={styles.todo_list} ref={todoListRef}>
        {todos.map(todo => (
          <li key={todo._id || todo.id} className={styles.todo_item}>
            <input 
              type="checkbox" 
              checked={todo.completed}
              onChange={() => onToggleTodo(todo._id || todo.id)}
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
        {todos.length === 0 && (
          <li className={styles.no_todos}>할 일이 없습니다.</li>
        )}
      </ul>
    </Widget>
  );
};

export default TodoWidget; 