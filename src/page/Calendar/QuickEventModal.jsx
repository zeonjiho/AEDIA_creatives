import React, { useState } from 'react'
import styles from './QuickEventModal.module.css'

/**
 * 퀵 이벤트 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {Object} props.position - 모달 위치 (x, y 좌표)
 * @param {Function} props.onSubmit - 제출 핸들러
 * @param {Function} props.onCancel - 취소 핸들러
 * @param {Object} props.timeRange - 시간 범위 (start, end)
 * @returns {JSX.Element}
 */
const QuickEventModal = ({ position, onSubmit, onCancel, timeRange }) => {
    const [title, setTitle] = useState('')
    
    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(title)
    }
    
    const formatDateRange = () => {
        if (!timeRange.start || !timeRange.end) return ''
        
        const startDate = new Date(timeRange.start)
        const endDate = new Date(timeRange.end)
        
        // 날짜가 유효한지 확인
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('유효하지 않은 날짜:', { startDate, endDate });
            return '날짜 선택 중...';
        }
        
        const options = { month: 'short', day: 'numeric' }
        const startStr = startDate.toLocaleDateString('ko-KR', options)
        const endStr = endDate.toLocaleDateString('ko-KR', options)
        
        return `${startStr} - ${endStr}`
    }
    
    return (
        <div 
            className={styles.quickEventModal} 
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className={styles.quickEventModalContent}>
                <div className={styles.quickEventModalHeader}>
                    <span className={styles.quickEventModalDateRange}>
                        {formatDateRange()}
                    </span>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="이벤트 제목 입력"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        className={styles.quickEventModalInput}
                    />
                    <div className={styles.quickEventModalActions}>
                        <button 
                            type="button" 
                            className={styles.quickEventModalCancel}
                            onClick={onCancel}
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className={styles.quickEventModalSubmit}
                            disabled={!title.trim()}
                        >
                            생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default QuickEventModal 