import React from 'react'
import moment from 'moment'
import ss from './EventModal.module.css'
import { FaTimes, FaClock, FaMapMarkerAlt, FaFileAlt, FaGoogle, FaUser } from 'react-icons/fa'

const EventModal = ({ event, isOpen, onClose }) => {
    if (!isOpen || !event) return null

    const startTime = moment(event.start).format('YYYY-MM-DD HH:mm')
    const endTime = moment(event.end).format('YYYY-MM-DD HH:mm')
    const timeInfo = event.allDay ? '종일' : `${startTime} - ${endTime}`

    const getEventTypeKorean = (type) => {
        const typeMap = {
            'meeting': '회의',
            'deadline': '마감일',
            'holiday': '휴일',
            'client': '클라이언트',
            'user': '사용자 추가',
            'personal': '개인일정'
        }
        return typeMap[type] || '일반'
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className={ss.modal_backdrop} onClick={handleBackdropClick}>
            <div className={ss.modal_content}>
                <div className={ss.modal_header}>
                    <h2 className={ss.modal_title}>{event.title}</h2>
                    <button className={ss.close_btn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={ss.modal_body}>
                    <div className={ss.event_detail}>
                        <div className={ss.detail_item}>
                            <FaClock className={ss.detail_icon} />
                            <div>
                                <span className={ss.detail_label}>시간</span>
                                <span className={ss.detail_value}>{timeInfo}</span>
                            </div>
                        </div>

                        <div className={ss.detail_item}>
                            <div className={`${ss.type_badge} ${ss[`type_${event.type}`]}`}>
                                {getEventTypeKorean(event.type)}
                            </div>
                        </div>

                        {event.location && (
                            <div className={ss.detail_item}>
                                <FaMapMarkerAlt className={ss.detail_icon} />
                                <div>
                                    <span className={ss.detail_label}>장소</span>
                                    <span className={ss.detail_value}>{event.location}</span>
                                </div>
                            </div>
                        )}

                        {event.description && (
                            <div className={ss.detail_item}>
                                <FaFileAlt className={ss.detail_icon} />
                                <div>
                                    <span className={ss.detail_label}>설명</span>
                                    <span className={ss.detail_value}>{event.description}</span>
                                </div>
                            </div>
                        )}

                        <div className={ss.detail_item}>
                            {event.source === 'google' ? (
                                <div className={ss.source_info}>
                                    <FaGoogle className={ss.source_icon} />
                                    <span>구글 캘린더에서 동기화됨</span>
                                </div>
                            ) : (
                                <div className={ss.source_info}>
                                    <FaUser className={ss.source_icon} />
                                    <span>로컬에서 추가됨</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={ss.modal_footer}>
                    <button className={ss.close_modal_btn} onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EventModal 