import React, { useState, useRef, useEffect } from 'react'
import { FaTimes, FaChevronDown, FaUser, FaCheck, FaPlus } from 'react-icons/fa'
import styles from './QuickEventModal.module.css'
import { getProjectColorTag, users as dbUsers, projectStatuses } from '../../data/mockDatabase'

/**
 * 퀵 이벤트 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {Object} props.position - 모달 위치 (x, y 좌표)
 * @param {Function} props.onClose - 취소 핸들러
 * @param {Function} props.onSave - 저장 핸들러
 * @param {Date} props.date - 선택된 날짜
 * @param {Object} [props.timeRange] - 시간 범위 (start, end) - 선택적
 * @param {Array} props.projects - 프로젝트 목록
 * @returns {JSX.Element}
 */
const QuickEventModal = ({ position, onClose, onSave, date, timeRange, projects = [] }) => {
    const [title, setTitle] = useState('')
    const [colorTag, setColorTag] = useState(1)
    const [isSelecting, setIsSelecting] = useState(false)
    const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : 1)
    const [projectStatusId, setProjectStatusId] = useState(projectStatuses.IN_PROGRESS.id)
    const [assignees, setAssignees] = useState([]) // 다중 담당자 배열 - 기본값 빈 배열
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
    
    const colorTagsRef = useRef(null)
    const projectDropdownRef = useRef(null)
    const statusDropdownRef = useRef(null)
    const assigneeDropdownRef = useRef(null)
    
    // 프로젝트 변경 시 해당 프로젝트의 색상 태그로 업데이트
    useEffect(() => {
        if (projectId) {
            setColorTag(getProjectColorTag(projectId))
        }
    }, [projectId])
    
    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
                setShowProjectDropdown(false)
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setShowStatusDropdown(false)
            }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
                setShowAssigneeDropdown(false)
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])
    
    const handleTitleChange = (e) => {
        setTitle(e.target.value)
    }
    
    const handleColorTagChange = (tag) => {
        if (tag === colorTag) return
        setIsSelecting(true)
        setColorTag(tag)
        
        // 선택 애니메이션이 끝난 후 상태 초기화
        setTimeout(() => {
            setIsSelecting(false)
        }, 500) // 애니메이션 지속 시간과 일치
    }
    
    const handleProjectChange = (id) => {
        setProjectId(id)
        setShowProjectDropdown(false)
    }
    
    const handleStatusChange = (id) => {
        setProjectStatusId(id)
        setShowStatusDropdown(false)
    }
    
    const handleAssigneeToggle = (id) => {
        setAssignees(prev => {
            // 이미 선택된 담당자인 경우 제거
            if (prev.includes(id)) {
                return prev.filter(assigneeId => assigneeId !== id)
            } 
            // 새로운 담당자 추가
            else {
                return [...prev, id]
            }
        })
    }
    
    const handleSubmit = (e) => {
        e.preventDefault()
        if (title.trim()) {
            const eventData = {
                title,
                projectId,
                projectStatus: projectStatusId,
                assignees: assignees.length > 0 ? assignees : [], // 다중 담당자 배열
                colorTag,
                color: `var(--color-tag-${colorTag})`,
                start: timeRange?.start || date,
                end: timeRange?.end || new Date(date.getTime() + 60 * 60 * 1000), // 기본 1시간 이벤트
                description: `${title} - ${getProjectName(projectId)} (${getStatusName(projectStatusId)})`,
                location: ''
            }
            
            // 시작일과 종료일이 같은 경우 종료 시간을 시작 시간 + 1시간으로 설정
            if (timeRange?.start && timeRange?.end) {
                const startDate = new Date(timeRange.start);
                const endDate = new Date(timeRange.end);
                
                // 날짜만 비교 (시간 제외)
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                
                if (startDate.getTime() === endDate.getTime()) {
                    // 같은 날짜면 종료 시간을 시작 시간 + 1시간으로 설정
                    const newEnd = new Date(timeRange.start);
                    newEnd.setHours(newEnd.getHours() + 1);
                    eventData.end = newEnd;
                } else {
                    // 다른 날짜면 종료일의 23:59:59로 설정
                    const newEnd = new Date(timeRange.end);
                    newEnd.setHours(23, 59, 59);
                    eventData.end = newEnd;
                    
                    // 시작일은 00:00:00으로 설정
                    const newStart = new Date(timeRange.start);
                    newStart.setHours(0, 0, 0);
                    eventData.start = newStart;
                }
            }
            
            onSave(eventData)
        }
        onClose()
    }
    
    const formatDateRange = () => {
        // timeRange가 없으면 선택된 날짜만 표시
        if (!timeRange) {
            if (!date) return '날짜 선택 중...'
            
            const options = { month: 'short', day: 'numeric' }
            return date.toLocaleDateString('ko-KR', options)
        }
        
        // timeRange가 있으면 시간 범위 표시
        if (!timeRange.start || !timeRange.end) return '날짜 선택 중...'
        
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
        
        // 시작일과 종료일이 같으면 하나만 표시
        if (startDate.getTime() === endDate.getTime()) {
            return startStr
        }
        
        return `${startStr} - ${endStr}`
    }
    
    // 프로젝트 이름 가져오기
    const getProjectName = (id) => {
        const project = projects.find(p => p.id === id)
        return project ? project.title : '프로젝트 없음'
    }
    
    // 상태 이름 가져오기
    const getStatusName = (id) => {
        const status = Object.values(projectStatuses).find(s => s.id === id)
        return status ? status.name : 'Unknown'
    }
    
    // 상태 색상 가져오기
    const getStatusColor = (id) => {
        const status = Object.values(projectStatuses).find(s => s.id === id)
        return status ? status.color : 'var(--color-tag-1)'
    }
    
    // 담당자 이름 가져오기
    const getAssigneeName = (id) => {
        const user = dbUsers.find(u => u.id === id)
        return user ? user.name : '담당자 없음'
    }
    
    // 담당자 아바타 가져오기
    const getAssigneeAvatar = (id) => {
        const user = dbUsers.find(u => u.id === id)
        return user ? user.avatar : null
    }
    
    // 선택된 담당자 요약 텍스트 생성
    const getAssigneeSummary = () => {
        if (assignees.length === 0) {
            return '담당자 선택'
        } else if (assignees.length === 1) {
            return getAssigneeName(assignees[0])
        } else {
            return `${getAssigneeName(assignees[0])} 외 ${assignees.length - 1}명`
        }
    }
    
    // 컬러 태그 배열 (1-10)
    const colorTags = Array.from({ length: 10 }, (_, i) => i + 1)
    
    // 프로젝트 상태 배열
    const statusList = Object.values(projectStatuses)
    
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
                <div className={styles.quickEventHeader}>
                    <span className={styles.dateRange}>{formatDateRange()}</span>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className={styles.titleInput}
                        placeholder="일정 제목 입력"
                        value={title}
                        onChange={handleTitleChange}
                        autoFocus
                    />
                    
                    {/* 프로젝트 선택 */}
                    <div className={styles.selectSection}>
                        <label className={styles.selectLabel}>프로젝트</label>
                        <div className={styles.selectContainer} ref={projectDropdownRef}>
                            <div 
                                className={styles.selectValue}
                                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                            >
                                <span 
                                    className={styles.projectColorDot}
                                    style={{ backgroundColor: `var(--color-tag-${getProjectColorTag(projectId)})` }}
                                ></span>
                                {getProjectName(projectId)}
                                <FaChevronDown className={styles.dropdownIcon} />
                            </div>
                            
                            {showProjectDropdown && (
                                <div className={styles.dropdownMenu}>
                                    {projects.map(project => (
                                        <div 
                                            key={project.id}
                                            className={`${styles.dropdownItem} ${projectId === project.id ? styles.selected : ''}`}
                                            onClick={() => handleProjectChange(project.id)}
                                        >
                                            <span 
                                                className={styles.projectColorDot}
                                                style={{ backgroundColor: `var(--color-tag-${getProjectColorTag(project.id)})` }}
                                            ></span>
                                            {project.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 프로젝트 상태 선택 */}
                    <div className={styles.selectSection}>
                        <label className={styles.selectLabel}>프로젝트 상태</label>
                        <div className={styles.selectContainer} ref={statusDropdownRef}>
                            <div 
                                className={styles.selectValue}
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            >
                                <span 
                                    className={styles.statusBadge}
                                    style={{ backgroundColor: getStatusColor(projectStatusId) }}
                                >
                                    {getStatusName(projectStatusId)}
                                </span>
                                <FaChevronDown className={styles.dropdownIcon} />
                            </div>
                            
                            {showStatusDropdown && (
                                <div className={styles.dropdownMenu}>
                                    {statusList.map(status => (
                                        <div 
                                            key={status.id}
                                            className={`${styles.dropdownItem} ${projectStatusId === status.id ? styles.selected : ''}`}
                                            onClick={() => handleStatusChange(status.id)}
                                        >
                                            <span 
                                                className={styles.statusBadge}
                                                style={{ backgroundColor: status.color }}
                                            >
                                                {status.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 담당자 다중선택 */}
                    <div className={styles.selectSection}>
                        <label className={styles.selectLabel}>담당자</label>
                        <div className={styles.selectContainer} ref={assigneeDropdownRef}>
                            <div 
                                className={styles.selectValue}
                                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                            >
                                {assignees.length > 0 ? (
                                    <div className={styles.assigneeChips}>
                                        {assignees.length <= 2 ? (
                                            assignees.map(id => (
                                                <div key={id} className={styles.assigneeChip}>
                                                    {getAssigneeAvatar(id) ? (
                                                        <img 
                                                            src={getAssigneeAvatar(id)} 
                                                            alt={getAssigneeName(id)}
                                                            className={styles.assigneeAvatar}
                                                        />
                                                    ) : (
                                                        <FaUser className={styles.assigneeIcon} />
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                <div className={styles.assigneeChip}>
                                                    {getAssigneeAvatar(assignees[0]) ? (
                                                        <img 
                                                            src={getAssigneeAvatar(assignees[0])} 
                                                            alt={getAssigneeName(assignees[0])}
                                                            className={styles.assigneeAvatar}
                                                        />
                                                    ) : (
                                                        <FaUser className={styles.assigneeIcon} />
                                                    )}
                                                </div>
                                                <div className={styles.assigneeCountChip}>
                                                    +{assignees.length - 1}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <FaUser className={styles.assigneeIcon} />
                                )}
                                <span className={styles.assigneeSummary}>
                                    {getAssigneeSummary()}
                                </span>
                                <FaChevronDown className={styles.dropdownIcon} />
                            </div>
                            
                            {showAssigneeDropdown && (
                                <div className={styles.dropdownMenu}>
                                    {dbUsers.map(user => (
                                        <div 
                                            key={user.id}
                                            className={`${styles.dropdownItem} ${assignees.includes(user.id) ? styles.selected : ''}`}
                                            onClick={() => handleAssigneeToggle(user.id)}
                                        >
                                            {user.avatar ? (
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.name}
                                                    className={styles.assigneeAvatar}
                                                />
                                            ) : (
                                                <FaUser className={styles.assigneeIcon} />
                                            )}
                                            {user.name}
                                            {assignees.includes(user.id) && (
                                                <FaCheck className={styles.checkIcon} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 색상 태그 선택 */}
                    <div className={styles.colorTagsSection}>
                        <label className={styles.selectLabel}>색상 태그</label>
                        <div className={styles.colorTagsContainer} ref={colorTagsRef}>
                            {colorTags.map(tag => (
                                <div
                                    key={tag}
                                    className={`${styles.colorTag} ${colorTag === tag ? styles.selectedColor : ''}`}
                                    style={{ 
                                        backgroundColor: `var(--color-tag-${tag})`,
                                        pointerEvents: isSelecting ? 'none' : 'auto' // 애니메이션 중 선택 방지
                                    }}
                                    onClick={() => handleColorTagChange(tag)}
                                    aria-label={`색상 ${tag} 선택`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleColorTagChange(tag);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            취소
                        </button>
                        <button type="submit" className={styles.saveButton} disabled={!title.trim()}>
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default QuickEventModal 