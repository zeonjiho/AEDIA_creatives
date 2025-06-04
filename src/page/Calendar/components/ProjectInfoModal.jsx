import React from 'react'
import ss from './ProjectInfoModal.module.css'
import { FaUser, FaClock, FaCalendarAlt, FaTags, FaExternalLinkAlt, FaLink, FaUsers } from 'react-icons/fa'

const ProjectInfoModal = React.memo(({ event, position, isVisible, onMouseEnter, onMouseLeave, project }) => {
    if (!isVisible || !event) return null

    // 프로젝트가 연동되지 않은 경우 - 작은 모달
    if (!project) {
        return (
            <div 
                className={`${ss.modal_overlay} ${ss.compact}`}
                style={{
                    left: position.x,
                    top: position.y,
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className={`${ss.modal_content} ${ss.compact_content}`}>
                    <div className={ss.unlinked_content_compact}>
                        <div className={ss.event_title_compact}>
                            {event.title}
                        </div>
                        <div className={ss.event_time_compact}>
                            <FaClock className={ss.time_icon_compact} />
                            {event.start?.toLocaleString('ko-KR', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </div>
                        <div className={ss.unlinked_status}>
                            <FaLink className={ss.unlinked_icon_compact} />
                            프로젝트 연동 필요
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 실제 프로젝트 데이터가 있으면 사용, 없으면 기본값
    const projectInfo = project || {
        title: event.title || '프로젝트명 없음',
        description: '프로젝트 상세 정보가 없습니다.',
        status: 'concept',
        progress: 0,
        deadline: new Date(),
        team: [],
        staffList: []
    }

    // 프로젝트 상태를 한국어로 변환
    const getStatusInKorean = (status) => {
        const statusMap = {
            'concept': '기획',
            'development': '개발',
            'pre_production': '프리 프로덕션',
            'production': '프로덕션',
            'post_production': '포스트 프로덕션',
            'vfx': 'VFX',
            'sound_design': '사운드 디자인',
            'quality_check': '품질 검수',
            'delivery': '납품'
        }
        
        return statusMap[status] || status
    }

    // 상태에 따른 우선순위 결정
    const getPriorityFromStatus = (status) => {
        const priorityMap = {
            'delivery': '긴급',
            'quality_check': '긴급',
            'post_production': '높음',
            'production': '높음',
            'vfx': '보통',
            'sound_design': '보통',
            'pre_production': '보통',
            'development': '보통',
            'concept': '낮음'
        }
        
        return priorityMap[status] || '보통'
    }

    // 팀원 수 계산 및 상세 정보
    const getTeamDetails = () => {
        const internalTeam = []
        const externalTeam = []
        
        // 1. team 필드에서 내부 직원들 처리 (직접 User 참조)
        if (projectInfo.team && Array.isArray(projectInfo.team) && projectInfo.team.length > 0) {
            const teamMembers = projectInfo.team
                .filter(member => member && member.userType === 'internal') // null 체크 추가
                .map(member => ({
                    name: member.name || '알 수 없음',
                    email: member.email || '',
                    department: member.department || '',
                    userType: member.userType
                }))
            
            if (teamMembers.length > 0) {
                internalTeam.push({
                    role: '팀원',
                    count: teamMembers.length,
                    members: teamMembers
                })
            }
        }
        
        // 2. staffList에서 역할별 멤버들 처리 (외부 인력 위주)
        if (projectInfo.staffList && Array.isArray(projectInfo.staffList) && projectInfo.staffList.length > 0) {
            projectInfo.staffList.forEach(role => {
                if (!role || !role.members || !Array.isArray(role.members)) return // null 체크
                
                const internalMembers = []
                const externalMembers = []
                
                // 각 역할의 멤버들을 userType에 따라 분류
                role.members.forEach(member => {
                    if (!member) return // null 체크
                    
                    // 실제 유저 객체인 경우 (populated)
                    if (member.userId && member.userId.userType) {
                        const memberData = {
                            name: member.userId.name || '알 수 없음',
                            email: member.userId.email || '',
                            department: member.userId.department || '',
                            userType: member.userId.userType
                        }
                        
                        if (member.userId.userType === 'internal') {
                            internalMembers.push(memberData)
                        } else {
                            externalMembers.push(memberData)
                        }
                    }
                    // 직접 userType이 있는 경우
                    else if (member.userType) {
                        const memberData = {
                            name: member.name || '알 수 없음',
                            email: member.email || '',
                            department: member.department || '',
                            userType: member.userType
                        }
                        
                        if (member.userType === 'internal') {
                            internalMembers.push(memberData)
                        } else {
                            externalMembers.push(memberData)
                        }
                    }
                    // 기본값: external로 처리
                    else {
                        externalMembers.push({
                            name: member.name || '알 수 없음',
                            email: member.email || '',
                            department: member.department || '',
                            userType: 'external'
                        })
                    }
                })
                
                // 내부팀에 멤버가 있으면 추가
                if (internalMembers.length > 0) {
                    internalTeam.push({
                        role: role.roleName || '역할 없음',
                        count: internalMembers.length,
                        members: internalMembers
                    })
                }
                
                // 외부팀에 멤버가 있으면 추가
                if (externalMembers.length > 0) {
                    externalTeam.push({
                        role: role.roleName || '역할 없음',
                        count: externalMembers.length,
                        members: externalMembers
                    })
                }
            })
        }
        
        const internalCount = internalTeam.reduce((sum, role) => sum + role.count, 0)
        const externalCount = externalTeam.reduce((sum, role) => sum + role.count, 0)
        const totalMembers = internalCount + externalCount
        
        return { 
            totalMembers, 
            internalTeam, 
            externalTeam,
            internalCount,
            externalCount
        }
    }

    const koreanStatus = getStatusInKorean(projectInfo.status)
    const priority = getPriorityFromStatus(projectInfo.status)
    const { totalMembers, internalTeam, externalTeam, internalCount, externalCount } = getTeamDetails()

    return (
        <div 
            className={ss.modal_overlay}
            style={{
                left: position.x,
                top: position.y,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={ss.modal_content}>
                {/* 헤더 - 간소화 */}
                <div className={ss.modal_header}>
                    <div className={ss.project_title}>{projectInfo.title}</div>
                    <div className={ss.status_badges}>
                        <span className={ss.status_badge}>{koreanStatus}</span>
                        <span className={ss.progress_badge}>{projectInfo.progress}%</span>
                    </div>
                </div>

                {/* 팀원 정보 - 간소화 */}
                {(internalTeam.length > 0 || externalTeam.length > 0) && (
                    <div className={ss.team_section}>
                        {/* 내부팀 */}
                        {internalTeam.length > 0 && (
                            <div className={ss.team_group}>
                                <div className={ss.team_header}>
                                    <span className={ss.team_label}>내부팀 {internalCount}명</span>
                                </div>
                                {internalTeam.map((role, index) => (
                                    <div key={index} className={`${ss.role_line} ${ss.internal}`}>
                                        <span className={ss.role_title}>{role.role}</span>
                                        <div className={ss.members_inline}>
                                            {role.members.map((member, memberIndex) => (
                                                <span key={memberIndex} className={ss.member_tag}>
                                                    {member.name || `팀원 ${memberIndex + 1}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* 외부팀 */}
                        {externalTeam.length > 0 && (
                            <div className={ss.team_group}>
                                <div className={ss.team_header}>
                                    <span className={ss.team_label}>외부팀 {externalCount}명</span>
                                </div>
                                {externalTeam.map((role, index) => (
                                    <div key={index} className={`${ss.role_line} ${ss.external}`}>
                                        <span className={ss.role_title}>{role.role}</span>
                                        <div className={ss.members_inline}>
                                            {role.members.map((member, memberIndex) => (
                                                <span key={memberIndex} className={ss.member_tag}>
                                                    {member.name || `팀원 ${memberIndex + 1}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 이벤트 정보 - 간소화 */}
                <div className={ss.event_footer}>
                    <span className={ss.event_time}>
                        {event.start?.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </span>
                </div>
            </div>
        </div>
    )
})

export default ProjectInfoModal 