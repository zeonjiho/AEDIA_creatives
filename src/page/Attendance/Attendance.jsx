import React, { useState, useEffect } from 'react'
import ss from './Attendance.module.css'
import { FaCalendarCheck, FaUserClock, FaHistory, FaCheckCircle } from 'react-icons/fa'

const Attendance = () => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [attendanceStatus, setAttendanceStatus] = useState('미출근')
    const [attendanceHistory, setAttendanceHistory] = useState([
        { date: '2023-10-01', checkIn: '09:05', checkOut: '18:10', status: '정상' },
        { date: '2023-10-02', checkIn: '08:55', checkOut: '18:05', status: '정상' },
        { date: '2023-10-03', checkIn: '09:15', checkOut: '18:20', status: '지각' },
    ])

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // 출근 체크인 함수
    const handleCheckIn = () => {
        const now = new Date()
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        
        // 9시 이후면 지각
        const isLate = now.getHours() >= 9 && now.getMinutes() > 0
        
        setAttendanceStatus('출근')
        
        // 로컬 스토리지에 출근 시간 저장
        localStorage.setItem('checkInTime', formattedTime)
        localStorage.setItem('checkInDate', now.toISOString().split('T')[0])
        
        alert(`출근 체크 완료: ${formattedTime} (${isLate ? '지각' : '정상'})`)
    }

    // 퇴근 체크아웃 함수
    const handleCheckOut = () => {
        const now = new Date()
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const checkInTime = localStorage.getItem('checkInTime')
        const checkInDate = localStorage.getItem('checkInDate')
        
        if (!checkInTime || !checkInDate) {
            alert('출근 기록이 없습니다.')
            return
        }
        
        // 출근 시간 기준으로 지각 여부 확인
        const isLate = checkInTime > '09:00'
        
        // 새로운 출퇴근 기록 추가
        const newRecord = {
            date: checkInDate,
            checkIn: checkInTime,
            checkOut: formattedTime,
            status: isLate ? '지각' : '정상'
        }
        
        setAttendanceHistory([newRecord, ...attendanceHistory])
        setAttendanceStatus('퇴근')
        
        // 로컬 스토리지 초기화
        localStorage.removeItem('checkInTime')
        localStorage.removeItem('checkInDate')
        
        alert(`퇴근 체크 완료: ${formattedTime}`)
    }

    // 날짜 포맷팅 함수
    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        return date.toLocaleDateString('ko-KR', options)
    }

    // 시간 포맷팅 함수
    const formatTime = (date) => {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    return (
        <div className={ss.attendance_wrap}>
            <h1 className={ss.attendance_title}>출근 인증</h1>
            
            <div className={ss.attendance_grid}>
                {/* 현재 시간 및 상태 카드 */}
                <div className={ss.attendance_card}>
                    <div className={ss.card_header}>
                        <FaUserClock className={ss.card_icon} />
                        <h2>현재 상태</h2>
                    </div>
                    <div className={ss.card_content}>
                        <div className={ss.time_display}>
                            <div className={ss.current_date}>{formatDate(currentTime)}</div>
                            <div className={ss.current_time}>{formatTime(currentTime)}</div>
                        </div>
                        <div className={ss.status_display}>
                            <div className={`${ss.status_badge} ${ss[attendanceStatus === '미출근' ? 'status_not_checked' : attendanceStatus === '출근' ? 'status_checked_in' : 'status_checked_out']}`}>
                                {attendanceStatus}
                            </div>
                        </div>
                        <div className={ss.attendance_buttons}>
                            <button 
                                className={ss.check_in_button}
                                onClick={handleCheckIn}
                                disabled={attendanceStatus === '출근'}
                            >
                                출근하기
                            </button>
                            <button 
                                className={ss.check_out_button}
                                onClick={handleCheckOut}
                                disabled={attendanceStatus !== '출근'}
                            >
                                퇴근하기
                            </button>
                        </div>
                    </div>
                </div>

                {/* 이번 주 출근 현황 카드 */}
                <div className={ss.attendance_card}>
                    <div className={ss.card_header}>
                        <FaCalendarCheck className={ss.card_icon} />
                        <h2>이번 주 출근 현황</h2>
                    </div>
                    <div className={ss.card_content}>
                        <div className={ss.week_summary}>
                            <div className={ss.week_day}>
                                <div className={`${ss.day_circle} ${ss.day_present}`}>월</div>
                                <div className={ss.day_status}><FaCheckCircle /></div>
                            </div>
                            <div className={ss.week_day}>
                                <div className={`${ss.day_circle} ${ss.day_present}`}>화</div>
                                <div className={ss.day_status}><FaCheckCircle /></div>
                            </div>
                            <div className={ss.week_day}>
                                <div className={`${ss.day_circle} ${ss.day_late}`}>수</div>
                                <div className={ss.day_status}><FaCheckCircle /></div>
                            </div>
                            <div className={ss.week_day}>
                                <div className={`${ss.day_circle} ${ss.day_today}`}>목</div>
                                <div className={ss.day_status}></div>
                            </div>
                            <div className={ss.week_day}>
                                <div className={`${ss.day_circle} ${ss.day_future}`}>금</div>
                                <div className={ss.day_status}></div>
                            </div>
                        </div>
                        <div className={ss.week_stats}>
                            <div className={ss.stat_item}>
                                <span className={ss.stat_label}>정상 출근</span>
                                <span className={ss.stat_value}>2일</span>
                            </div>
                            <div className={ss.stat_item}>
                                <span className={ss.stat_label}>지각</span>
                                <span className={ss.stat_value}>1일</span>
                            </div>
                            <div className={ss.stat_item}>
                                <span className={ss.stat_label}>결근</span>
                                <span className={ss.stat_value}>0일</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 출근 기록 카드 */}
                <div className={ss.attendance_card_full}>
                    <div className={ss.card_header}>
                        <FaHistory className={ss.card_icon} />
                        <h2>출근 기록</h2>
                    </div>
                    <div className={ss.card_content}>
                        <table className={ss.attendance_table}>
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>출근 시간</th>
                                    <th>퇴근 시간</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceHistory.map((record, index) => (
                                    <tr key={index}>
                                        <td>{record.date}</td>
                                        <td>{record.checkIn}</td>
                                        <td>{record.checkOut}</td>
                                        <td>
                                            <span className={`${ss.status_tag} ${record.status === '정상' ? ss.status_normal : ss.status_late}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Attendance 