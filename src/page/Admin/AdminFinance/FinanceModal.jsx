import React, { useState, useEffect } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import { jwtDecode } from 'jwt-decode'
import baseURL from '../../../utils/baseURL'

const FinanceModal = ({
  isOpen,
  onClose,
  item,
  type, // 'meal' 또는 'taxi'
  onUpdate
}) => {
  const [projectMap, setProjectMap] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [status, setStatus] = useState(item?.status || 'PENDING')
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNote, setAdminNote] = useState(item?.adminNote || '')
  const [loading, setLoading] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // 프로젝트 목록 가져오기
  const fetchProjects = async () => {
    if (!isMultiPersonPayment() || loadingProjects) return;
    
    try {
      setLoadingProjects(true);
      const response = await api.get('/projects');
      const projects = response.data || [];
      
      const map = {};
      projects.forEach(project => {
        map[project._id] = project.title;
      });
      
      setProjectMap(map);
    } catch (error) {
      console.error('프로젝트 목록 가져오기 실패:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // item이 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (item) {
      setStatus(item.status || 'PENDING')
      setRejectionReason(item.rejectionReason || '')
      setAdminNote(item.adminNote || '')
      
      // 다중인원 결제인 경우 프로젝트 목록 가져오기
      if (isMultiPersonPayment()) {
        fetchProjects();
      }
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

  // 카드 번호 마스킹
  const maskCardNumber = (number) => {
    if (!number) return '';
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 8) return number;
    
    const first4 = cleanNumber.slice(0, 4);
    const last4 = cleanNumber.slice(-4);
    return `${first4} **** **** ${last4}`;
  }

  // 법인카드 상세 정보 표시
  const getCorporateCardFullInfo = (item) => {
    if (item.paymentMethod !== 'CORPORATE_CARD' || !item.creditCardId) {
      return getPaymentMethodText(item.paymentMethod);
    }
    
    const cardName = item.creditCardId?.cardName || '';
    const label = item.creditCardId?.label || '';
    const number = item.creditCardId?.number || '';
    
    const maskedNumber = maskCardNumber(number);
    
    return `법인카드 - ${cardName} - ${label} ${maskedNumber}`;
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

  // 이미지 보기
  const handleImageView = (imageUrl) => {
    const fullUrl = `${baseURL}${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageViewerOpen(true)
  }

  // 원본 파일명 추출
  const getOriginalFileName = (imageUrl) => {
    const pathSegments = imageUrl.split('/')
    return pathSegments[pathSegments.length - 1]
  }

  // 이미지 다운로드
  const handleImageDownload = async (imageUrl) => {
    try {
      const fullUrl = `${baseURL}${imageUrl}`
      const response = await fetch(fullUrl)
      const blob = await response.blob()
      
      const originalFileName = getOriginalFileName(imageUrl)
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = originalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 메모리 정리
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('다운로드 실패:', error)
      alert('이미지 다운로드에 실패했습니다.')
    }
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

  // 다중인원 결제인지 확인
  const isMultiPersonPayment = () => {
    return item.participants && item.participants.length > 0;
  }

  // 프로젝트별로 인원들을 그룹화
  const getParticipantsByProject = () => {
    if (!isMultiPersonPayment()) return null;

    const projectGroups = {};
    
    console.log('다중인원 결제 데이터:', item.participants);
    console.log('메인 프로젝트 정보:', item.projectId);
    console.log('전체 영수증 데이터:', item);
    
    // 먼저 등록자 본인의 프로젝트 추가
    if (item.projectId && item.projectId.title) {
      projectGroups[item.projectId.title] = [];
      // 등록자 본인 추가
      if (item.userId) {
        projectGroups[item.projectId.title].push({
          _id: item.userId._id,
          name: item.userId.name,
          userType: 'internal' // 등록자는 내부 직원으로 가정
        });
      }
    }
    
    item.participants.forEach(participant => {
      if (participant.person) {
        // 프로젝트 정보 가져오기
        let projectName = '미배정';
        
        if (participant.project) {
          console.log('참가자 프로젝트 정보:', participant.project);
          
          // ObjectId 형태인지 확인 (24자리 영숫자)
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(participant.project);
          
          if (isObjectId) {
            // ObjectId인 경우 - 프로젝트 매핑에서 찾기
            if (projectMap[participant.project]) {
              projectName = projectMap[participant.project];
              console.log('프로젝트 매핑에서 찾음:', projectName);
            } else if (item.projectId && item.projectId._id === participant.project) {
              projectName = item.projectId.title;
              console.log('메인 프로젝트와 일치:', item.projectId.title);
            } else {
              // 프로젝트 매핑에 없는 경우 - 임시로 "프로젝트 ID" 형태로 표시
              projectName = `프로젝트 (${participant.project.substring(0, 8)}...)`;
              console.log('프로젝트 매핑에 없음:', participant.project);
            }
          } else {
            // 직접 프로젝트명이 저장된 경우
            projectName = participant.project;
            console.log('프로젝트명 직접 사용:', participant.project);
          }
        }
        
        if (!projectGroups[projectName]) {
          projectGroups[projectName] = [];
        }
        projectGroups[projectName].push(participant.person);
      }
    });

    console.log('그룹화된 프로젝트:', projectGroups);
    return projectGroups;
  }

  return (
    <>
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
                <label>등록자</label>
                <div className={ss.info_value}>{item.userId?.name || '알 수 없음'}</div>
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
                <div className={ss.info_value}>{getCorporateCardFullInfo(item)}</div>
              </div>
              <div className={ss.info_item}>
                <label>프로젝트</label>
                <div className={ss.info_value}>
                  {isMultiPersonPayment() ? (
                    <div className={ss.multi_project_container}>
                      {Object.entries(getParticipantsByProject()).map(([projectName, participants], index) => (
                        <div key={index} className={ss.project_group}>
                          <div className={ss.project_header}>
                            <span className={ss.project_badge}>
                              {projectName}
                            </span>
                            <span className={ss.participant_count}>
                              {participants.length}명
                            </span>
                          </div>
                          <div className={ss.participants_list}>
                            {participants.map((person, personIndex) => (
                              <span key={personIndex} className={ss.participant_name}>
                                {person.name}
                                {personIndex < participants.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 단일 프로젝트인 경우
                    item.projectId?.title || item.projectName || item.project ? (
                      <span className={ss.project_badge}>
                        {item.projectId?.title || item.projectName || item.project}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>미배정</span>
                    )
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
                      첨부파일_{index + 1}
                    </span>
                    <div className={ss.attachment_buttons}>
                      <button 
                        className={ss.attachment_view}
                        onClick={() => handleImageView(url)}
                      >
                        보기
                      </button>
                      <button 
                        className={ss.attachment_download}
                        onClick={() => handleImageDownload(url)}
                      >
                        다운로드
                      </button>
                    </div>
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

      {/* 이미지 뷰어 모달 */}
      {imageViewerOpen && (
        <div className={ss.image_viewer_overlay} onClick={() => setImageViewerOpen(false)}>
          <div className={ss.image_viewer_container} onClick={(e) => e.stopPropagation()}>
            <div className={ss.image_viewer_header}>
              <h3>영수증 이미지</h3>
              <button 
                className={ss.image_viewer_close}
                onClick={() => setImageViewerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={ss.image_viewer_content}>
              <img 
                src={currentImageUrl} 
                alt="영수증 이미지"
                className={ss.receipt_image}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">이미지를 불러올 수 없습니다.</div>'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FinanceModal 