import React, { useState, useEffect } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'

const StaffModal = ({ 
  isOpen, 
  onClose, 
  staff, 
  onUpdate 
}) => {
  const [department, setDepartment] = useState(staff?.department || '')
  const [roles, setRoles] = useState(staff?.roles?.join(', ') || '')
  const [snsId, setSnsId] = useState(staff?.snsId || '')
  const [note, setNote] = useState(staff?.adminMemo || '')
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때마다 스태프 정보로 상태 초기화
  useEffect(() => {
    if (staff) {
      setDepartment(staff.department || '')
      setRoles(staff.roles?.join(', ') || '')
      setSnsId(staff.snsId || '')
      setNote(staff.adminMemo || '')
    }
  }, [staff])

  if (!isOpen || !staff) return null

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

  // 스태프 정보 업데이트
  const handleStaffUpdate = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const updateData = {
        department: department.trim() || null,
        roles: roles ? roles.split(',').map(role => role.trim()).filter(role => role) : [],
        snsId: snsId.trim() || null,
        adminMemo: note
      }

      // API 호출 (실제 구현 시 엔드포인트 확인 필요)
      await api.put(`/admin/update-staff/${staff._id}`, updateData)
      
      // 성공 시 부모 컴포넌트 업데이트
      if (onUpdate) {
        onUpdate({ ...staff, ...updateData })
      }
      
      alert('스태프 정보가 성공적으로 업데이트되었습니다.')
      onClose()
    } catch (error) {
      console.error('스태프 정보 업데이트 실패:', error)
      alert('스태프 정보 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 스태프 삭제 처리
  const handleDeleteStaff = async () => {
    if (loading) return
    
    const isConfirmed = window.confirm('정말로 이 스태프를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!isConfirmed) return

    setLoading(true)
    try {
      await api.delete(`/admin/delete-staff/${staff._id}`)
      
      if (onUpdate) {
        // 삭제된 스태프를 목록에서 제거하기 위해 null 전달
        onUpdate(null)
      }
      
      alert('스태프가 삭제되었습니다.')
      onClose()
    } catch (error) {
      console.error('스태프 삭제 실패:', error)
      alert('스태프 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
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
            <div className={`${ss.chart_icon} ${ss.staff}`}></div>
            스태프 상세 정보
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
                <div className={ss.info_value}>{staff.name || '-'}</div>
              </div>
              <div className={ss.info_item}>
                <label>이메일</label>
                <div className={ss.info_value}>{staff.email || '-'}</div>
              </div>
              <div className={ss.info_item}>
                <label>전화번호</label>
                <div className={ss.info_value}>{formatPhoneNumber(staff.phone)}</div>
              </div>
              <div className={ss.info_item}>
                <label>등록일</label>
                <div className={ss.info_value}>{formatDate(staff.createdAt)}</div>
              </div>
              <div className={ss.info_item}>
                <label>최근 로그인</label>
                <div className={ss.info_value}>{formatDate(staff.lastLogin)}</div>
              </div>
              <div className={ss.info_item}>
                <label>스태프 ID</label>
                <div className={ss.info_value} style={{fontSize: '0.85rem', color: 'var(--text-tertiary)'}}>
                  {staff._id}
                </div>
              </div>
            </div>
          </div>

          {/* 소속 및 역할 정보 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>소속 및 역할</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>현재 소속</label>
                <div className={ss.info_value}>
                  {staff.department ? (
                    <span className={ss.category_badge}>
                      {staff.department}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>미정</span>
                  )}
                </div>
              </div>
              <div className={ss.info_item}>
                <label>SNS 아이디</label>
                <div className={ss.info_value}>
                  {staff.snsId ? (
                    <span className={ss.project_badge}>
                      {staff.snsId}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>미등록</span>
                  )}
                </div>
              </div>
              <div className={ss.info_item} style={{gridColumn: '1 / -1'}}>
                <label>역할</label>
                <div className={ss.info_value}>
                  {renderRoleBadges(staff.roles)}
                </div>
              </div>
            </div>
          </div>

          {/* 정보 수정 섹션 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>정보 수정</h3>
            <div className={ss.status_controls}>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>소속 부서</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="예: 디자인팀, 개발팀, 마케팅팀"
                    className={ss.text_input}
                  />
                </div>
                <div className={ss.info_item}>
                  <label>SNS 아이디</label>
                  <input
                    type="text"
                    value={snsId}
                    onChange={(e) => setSnsId(e.target.value)}
                    placeholder="예: @username, 인스타그램 아이디 등"
                    className={ss.text_input}
                  />
                </div>
              </div>

              <div className={ss.info_item}>
                <label>역할 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="예: 그래픽 디자이너, 웹 개발자, 콘텐츠 기획자"
                  className={ss.text_input}
                />
              </div>

              <div className={ss.note_input}>
                <label>관리자 메모 (선택사항)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="스태프 관련 메모나 특이사항을 입력해주세요..."
                  className={ss.textarea_input}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* 활동 정보 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>활동 정보</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>사용자 구분</label>
                <div className={ss.info_value}>
                  <span className={ss.category_badge}>
                    외부 스태프
                  </span>
                </div>
              </div>
              <div className={ss.info_item}>
                <label>등록일시</label>
                <div className={ss.info_value}>{formatDate(staff.createdAt)}</div>
              </div>
              {staff.loginHistory && (
                <div className={ss.info_item}>
                  <label>총 로그인 횟수</label>
                  <div className={ss.info_value}>{staff.loginHistory?.length || 0}회</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={ss.modal_footer}>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            {/* 왼쪽 액션 버튼들 */}
            <div style={{display: 'flex', gap: '8px', marginRight: 'auto'}}>
              <button 
                className={ss.button_danger} 
                onClick={handleDeleteStaff}
                disabled={loading}
              >
                {loading ? '처리 중...' : '스태프 삭제'}
              </button>
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
              onClick={handleStaffUpdate}
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

export default StaffModal 