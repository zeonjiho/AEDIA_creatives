import React, { useState, useEffect } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import { jwtDecode } from 'jwt-decode'

const FinanceModal = ({
  isOpen,
  onClose,
  item,
  type, // 'meal' 또는 'taxi'
  onUpdate
}) => {
  const [status, setStatus] = useState(item?.status || 'PENDING')
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNote, setAdminNote] = useState(item?.adminNote || '')
  const [loading, setLoading] = useState(false)

  // item이 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (item) {
      setStatus(item.status || 'PENDING')
      setRejectionReason(item.rejectionReason || '')
      setAdminNote(item.adminNote || '')
    }
  }, [item])

  if (!isOpen || !item) return null

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'APPROVED': '승인',
      'PENDING': '승인 대기',
      'REJECTED': '거절',
      'PROCESSING': '처리 중'
    }
    return statusMap[status] || status
  }

  // 카테고리 텍스트 변환
  const getCategoryText = (category) => {
    if (type === 'meal') {
      const categoryMap = {
        'BREAKFAST': '아침',
        'LUNCH': '점심',
        'DINNER': '저녁',
        'SNACK': '간식',
        'COFFEE': '커피'
      }
      return categoryMap[category] || category
    }
    return '택시'
  }

  // 결제 방법 텍스트 변환
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'CORPORATE_CARD': '법인카드',
      'PERSONAL_CARD': '개인카드',
      'CASH': '현금/계좌이체',
      'BANK_TRANSFER': '계좌이체'
    }
    return methodMap[method] || method
  }

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    })
  }

  // 시간 포맷팅
  const formatTime = (time) => {
    if (!time) return '-'
    return time
  }

    // 상태 업데이트 처리
  const handleStatusUpdate = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      // 모든 상태 변경을 PUT API로 통일
      const updateData = {
        status,
        adminNote,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
      };

      // 승인으로 변경하는 경우에만 approvedBy 추가
      if (status === 'APPROVED') {
        const token = localStorage.getItem('token');
        const currentUserId = token ? jwtDecode(token).userId : null;
        updateData.approvedBy = currentUserId;
      }

      const response = await api.put(`/receipts/${item._id}`, updateData);
      
      // 성공 시 부모 컴포넌트 업데이트
      if (onUpdate && response.data?.data) {
        onUpdate(response.data.data);
      }
      
      alert('상태가 성공적으로 업데이트되었습니다.')
      onClose()
    } catch (error) {
      console.error('상태 업데이트 실패:', error)
      const errorMessage = error.response?.data?.message || '상태 업데이트에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 상태에 따른 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED': return ss.status_active
      case 'PENDING': return ss.status_warning
      case 'REJECTED': return ss.status_danger
      case 'PROCESSING': return ss.status_info
      default: return ss.status_info
    }
  }

  return (
    <div className={ss.modal_overlay} onClick={onClose}>
      <div className={ss.modal_container} onClick={(e) => e.stopPropagation()}>
        <div className={ss.modal_header}>
          <div className={ss.modal_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            {type === 'meal' ? '식비' : '택시비'} 상세 정보
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
              {/* <div className={ss.info_item}>
                <label>제목</label>
                <div className={ss.info_value}>{item.title}</div>
              </div> */}
              <div className={ss.info_item}>
                <label>사용자</label>
                <div className={ss.info_value}>{item.userId?.name || item.userName}</div>
              </div>
              <div className={ss.info_item}>
                <label>메모</label>
                <div className={ss.info_value}>{item.description || '-'}</div>
              </div>
              <div className={ss.info_item}>
                <label>날짜</label>
                <div className={ss.info_value}>{formatDate(item.date)}</div>
              </div>
              {item.time && (
                <div className={ss.info_item}>
                  <label>시간</label>
                  <div className={ss.info_value}>{formatTime(item.time)}</div>
                </div>
              )}
              <div className={ss.info_item}>
                <label>카테고리</label>
                <div className={ss.info_value}>
                  <span className={ss.category_badge}>
                    {getCategoryText(item.category)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 금액 및 결제 정보 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>금액 및 결제</h3>
            <div className={ss.info_grid}>
              <div className={ss.info_item}>
                <label>금액</label>
                <div className={`${ss.info_value} ${ss.amount_highlight}`}>
                  {formatAmount(item.amount)}
                </div>
              </div>
              <div className={ss.info_item}>
                <label>결제 방법</label>
                <div className={ss.info_value}>{getPaymentMethodText(item.paymentMethod)}</div>
              </div>
              <div className={ss.info_item}>
                <label>프로젝트</label>
                <div className={ss.info_value}>
                  {item.projectId?.title || item.projectName ? (
                    <span className={ss.project_badge}>
                      {item.projectId?.title || item.projectName}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>미배정</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 현재 상태 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>현재 상태</h3>
            <div className={ss.current_status}>
              <span className={`${ss.status_badge} ${getStatusClass(item.status)}`}>
                {getStatusText(item.status)}
              </span>
              {item.rejectionReason && (
                <div className={ss.rejection_reason}>
                  <strong>거절 사유:</strong> {item.rejectionReason}
                </div>
              )}
              {item.adminNote && (
                <div className={ss.admin_note}>
                  <strong>관리자 메모:</strong> {item.adminNote}
                </div>
              )}
            </div>
          </div>

          {/* 상태 변경 섹션 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>상태 변경</h3>
            <div className={ss.status_controls}>
              <div className={ss.status_options}>
                <label className={ss.radio_option}>
                  <input
                    type="radio"
                    name="status"
                    value="APPROVED"
                    checked={status === 'APPROVED'}
                    onChange={(e) => setStatus(e.target.value)}
                  />
                  <span className={ss.radio_text}>승인</span>
                </label>
                <label className={ss.radio_option}>
                  <input
                    type="radio"
                    name="status"
                    value="PENDING"
                    checked={status === 'PENDING'}
                    onChange={(e) => setStatus(e.target.value)}
                  />
                  <span className={ss.radio_text}>승인 대기</span>
                </label>
                <label className={ss.radio_option}>
                  <input
                    type="radio"
                    name="status"
                    value="PROCESSING"
                    checked={status === 'PROCESSING'}
                    onChange={(e) => setStatus(e.target.value)}
                  />
                  <span className={ss.radio_text}>처리 중</span>
                </label>
                <label className={ss.radio_option}>
                  <input
                    type="radio"
                    name="status"
                    value="REJECTED"
                    checked={status === 'REJECTED'}
                    onChange={(e) => setStatus(e.target.value)}
                  />
                  <span className={ss.radio_text}>거절</span>
                </label>
              </div>

              {status === 'REJECTED' && (
                <div className={ss.rejection_input}>
                  <label>거절 사유</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="거절 사유를 입력해주세요..."
                    className={ss.textarea_input}
                    rows="3"
                  />
                </div>
              )}

              <div className={ss.note_input}>
                <label>관리자 메모 (선택사항)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="추가 메모가 있으면 입력해주세요..."
                  className={ss.textarea_input}
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* 첨부파일 */}
          {item.attachmentUrls && item.attachmentUrls.length > 0 && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>첨부파일</h3>
              <div className={ss.attachments}>
                {item.attachmentUrls.map((url, index) => (
                  <div key={index} className={ss.attachment_item}>
                    <span className={ss.attachment_name}>
                      영수증_{index + 1}.jpg
                    </span>
                    <button className={ss.attachment_view}>보기</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={ss.modal_footer}>
          <button
            className={ss.button_secondary}
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className={ss.button_primary}
            onClick={handleStatusUpdate}
            disabled={loading || (status === 'REJECTED' && !rejectionReason.trim())}
          >
            {loading ? '처리 중...' : '상태 업데이트'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FinanceModal 