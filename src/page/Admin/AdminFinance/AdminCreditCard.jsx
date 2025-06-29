import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import CreditCardModal from './CreditCardModal'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminCreditCard = () => {
  const [cardList, setCardList] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  useEffect(() => {
    fetchCardList();
  }, [])

  const fetchCardList = async () => {
    try {
      const response = await api.get('/credit-cards');
      
      // API 응답 데이터 검증
      const cardData = response.data || [];
      if (!Array.isArray(cardData)) {
        console.error('API 응답이 배열이 아닙니다:', cardData);
        setCardList([]);
        return;
      }
      
      // null/undefined 값 제거 및 최신순 정렬
      const validCards = cardData
        .filter(card => card !== null && card !== undefined)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setCardList(validCards);
    } catch (err) {
      console.error('법인카드 목록 조회 실패:', err);
      setCardList([]); // 에러 시 빈 배열로 설정
    }
  }

  // 새 카드 등록 모달 열기
  const handleAddCard = () => {
    setSelectedCard(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  // 카드 수정 모달 열기
  const handleRowClick = (card) => {
    setSelectedCard(card);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
    setIsAddMode(false);
  };

  // 카드 정보 업데이트 처리
  const handleCardUpdate = (updatedCard) => {
    if (updatedCard === null) {
      // 삭제된 카드인 경우 목록에서 제거
      fetchCardList();
      return;
    }
    
    if (updatedCard.status === 'deleted') {
      // status가 deleted로 변경된 경우 목록에서 제거
      setCardList(prevList => 
        prevList.filter(card => card._id !== updatedCard._id)
      );
    } else if (isAddMode) {
      // 새 카드 추가인 경우
      setCardList(prevList => [updatedCard, ...prevList]);
    } else {
      // 일반 업데이트인 경우
      setCardList(prevList => 
        prevList.map(card => 
          card && card._id === updatedCard._id ? updatedCard : card
        ).filter(card => card !== null)
      );
    }
    
    // 안전을 위해 전체 목록도 새로고침
    setTimeout(() => {
      fetchCardList();
    }, 500);
  };

  // 카드 삭제 처리
  const handleDeleteCard = async (cardId, event) => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    const isConfirmed = window.confirm('정말로 이 법인카드를 삭제하시겠습니까?');
    if (!isConfirmed) return;

    try {
      await api.delete(`/credit-cards/${cardId}`);
      alert('법인카드가 삭제되었습니다.');
      fetchCardList(); // 리스트 새로고침
    } catch (err) {
      console.error('법인카드 삭제 실패:', err);
      alert('법인카드 삭제에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // 카드번호 마스킹 처리 (라벨 포함, XXXX-****-****-XXXX 형태로 표시)
  const formatCardNumber = (number, label) => {
    if (!number || number.length !== 8) return '-';
    const front = number.substring(0, 4);
    const back = number.substring(4, 8);
    const labelPrefix = label ? `${label} ` : '';
    return `${labelPrefix}${front}-****-****-${back}`;
  }

  // 통계 계산
  const getCardStats = () => {
    const validCards = cardList.filter(card => card !== null && card !== undefined);
    return {
      total: validCards.length,
      active: validCards.filter(card => card.status === 'active').length
    };
  }

  const cardStats = getCardStats();
  
  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>법인카드 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{cardStats.total}</span>
            <div className={ss.stat_label}>총 법인카드</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{cardStats.active}</span>
            <div className={ss.stat_label}>활성 카드</div>
          </div>
          <div className={ss.stat_item}>
            <button 
              onClick={handleAddCard}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#1e40af';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'var(--primary-color)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              + 새 카드 등록
            </button>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{cardStats.active}</div>
          <div className={ss.metric_label}>활성 법인카드</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            사용 가능
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--primary-color)'}}>{cardStats.total}</div>
          <div className={ss.metric_label}>총 등록 카드</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            관리 중
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>💳</div>
          <div className={ss.metric_label}>법인카드 시스템</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            정상 운영
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      {/* <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            법인카드 현황
          </div>
          <div className={ss.chart_content}>
            <div className={ss.chart_placeholder}>
              법인카드 사용 현황 및 통계를 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              활성 카드 ({cardStats.active})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--primary-color)'}}></div>
              총 등록 카드 ({cardStats.total})
            </div>
          </div>
        </div>
      </div> */}

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            법인카드 목록
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="법인카드_목록"
            csvData={generateTableCSV(
              cardList.filter(card => card !== null && card !== undefined), 
              ['카드명', '라벨', '카드번호', '상태', '등록일']
            )}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>카드명</th>
              <th>라벨</th>
              <th>카드번호</th>
              <th>상태</th>
              <th>등록일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cardList && cardList.length > 0 ? cardList
              .filter(card => card !== null && card !== undefined)
              .map((card, idx) => (
              <tr 
                key={card._id || `card-${idx}`}
                onClick={() => handleRowClick(card)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {card.cardName || '-'}
                </td>
                <td style={{textAlign: 'center', fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary-color)'}}>
                  {card.label || '-'}
                </td>
                <td style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                  {formatCardNumber(card.number, card.label)}
                </td>
                <td>
                  <span className={`${ss.status_badge} ${ss.status_active}`}>
                    활성
                  </span>
                </td>
                <td>{formatDate(card.createdAt)}</td>
                <td style={{textAlign: 'center', padding: '12px', verticalAlign: 'middle', width: '120px'}}>
                  <button 
                    style={{
                      backgroundColor: 'var(--danger-color)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => handleDeleteCard(card._id, e)}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#dc2626';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'var(--danger-color)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  등록된 법인카드가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CreditCard Modal */}
      <CreditCardModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        card={selectedCard}
        isAddMode={isAddMode}
        onUpdate={handleCardUpdate}
      />
    </div>
  )
}

export default AdminCreditCard