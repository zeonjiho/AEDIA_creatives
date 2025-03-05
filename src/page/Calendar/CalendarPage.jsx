import React, { useState } from 'react'
import styles from './CalendarPage.module.css'
import CalendarView from './CalendarView'
import GanttView from './GanttView'

/**
 * 캘린더 페이지 컴포넌트
 * 캘린더와 간트차트를 선택할 수 있는 탭 기능을 제공
 * 
 * @returns {JSX.Element}
 */
const CalendarPage = () => {
    // 현재 선택된 탭을 관리하는 상태
    const [activeTab, setActiveTab] = useState('calendar') // 'calendar' 또는 'gantt'

    // 탭 변경 핸들러
    const handleTabChange = (tab) => {
        setActiveTab(tab)
    }

    return (
        <div className={styles.pageContainer}>
            {/* 상단 탭 영역 */}
            <div className={styles.tabContainer}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'calendar' ? styles.active : ''}`}
                    onClick={() => handleTabChange('calendar')}
                >
                    캘린더
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'gantt' ? styles.active : ''}`}
                    onClick={() => handleTabChange('gantt')}
                >
                    간트차트
                </button>
            </div>
            
            {/* 컨텐츠 영역 */}
            <div className={styles.contentContainer}>
                {activeTab === 'calendar' ? (
                    <CalendarView />
                ) : (
                    <GanttView />
                )}
            </div>
        </div>
    )
}

export default CalendarPage

