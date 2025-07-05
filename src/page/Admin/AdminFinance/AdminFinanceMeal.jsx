import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import ExportButton from '../../../components/ExportButton/ExportButton'
import FinanceModal from './FinanceModal'
import api from '../../../utils/api'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const AdminFinanceMeal = () => {
  const [mealData, setMealData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMealData();
  }, []);

  // 식비 데이터 가져오기 (실제 API 호출)
  const fetchMealData = async () => {
    try {
      setLoading(true);
      // 최신 API 구조에 맞게 수정
      const response = await api.get('/receipts?type=MEAL');
      
      // API 응답 구조에 맞게 데이터 추출
      const receiptsData = response.data?.data || response.data || [];
      console.log('식비 데이터 로드 성공:', receiptsData);
      setMealData(receiptsData);
    } catch (error) {
      console.error('식비 데이터 로드 실패:', error);
      // API 실패시 빈 배열로 설정
      setMealData([]);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const getFinanceStats = () => {
    const stats = {
      total: mealData.reduce((sum, item) => sum + item.amount, 0),
      approved: mealData.filter(item => item.status === 'APPROVED').reduce((sum, item) => sum + item.amount, 0),
      pending: mealData.filter(item => item.status === 'PENDING').reduce((sum, item) => sum + item.amount, 0),
      rejected: mealData.filter(item => item.status === 'REJECTED').reduce((sum, item) => sum + item.amount, 0),
      count: mealData.length,
      pendingCount: mealData.filter(item => item.status === 'PENDING').length,
      approvedCount: mealData.filter(item => item.status === 'APPROVED').length,
      rejectedCount: mealData.filter(item => item.status === 'REJECTED').length
    };
    return stats;
  }

  // 상태에 따른 스타일 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED': return ss.status_active;
      case 'PENDING': return ss.status_warning;
      case 'REJECTED': return ss.status_danger;
      case 'PROCESSING': return ss.status_info;
      default: return ss.status_info;
    }
  }

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '승인';
      case 'PENDING': return '승인 대기';
      case 'REJECTED': return '거절';
      case 'PROCESSING': return '처리 중';
      default: return status;
    }
  }

  // 카테고리 텍스트 변환
  const getCategoryText = (category) => {
    return category; // 이미 한글로 저장되어 있음
  }

  // 결제 방법 텍스트 변환
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'CORPORATE_CARD': '법인카드',
      'PERSONAL_CARD': '개인카드',
      'CASH': '현금',
      'BANK_TRANSFER': '계좌이체'
    };
    return methodMap[method] || method;
  }

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  // 날짜 포맷팅 (서버에서 한국 시간으로 저장되므로 그대로 사용)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes.toString().padStart(2, '0')}분`;
  }

  // 프로젝트명 표시
  const getProjectDisplay = (item) => {
    return item.projectId?.title || item.projectName || item.project || '미배정';
  }

  const stats = getFinanceStats();

  // 상태별 금액 도넛 차트
  const statusAmountChartData = {
    labels: ['승인', '승인 대기', '거절'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected],
        backgroundColor: [
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(250, 82, 82, 0.8)'
        ],
        borderColor: [
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(250, 82, 82, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 카테고리별 금액 비교 바 차트
  const categoryData = mealData.reduce((acc, item) => {
    const categoryName = getCategoryText(item.category);
    acc[categoryName] = (acc[categoryName] || 0) + item.amount;
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: '총 금액',
        data: Object.values(categoryData),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(64, 192, 87, 0.8)',
          'rgba(250, 82, 82, 0.8)',
          'rgba(155, 89, 182, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(64, 192, 87, 1)',
          'rgba(250, 82, 82, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 월별 식비 트렌드 (예시)
  const monthlyTrendData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [
      {
        label: '식비 지출',
        data: [320000, 450000, 280000, 380000, 520000, 400000],
        borderColor: 'rgba(253, 126, 20, 1)',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('ko-KR').format(value) + '원';
          }
        }
      }
    }
  };

  // 식비 테이블 데이터를 CSV로 변환하는 함수
  const generateMealTableCSV = (data) => {
    let csvContent = '날짜,제목,사용자,카테고리,금액,내가_낸_금액,결제방법,프로젝트,분할결제,다중인원,참가자수,상태,메모\n';
    
    data.forEach(item => {
      const csvRow = [
        formatDate(item.date),
        item.title,
        item.userId?.name || item.userName,
        getCategoryText(item.category),
        item.amount,
        item.isSplitPayment ? (item.myAmount || 0) : item.amount,
        getPaymentMethodText(item.paymentMethod),
        getProjectDisplay(item),
        item.isSplitPayment ? 'Y' : 'N',
        item.isMultiPersonPayment ? 'Y' : 'N',
        item.isMultiPersonPayment ? (item.participants?.length || 0) : 1,
        getStatusText(item.status),
        item.description || ''
      ];
      
      csvContent += csvRow.map(value => {
        if (value.toString().includes(',') || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',') + '\n';
    });
    
    return csvContent;
  };

  // 모달 열기
  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // 상태 업데이트 처리
  const handleStatusUpdate = (updatedItem) => {
    setMealData(prevData => 
      prevData.map(item => 
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  if (loading) {
    return (
      <div className={ss.admin_chart_container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className={ss.spinner}></div>
          <p>식비 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>식비 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_finance}`}>
            <span className={ss.stat_number}>{formatAmount(stats.total)}</span>
            <div className={ss.stat_label}>총 식비</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{stats.pendingCount}</span>
            <div className={ss.stat_label}>승인 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{stats.count}</span>
            <div className={ss.stat_label}>총 건수</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{formatAmount(stats.approved)}</div>
          <div className={ss.metric_label}>승인된 금액</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {stats.approvedCount}건 승인
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{formatAmount(stats.pending)}</div>
          <div className={ss.metric_label}>대기 중인 금액</div>
          <div className={`${ss.metric_change} ${stats.pendingCount > 0 ? ss.negative : ss.neutral}`}>
            {stats.pendingCount}건 대기
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--danger-color)'}}>{formatAmount(stats.rejected)}</div>
          <div className={ss.metric_label}>거절된 금액</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {stats.rejectedCount}건 거절
          </div>
        </div>
      </div>

      {/* 필터 액션 */}
      <div className={ss.filter_actions}>
        <button className={`${ss.filter_button} ${ss.active}`}>전체</button>
        <button className={ss.filter_button}>승인</button>
        <button className={ss.filter_button}>대기</button>
        <button className={ss.filter_button}>거절</button>
        <button className={ss.filter_button}>점심</button>
        <button className={ss.filter_button}>저녁</button>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            승인 상태별 금액 분포
          </div>
          <div className={ss.chart_content}>
            <Doughnut data={statusAmountChartData} options={chartOptions} />
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              승인 ({formatAmount(stats.approved)})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--warning-color)'}}></div>
              대기 ({formatAmount(stats.pending)})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--danger-color)'}}></div>
              거절 ({formatAmount(stats.rejected)})
            </div>
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            카테고리별 금액 비교
          </div>
          <div className={ss.chart_content}>
            <Bar data={categoryChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            월별 식비 지출
          </div>
          <div className={ss.chart_content}>
            <Line data={monthlyTrendData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            식비 내역
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="식비_내역"
            csvData={generateMealTableCSV(mealData)}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>제목</th>
              <th>사용자</th>
              <th>카테고리</th>
              <th>금액</th>
              <th>결제방법</th>
              <th>프로젝트</th>
              <th>특이사항</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {mealData && mealData.length > 0 ? mealData.map((item) => (
              <tr 
                key={item._id} 
                onClick={() => handleRowClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <td>{formatDate(item.date)}</td>
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {item.title}
                  {item.description && (
                    <div style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px'}}>
                      {item.description}
                    </div>
                  )}
                </td>
                <td style={{fontWeight: '500'}}>{item.userId?.name || item.userName}</td>
                <td>{getCategoryText(item.category)}</td>
                <td style={{fontWeight: '600'}}>
                  {formatAmount(item.amount)}
                  {/* 분할결제인 경우 내가 낸 금액 표시 */}
                  {item.isSplitPayment && item.myAmount && (
                    <div style={{fontSize: '0.75rem', color: 'var(--warning-color)', marginTop: '2px'}}>
                      내가 낸 금액: {formatAmount(item.myAmount)}
                    </div>
                  )}
                </td>
                <td>
                  {getPaymentMethodText(item.paymentMethod)}
                  {/* 법인카드인 경우 카드 정보 표시 */}
                  {item.paymentMethod === 'CORPORATE_CARD' && item.creditCardId && (
                    <div style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px'}}>
                      법인카드
                    </div>
                  )}
                </td>
                <td>
                  {getProjectDisplay(item) !== '미배정' ? (
                    <span className={ss.status_badge} style={{backgroundColor: 'var(--accent-color)', color: 'white'}}>
                      {getProjectDisplay(item)}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>미배정</span>
                  )}
                </td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    {/* 분할결제 표시 */}
                    {item.isSplitPayment && (
                      <span className={ss.status_badge} style={{backgroundColor: 'var(--info-color)', color: 'white', fontSize: '0.7rem'}}>
                        분할결제
                      </span>
                    )}
                    {/* 다중인원 결제 표시 */}
                    {item.isMultiPersonPayment && item.participants && item.participants.length > 0 && (
                      <span className={ss.status_badge} style={{backgroundColor: 'var(--secondary-color)', color: 'white', fontSize: '0.7rem'}}>
                        다중인원 ({item.participants.length}명)
                      </span>
                    )}
                    {/* 특이사항이 없는 경우 */}
                    {!item.isSplitPayment && !item.isMultiPersonPayment && (
                      <span style={{color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>-</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`${ss.status_badge} ${getStatusClass(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  식비 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Finance Modal */}
      <FinanceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={selectedItem}
        type="meal"
        onUpdate={handleStatusUpdate}
      />
    </div>
  )
}

export default AdminFinanceMeal