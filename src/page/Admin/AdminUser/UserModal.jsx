import React, { useState, useEffect } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'

const UserModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdate 
}) => {
  const [status, setStatus] = useState(user?.status || 'active')
  const [userType, setUserType] = useState(user?.userType || 'external')
  const [roles, setRoles] = useState(user?.roles?.join(', ') || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때마다 사용자 정보로 상태 초기화
  useEffect(() => {
    if (user) {
      setStatus(user.status || 'active')
      setUserType(user.userType || 'external')
      setRoles(user.roles?.join(', ') || '')
      setNote('')
    }
  }, [user])

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

  // 사용자 정보 업데이트
  const handleUserUpdate = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const updateData = {
        status,
        userType,
        roles: roles ? roles.split(',').map(role => role.trim()).filter(role => role) : [],
        note
      }

      // API 호출 (실제 구현 시 엔드포인트 확인 필요)
      await api.put(`/admin/update-user/${user._id}`, updateData)
      
      // 성공 시 부모 컴포넌트 업데이트
      if (onUpdate) {
        onUpdate({ ...user, ...updateData })
      }
      
      alert('사용자 정보가 성공적으로 업데이트되었습니다.')
      onClose()
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error)
      alert('사용자 정보 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 사용자 승인 처리
  const handleApproveUser = async () => {
    if (loading) return
    
    const isConfirmed = window.confirm('이 사용자를 승인하시겠습니까?')
    if (!isConfirmed) return

    setLoading(true)
    try {
      await api.get(`/admin/approve-user/${user._id}`)
      
      if (onUpdate) {
        onUpdate({ ...user, status: 'active' })
      }
      
      alert('사용자가 승인되었습니다.')
      onClose()
    } catch (error) {
      console.error('사용자 승인 실패:', error)
      alert('사용자 승인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 사용자 삭제 처리
  const handleDeleteUser = async () => {
    if (loading) return
    
    const isConfirmed = window.confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!isConfirmed) return

    setLoading(true)
    try {
      await api.delete(`/admin/delete-user/${user._id}`)
      
      if (onUpdate) {
        onUpdate({ ...user, status: 'deleted' })
      }
      
      alert('사용자가 삭제되었습니다.')
      onClose()
    } catch (error) {
      console.error('사용자 삭제 실패:', error)
      alert('사용자 삭제에 실패했습니다.')
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
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            사용자 상세 정보
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
                <label>가입일</label>
                <div className={ss.info_value}>{formatDate(user.createdAt)}</div>
              </div>
              <div className={ss.info_item}>
                <label>최근 로그인</label>
                <div className={ss.info_value}>{formatDate(user.lastLogin)}</div>
              </div>
              <div className={ss.info_item}>
                <label>사용자 ID</label>
                <div className={ss.info_value} style={{fontSize: '0.85rem', color: 'var(--text-tertiary)'}}>
                  {user._id}
                </div>
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

          {/* 설정 변경 섹션 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>설정 변경</h3>
            <div className={ss.status_controls}>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>상태 변경</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className={ss.select_input}
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="waiting">대기중</option>
                    <option value="deleted">삭제됨</option>
                  </select>
                </div>
                <div className={ss.info_item}>
                  <label>사용자 구분</label>
                  <select 
                    value={userType} 
                    onChange={(e) => setUserType(e.target.value)}
                    className={ss.select_input}
                  >
                    <option value="internal">내부 직원</option>
                    <option value="external">외부 스태프</option>
                  </select>
                </div>
              </div>

              <div className={ss.info_item}>
                <label>역할 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="예: 개발자, 디자이너, 프로젝트 매니저"
                  className={ss.text_input}
                />
              </div>

              <div className={ss.note_input}>
                <label>관리자 메모 (선택사항)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="사용자 관련 메모나 특이사항을 입력해주세요..."
                  className={ss.textarea_input}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* 활동 정보 */}
          {user.loginHistory && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>활동 정보</h3>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>총 로그인 횟수</label>
                  <div className={ss.info_value}>{user.loginHistory?.length || 0}회</div>
                </div>
                <div className={ss.info_item}>
                  <label>계정 생성일</label>
                  <div className={ss.info_value}>{formatDate(user.createdAt)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={ss.modal_footer}>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            {/* 왼쪽 액션 버튼들 */}
            <div style={{display: 'flex', gap: '8px', marginRight: 'auto'}}>
              {user.status === 'waiting' && (
                <button 
                  className={ss.button_success} 
                  onClick={handleApproveUser}
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '승인하기'}
                </button>
              )}
              {user.status !== 'deleted' && (
                <button 
                  className={ss.button_danger} 
                  onClick={handleDeleteUser}
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '삭제하기'}
                </button>
              )}
            </div>
            
            {/* 오른쪽 기본 버튼들 */}
            <button 
              className={ss.button_secondary} 
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button 
              className={ss.button_primary} 
              onClick={handleUserUpdate}
              disabled={loading}
            >
              {loading ? '처리 중...' : '정보 업데이트'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserModal 