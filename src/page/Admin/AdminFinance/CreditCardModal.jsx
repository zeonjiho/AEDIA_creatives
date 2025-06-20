import React, { useState, useEffect } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'

const CreditCardModal = ({ 
  isOpen, 
  onClose, 
  card, 
  isAddMode,
  onUpdate 
}) => {
  const [cardName, setCardName] = useState('')
  const [frontNumber, setFrontNumber] = useState('')
  const [backNumber, setBackNumber] = useState('')
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때마다 카드 정보로 상태 초기화
  useEffect(() => {
    if (isAddMode) {
      // 새 카드 등록 모드
      setCardName('')
      setFrontNumber('')
      setBackNumber('')
    } else if (card) {
      // 수정 모드
      setCardName(card.cardName || '')
      if (card.number && card.number.length === 8) {
        setFrontNumber(card.number.substring(0, 4))
        setBackNumber(card.number.substring(4, 8))
      } else {
        setFrontNumber('')
        setBackNumber('')
      }
    }
  }, [card, isAddMode, isOpen])

  if (!isOpen) return null

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

  // 카드번호 마스킹 처리
  const formatCardNumber = (number) => {
    if (!number || number.length !== 8) return '-';
    const front = number.substring(0, 4);
    const back = number.substring(4, 8);
    return `${front}-****-****-${back}`;
  }

  // 입력 검증
  const validateInput = () => {
    if (!cardName.trim()) {
      alert('카드명을 입력해주세요.');
      return false;
    }
    if (!frontNumber || frontNumber.length !== 4) {
      alert('앞 4자리 카드번호를 정확히 입력해주세요.');
      return false;
    }
    if (!backNumber || backNumber.length !== 4) {
      alert('뒤 4자리 카드번호를 정확히 입력해주세요.');
      return false;
    }
    if (!/^\d{4}$/.test(frontNumber)) {
      alert('앞 4자리는 숫자만 입력 가능합니다.');
      return false;
    }
    if (!/^\d{4}$/.test(backNumber)) {
      alert('뒤 4자리는 숫자만 입력 가능합니다.');
      return false;
    }
    return true;
  }

  // 카드 등록/수정 처리
  const handleSubmit = async () => {
    if (loading) return
    
    if (!validateInput()) return

    setLoading(true)
    try {
      const submitData = {
        cardName: cardName.trim(),
        number: frontNumber + backNumber
      }

      let response;
      if (isAddMode) {
        response = await api.post('/credit-cards', submitData)
        alert('새 법인카드가 등록되었습니다.')
      } else {
        response = await api.put(`/credit-cards/${card._id}`, submitData)
        alert('법인카드 정보가 수정되었습니다.')
      }
      
      // 성공 시 부모 컴포넌트 업데이트
      if (onUpdate && response.data.card) {
        onUpdate(response.data.card)
      }
      
      onClose()
    } catch (error) {
      console.error('법인카드 처리 실패:', error)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message)
      } else {
        alert(isAddMode ? '법인카드 등록에 실패했습니다.' : '법인카드 정보 수정에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 숫자만 입력 허용
  const handleNumberInput = (value, setter) => {
    const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 4);
    setter(numbersOnly);
  }

  return (
    <div className={ss.modal_overlay} onClick={onClose}>
      <div className={ss.modal_container} onClick={(e) => e.stopPropagation()}>
        <div className={ss.modal_header}>
          <div className={ss.modal_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            {isAddMode ? '새 법인카드 등록' : '법인카드 정보 수정'}
          </div>
          <button className={ss.modal_close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={ss.modal_content}>
          {/* 기본 정보 섹션 */}
          {!isAddMode && card && (
            <div className={ss.modal_section}>
              <h3 className={ss.section_title}>현재 카드 정보</h3>
              <div className={ss.info_grid}>
                <div className={ss.info_item}>
                  <label>카드 ID</label>
                  <div className={ss.info_value} style={{fontSize: '0.85rem', color: 'var(--text-tertiary)'}}>
                    {card._id}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>등록일</label>
                  <div className={ss.info_value}>{formatDate(card.createdAt)}</div>
                </div>
                <div className={ss.info_item}>
                  <label>현재 카드번호</label>
                  <div className={ss.info_value} style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                    {formatCardNumber(card.number)}
                  </div>
                </div>
                <div className={ss.info_item}>
                  <label>상태</label>
                  <div className={ss.info_value}>
                    <span className={`${ss.status_badge} ${ss.status_active}`}>
                      활성
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 카드 정보 입력 섹션 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>
              {isAddMode ? '법인카드 정보 입력' : '카드 정보 수정'}
            </h3>
            <div className={ss.status_controls}>
              <div className={ss.info_item}>
                <label>카드명 (별칭) *</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="예: 법인카드1, 마케팅용카드, 임원카드 등"
                  className={ss.text_input}
                  maxLength={50}
                />
                <small style={{color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>
                  카드를 구분할 수 있는 이름을 입력해주세요
                </small>
              </div>

              <div className={ss.info_grid} style={{gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px'}}>
                <div className={ss.info_item}>
                  <label>카드번호 앞 4자리 *</label>
                  <input
                    type="text"
                    value={frontNumber}
                    onChange={(e) => handleNumberInput(e.target.value, setFrontNumber)}
                    placeholder="0000"
                    className={ss.text_input}
                    maxLength={4}
                    style={{fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center'}}
                  />
                </div>
                <div className={ss.info_item}>
                  <label>카드번호 뒤 4자리 *</label>
                  <input
                    type="text"
                    value={backNumber}
                    onChange={(e) => handleNumberInput(e.target.value, setBackNumber)}
                    placeholder="0000"
                    className={ss.text_input}
                    maxLength={4}
                    style={{fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center'}}
                  />
                </div>
              </div>

              <div className={ss.info_item} style={{marginTop: '20px'}}>
                <label>카드번호 미리보기</label>
                <div className={ss.info_value} style={{
                  fontFamily: 'monospace', 
                  fontSize: '1.2rem', 
                  padding: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px dashed var(--border-color)'
                }}>
                  {frontNumber || '0000'}-****-****-{backNumber || '0000'}
                </div>
                <small style={{color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>
                  보안을 위해 가운데 8자리는 마스킹 처리됩니다
                </small>
              </div>
            </div>
          </div>

          {/* 주의사항 */}
          <div className={ss.modal_section}>
            <h3 className={ss.section_title}>⚠️ 보안 주의사항</h3>
            <div style={{
              backgroundColor: 'var(--warning-bg)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--warning-color)',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              <ul style={{margin: 0, paddingLeft: '20px'}}>
                <li>카드번호의 앞 4자리와 뒤 4자리만 입력받아 저장합니다</li>
                <li>가운데 8자리는 보안을 위해 시스템에 저장되지 않습니다</li>
                <li>카드 전체 번호는 시스템 관리자도 확인할 수 없습니다</li>
                <li>등록된 정보는 법인카드 관리 목적으로만 사용됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={ss.modal_footer}>
          <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%'}}>
            <button 
              className={ss.button_secondary} 
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button 
              className={ss.button_primary} 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '처리 중...' : (isAddMode ? '등록하기' : '수정하기')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreditCardModal 