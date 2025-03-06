import React, { useState } from 'react'
import { FaCalendarCheck, FaHistory, FaCheckCircle, FaTimes } from 'react-icons/fa'
import styles from './AttendanceModal.module.css'

const AttendanceModal = ({ onClose, attendanceHistory }) => {
    const [activeTab, setActiveTab] = useState('weekly')

    // 탭 변경 함수
    const handleTabChange = (tab) => {
        setActiveTab(tab)
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
                                <div className={styles.week_day}>
                                    <div className={`${styles.day_circle} ${styles.day_present}`}>Mon</div>
                                    <div className={styles.day_status}><FaCheckCircle /></div>
                                </div>
                                <div className={styles.week_day}>
                                    <div className={`${styles.day_circle} ${styles.day_present}`}>Tue</div>
                                    <div className={styles.day_status}><FaCheckCircle /></div>
                                </div>
                                <div className={styles.week_day}>
                                    <div className={`${styles.day_circle} ${styles.day_late}`}>Wed</div>
                                    <div className={styles.day_status}><FaCheckCircle /></div>
                                </div>
                                <div className={styles.week_day}>
                                    <div className={`${styles.day_circle} ${styles.day_today}`}>Thu</div>
                                    <div className={styles.day_status}></div>
                                </div>
                                <div className={styles.week_day}>
                                    <div className={`${styles.day_circle} ${styles.day_future}`}>Fri</div>
                                    <div className={styles.day_status}></div>
                                </div>
                            </div>
                            <div className={styles.week_stats}>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>On Time</span>
                                    <span className={styles.stat_value}>2 days</span>
                                </div>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>Late</span>
                                    <span className={styles.stat_value}>1 day</span>
                                </div>
                                <div className={styles.stat_item}>
                                    <span className={styles.stat_label}>Absent</span>
                                    <span className={styles.stat_value}>0 days</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.history_tab}>
                            <table className={styles.attendance_table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceHistory.map((record, index) => (
                                        <tr key={index}>
                                            <td>{record.date}</td>
                                            <td>{record.checkIn}</td>
                                            <td>{record.checkOut}</td>
                                            <td>
                                                <span className={`${styles.status_tag} ${record.status === '정상' ? styles.status_normal : styles.status_late}`}>
                                                    {record.status === '정상' ? 'On Time' : 'Late'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AttendanceModal 