import React, { useState, useMemo } from 'react'
import { FaCalendarCheck, FaHistory, FaCheckCircle, FaTimes, FaClock, FaExclamationTriangle } from 'react-icons/fa'
import styles from './AttendanceModal.module.css'

const AttendanceModal = ({ onClose, attendanceHistory }) => {
    const [activeTab, setActiveTab] = useState('weekly')

    // 탭 변경 함수
    const handleTabChange = (tab) => {
        setActiveTab(tab)
    }

    // 현재 주의 월~일 날짜 계산
    const getCurrentWeekDays = () => {
        const today = new Date()
        const currentDay = today.getDay() // 0: 일요일, 1: 월요일, ...
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // 월요일까지의 오프셋
        
        const monday = new Date(today)
        monday.setDate(today.getDate() + mondayOffset)
        
        const weekDays = []
        for (let i = 0; i < 7; i++) { // 월~일
            const day = new Date(monday)
            day.setDate(monday.getDate() + i)
            weekDays.push({
                date: day.toISOString().split('T')[0],
                name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                fullDate: day
            })
        }
        
        return weekDays
    }

    // 주간 데이터 계산
    const weeklyData = useMemo(() => {
        const weekDays = getCurrentWeekDays()
        const today = new Date().toISOString().split('T')[0]
        
        const weekStats = {
            completed: 0,
            working: 0,
            absent: 0
        }
        
        const weekDaysWithStatus = weekDays.map(day => {
            const attendanceRecord = attendanceHistory.find(record => record.date === day.date)
            let status = 'future'
            let icon = null
            
            if (day.date === today) {
                status = 'today'
                if (attendanceRecord) {
                    if (attendanceRecord.status === '퇴근') {
                        icon = <FaCheckCircle />
                        weekStats.completed++
                    } else if (attendanceRecord.status === '출근') {
                        icon = <FaClock />
                        weekStats.working++
                    } else if (attendanceRecord.status === '미출근') {
                        icon = <FaExclamationTriangle />
                        // 오늘 날짜 미출근은 absent로 처리하지 않음
                    }
                }
            } else if (day.date < today) {
                // 과거 날짜만 absent 처리
                if (attendanceRecord) {
                    if (attendanceRecord.status === '퇴근') {
                        status = 'completed'
                        icon = <FaCheckCircle />
                        weekStats.completed++
                    } else if (attendanceRecord.status === '출근') {
                        status = 'working'
                        icon = <FaClock />
                        weekStats.working++
                    } else if (attendanceRecord.status === '미출근') {
                        status = 'absent'
                        weekStats.absent++
                    }
                } else {
                    // 과거 날짜에 출석 기록이 없으면 결근
                    status = 'absent'
                    weekStats.absent++
                }
            }
            
            return {
                ...day,
                status,
                icon,
                record: attendanceRecord
            }
        })
        
        return {
            days: weekDaysWithStatus,
            stats: weekStats
        }
    }, [attendanceHistory])

    // 상태별 한글-영어 변환
    const getStatusText = (status) => {
        const statusMap = {
            '퇴근': 'Completed',
            '출근': 'Working',
            '미출근': 'Not Checked In'
        }
        return statusMap[status] || status
    }

    // 상태별 CSS 클래스 반환
    const getStatusClass = (status) => {
        const classMap = {
            '퇴근': 'status_completed',
            '출근': 'status_working',
            '미출근': 'status_absent'
        }
        return classMap[status] || 'status_normal'
    }

    return (
        <div className={styles.modal_overlay}>
            <div className={styles.modal_container}>
                <div className={styles.modal_header}>
                    <h2>Attendance Records</h2>
                    <button className={styles.close_btn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className={styles.modal_tabs}>
                    <button 
                        className={`${styles.tab_btn} ${activeTab === 'weekly' ? styles.active : ''}`}
                        onClick={() => handleTabChange('weekly')}
                    >
                        <FaCalendarCheck />
                        Weekly Summary
                    </button>
                    <button 
                        className={`${styles.tab_btn} ${activeTab === 'history' ? styles.active : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        <FaHistory />
                        Attendance History
                    </button>
                </div>
                
                <div className={styles.modal_content}>
                    {activeTab === 'weekly' ? (
                        <div className={styles.weekly_tab}>
                            <div className={styles.week_summary}>
                                {weeklyData.days.map((day, index) => (
                                    <div key={index} className={styles.week_day}>
                                        <div className={`${styles.day_circle} ${styles[`day_${day.status}`]}`}>
                                            {day.name}
                                        </div>
                                        <div className={styles.day_status}>
                                            {day.icon}
                                        </div>
                                        {day.record && (
                                            <div className={styles.day_time}>
                                                {day.record.checkIn}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className={styles.week_stats}>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>Completed</span>
                                    <span className={`${styles.stat_value} ${styles.stat_success}`}>
                                        {weeklyData.stats.completed} days
                                    </span>
                                </div>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>Working</span>
                                    <span className={`${styles.stat_value} ${styles.stat_info}`}>
                                        {weeklyData.stats.working} days
                                    </span>
                                </div>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>Absent</span>
                                    <span className={`${styles.stat_value} ${styles.stat_danger}`}>
                                        {weeklyData.stats.absent} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.history_tab}>
                            {attendanceHistory.length === 0 ? (
                                <div className={styles.no_data}>
                                    <p>출석 기록이 없습니다.</p>
                                </div>
                            ) : (
                                <table className={styles.attendance_table}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Check In</th>
                                            <th>Check Out</th>
                                            <th>Work Hours</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceHistory.map((record, index) => (
                                            <tr key={index}>
                                                <td>{new Date(record.date).toLocaleDateString('ko-KR')}</td>
                                                <td>{record.checkIn}</td>
                                                <td>{record.checkOut}</td>
                                                <td>{record.workHoursFormatted}</td>
                                                <td>
                                                    <span className={`${styles.status_tag} ${styles[getStatusClass(record.status)]}`}>
                                                        {getStatusText(record.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AttendanceModal 