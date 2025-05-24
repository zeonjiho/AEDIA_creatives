import React, { useState } from 'react'
import moment from 'moment'
import ss from './AddEventModal.module.css'
import { FaTimes, FaCalendarPlus, FaCheck } from 'react-icons/fa'

const AddEventModal = ({ isOpen, onClose, onSave, initialDate = new Date() }) => {
    const [formData, setFormData] = useState({
        title: '',
        startDate: moment(initialDate).format('YYYY-MM-DD'),
        startTime: moment(initialDate).format('HH:mm'),
        endDate: moment(initialDate).format('YYYY-MM-DD'),
        endTime: moment(initialDate).add(1, 'hour').format('HH:mm'),
        allDay: false,
        type: 'user',
        location: '',
        description: ''
    })

    const [errors, setErrors] = useState({})

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // 에러 클리어
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.title.trim()) {
            newErrors.title = '제목을 입력해주세요'
        }

        if (!formData.allDay) {
            const startDateTime = moment(`${formData.startDate} ${formData.startTime}`)
            const endDateTime = moment(`${formData.endDate} ${formData.endTime}`)

            if (endDateTime.isSameOrBefore(startDateTime)) {
                newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        
        if (!validateForm()) return

        const startDateTime = formData.allDay 
            ? moment(formData.startDate).startOf('day').toDate()
            : moment(`${formData.startDate} ${formData.startTime}`).toDate()

        const endDateTime = formData.allDay
            ? moment(formData.endDate).endOf('day').toDate()
            : moment(`${formData.endDate} ${formData.endTime}`).toDate()

        const newEvent = {
            id: `user-${Date.now()}`,
            title: formData.title,
            start: startDateTime,
            end: endDateTime,
            allDay: formData.allDay,
            type: formData.type,
            location: formData.location || null,
            description: formData.description || null,
            source: 'user'
        }

        onSave(newEvent)
        onClose()
        
        // 폼 초기화
        setFormData({
            title: '',
            startDate: moment().format('YYYY-MM-DD'),
            startTime: moment().format('HH:mm'),
            endDate: moment().format('YYYY-MM-DD'),
            endTime: moment().add(1, 'hour').format('HH:mm'),
            allDay: false,
            type: 'user',
            location: '',
            description: ''
        })
        setErrors({})
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const eventTypes = [
        { value: 'user', label: '사용자 추가' },
        { value: 'meeting', label: '회의' },
        { value: 'deadline', label: '마감일' },
        { value: 'client', label: '클라이언트' },
        { value: 'personal', label: '개인일정' }
    ]

    if (!isOpen) return null

    return (
        <div className={ss.modal_backdrop} onClick={handleBackdropClick}>
            <div className={ss.modal_content}>
                <div className={ss.modal_header}>
                    <h2 className={ss.modal_title}>
                        <FaCalendarPlus className={ss.title_icon} />
                        새 일정 추가
                    </h2>
                    <button className={ss.close_btn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={ss.modal_body}>
                    <div className={ss.form_group}>
                        <label className={ss.form_label}>제목 *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`${ss.form_input} ${errors.title ? ss.error : ''}`}
                            placeholder="일정 제목을 입력하세요"
                        />
                        {errors.title && <span className={ss.error_message}>{errors.title}</span>}
                    </div>

                    <div className={ss.form_row}>
                        <div className={ss.form_group}>
                            <label className={ss.form_label}>유형</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className={ss.form_select}
                            >
                                {eventTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={ss.form_group}>
                            <label className={ss.checkbox_label}>
                                <input
                                    type="checkbox"
                                    name="allDay"
                                    checked={formData.allDay}
                                    onChange={handleInputChange}
                                    className={ss.form_checkbox}
                                />
                                종일
                            </label>
                        </div>
                    </div>

                    <div className={ss.form_row}>
                        <div className={ss.form_group}>
                            <label className={ss.form_label}>시작일</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                className={ss.form_input}
                            />
                        </div>

                        {!formData.allDay && (
                            <div className={ss.form_group}>
                                <label className={ss.form_label}>시작 시간</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className={ss.form_input}
                                />
                            </div>
                        )}
                    </div>

                    <div className={ss.form_row}>
                        <div className={ss.form_group}>
                            <label className={ss.form_label}>종료일</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className={ss.form_input}
                            />
                        </div>

                        {!formData.allDay && (
                            <div className={ss.form_group}>
                                <label className={ss.form_label}>종료 시간</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className={`${ss.form_input} ${errors.endTime ? ss.error : ''}`}
                                />
                                {errors.endTime && <span className={ss.error_message}>{errors.endTime}</span>}
                            </div>
                        )}
                    </div>

                    <div className={ss.form_group}>
                        <label className={ss.form_label}>장소</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className={ss.form_input}
                            placeholder="장소를 입력하세요 (선택사항)"
                        />
                    </div>

                    <div className={ss.form_group}>
                        <label className={ss.form_label}>설명</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={ss.form_textarea}
                            placeholder="일정에 대한 설명을 입력하세요 (선택사항)"
                            rows="3"
                        />
                    </div>

                    <div className={ss.modal_footer}>
                        <button 
                            type="button" 
                            className={ss.cancel_btn} 
                            onClick={onClose}
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className={ss.save_btn}
                        >
                            <FaCheck className={ss.btn_icon} />
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddEventModal 