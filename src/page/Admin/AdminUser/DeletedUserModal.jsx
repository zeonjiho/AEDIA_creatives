import React, { useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'

const DeletedUserModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdate 
}) => {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !user) return null

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'waiting': '대기중',
      'active': '활성',
      'inactive': '비활성',
      'deleted': '삭제됨'
    }
    return statusMap[status] || status
  }

  // 사용자 타입 텍스트 변환
  const getUserTypeText = (userType) => {
    const typeMap = {
      'internal': '내부 직원',
      'external': '외부 스태프'
    }
    return typeMap[userType] || userType
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 전화번호 포맷팅
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-'
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
    }
    return phone
  }

  // 사용자 복구 처리
  const handleRestoreUser = async () => {
    if (loading) return
    
    console.log('=== 복구 기능 시작 ===')
    console.log('현재 사용자:', user)
    console.log('사용자 상태:', user?.status)
    console.log('사용자 타입:', user?.userType)
    
    const isConfirmed = window.confirm('이 사용자를 복구하시겠습니까? 상태가 "활성"으로 변경됩니다.')
    if (!isConfirmed) {
      console.log('사용자가 복구를 취소했습니다.')
      return
    }

    setLoading(true)
    try {
      const apiEndpoint = user.userType === 'internal' 
        ? `/admin/update-user/${user._id}` 
        : `/admin/update-staff/${user._id}`
      
      console.log(`사용자 복구 시작: ${user.name} (${user.userType})`)
      console.log(`API 엔드포인트: ${apiEndpoint}`)
      console.log('전송할 데이터:', { status: 'active' })
      
      const response = await api.put(apiEndpoint, { status: 'active' })
      
      console.log('복구 API 응답 성공:', response)
      console.log('응답 데이터:', response.data)
      
      if (onUpdate) {
        console.log('부모 컴포넌트 업데이트 호출')
        onUpdate({ ...user, status: 'active' })
      } else {
        console.warn('onUpdate 함수가 없습니다!')
      }
      
      alert(`${user.name}님이 성공적으로 복구되었습니다.`)
      console.log('=== 복구 기능 완료 ===')
      onClose()
    } catch (error) {
      console.error('=== 사용자 복구 실패 ===')
      console.error('에러 객체:', error)
      
      if (error.response) {
        console.error('서버 응답 상태:', error.response.status)
        console.error('서버 응답 데이터:', error.response.data)
        console.error('서버 응답 헤더:', error.response.headers)
        alert(`사용자 복구에 실패했습니다: ${error.response.data?.message || error.response.statusText || '알 수 없는 오류'}`)
      } else if (error.request) {
        console.error('요청 실패 - 서버 응답 없음:', error.request)
        alert('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.')
      } else {
        console.error('요청 설정 오류:', error.message)
        alert(`요청 처리 중 오류가 발생했습니다: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // 상태에 따른 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return ss.status_active
      case 'waiting': return ss.status_warning
      case 'inactive': return ss.status_info
      case 'deleted': return ss.status_danger
      default: return ss.status_info
    }
  }

  // 역할 배지 생성
  const renderRoleBadges = (rolesArray) => {
    if (!rolesArray || rolesArray.length === 0) return <span style={{color: 'var(--text-tertiary)'}}>역할 없음</span>
    
    return rolesArray.map((role, index) => (
      <span key={index} className={ss.project_badge} style={{marginRight: '6px', marginBottom: '4px'}}>
        {role}
      </span>
    ))
  }

  return (
    <div className={ss.modal_overlay} onClick={onClose}>
      <div className={ss.modal_container} onClick={(e) => e.stopPropagation()}>
        <div className={ss.modal_header}>
          <div className={ss.modal_title}>
            <div className={`${ss.chart_icon} ${user.userType === 'internal' ? ss.user : ss.staff}`}></div>
            삭제된 {user.userType === 'internal' ? '직원' : '스태프'} 정보
          </div>
          <button className={ss.modal_close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={ss.modal_content}>
          {/* 기본 정보 섹션 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>기본 정보</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>이름</label>
                <div className={ss.info_value}>{user.name || '-'}</div>
              </div>
              <div className={ss.info_item}>
                <label>이메일</label>
                <div className={ss.info_value}>{user.email || '-'}</div>
              </div>
              <div className={ss.info_item}>
                <label>전화번호</label>
                <div className={ss.info_value}>{formatPhoneNumber(user.phone)}</div>
              </div>
              <div className={ss.info_item}>
                <label>등록일</label>
                <div className={ss.info_value}>{formatDate(user.createdAt)}</div>
              </div>
              {user.userType === 'external' && (
                <div className={ss.info_item}>
                  <label>경력</label>
                  <div className={ss.info_value}>
                    {user.experience ? (
                      <span className={ss.category_badge}>
                        {user.experience}
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-tertiary)'}}>미정</span>
                    )}
                  </div>
                </div>
              )}
              <div className={ss.info_item}>
                <label>삭제일</label>
                <div className={ss.info_value}>{formatDate(user.updatedAt)}</div>
              </div>
            </div>
          </div>

          {/* 계정 상태 및 권한 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>계정 상태 및 권한</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>현재 상태</label>
                <div className={ss.info_value}>
                  <span className={`${ss.status_badge} ${getStatusClass(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </div>
              </div>
              <div className={ss.info_item}>
                <label>사용자 구분</label>
                <div className={ss.info_value}>
                  <span className={ss.category_badge}>
                    {getUserTypeText(user.userType)}
                  </span>
                </div>
              </div>
              <div className={ss.info_item} style={{gridColumn: '1 / -1'}}>
                <label>역할</label>
                <div className={ss.info_value}>
                  {renderRoleBadges(user.roles)}
                </div>
              </div>
            </div>
          </div>

          {/* 내부 직원 추가 정보 */}
          {user.userType === 'internal' && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>직원 정보</h3>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>입사 년도</label>
                  <div className={ss.info_value}>
                    {user.hireYear ? `${user.hireYear}년` : '-'}
                    {user.hireYear && (
                      <span style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '8px'}}>
                        (경력 {new Date().getFullYear() - user.hireYear}년)
                      </span>
                    )}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>슬랙 ID</label>
                  <div className={ss.info_value}>{user.slackId || '-'}</div>
                </div>
                <div className={ss.info_item}>
                  <label>최근 로그인</label>
                  <div className={ss.info_value}>{formatDate(user.lastLogin)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 외부 스태프 추가 정보 */}
          {user.userType === 'external' && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>스태프 정보</h3>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>소속</label>
                  <div className={ss.info_value}>
                    {user.department ? (
                      <span className={ss.category_badge}>
                        {user.department}
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-tertiary)'}}>미정</span>
                    )}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>SNS 아이디</label>
                  <div className={ss.info_value}>
                    {user.snsId ? (
                      <span className={ss.project_badge}>
                        {user.snsId}
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-tertiary)'}}>미등록</span>
                    )}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>경력</label>
                  <div className={ss.info_value}>
                    {user.experience ? (
                      <span className={ss.category_badge}>
                        {user.experience}
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-tertiary)'}}>미정</span>
                    )}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>최근 로그인</label>
                  <div className={ss.info_value}>{formatDate(user.lastLogin)}</div>
                </div>
              </div>
            </div>
          )}

          {/* 관리자 메모 */}
          {user.adminMemo && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>관리자 메모</h3>
              <div className={ss.info_item}>
                <div className={ss.info_value} style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)'
                }}>
                  "{user.adminMemo}"
                </div>
              </div>
            </div>
          )}

          {/* 삭제 정보 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>삭제 정보</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>삭제 상태</label>
                <div className={ss.info_value}>
                  <span className={`${ss.status_badge} ${ss.status_danger}`}>
                    논리적 삭제 (복구 가능)
                  </span>
                </div>
              </div>
              <div className={ss.info_item}>
                <label>삭제일시</label>
                <div className={ss.info_value}>{formatDate(user.updatedAt)}</div>
              </div>
              <div className={ss.info_item} style={{gridColumn: '1 / -1'}}>
                <label>복구 안내</label>
                <div className={ss.info_value} style={{
                  color: 'var(--warning-color)',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  ⚠️ 복구 시 사용자 상태가 "활성"으로 변경되며, 시스템에 다시 표시됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={ss.modal_footer}>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%'}}>
            {/* 왼쪽 복구 버튼 */}
            <button 
              className={ss.button_success} 
              onClick={handleRestoreUser}
              disabled={loading}
              style={{
                padding: '12px 20px',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              {loading ? '처리 중...' : '🔄 복구하기'}
            </button>
            
            {/* 오른쪽 취소 버튼 */}
            <button 
              className={ss.button_secondary} 
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 20px',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeletedUserModal 