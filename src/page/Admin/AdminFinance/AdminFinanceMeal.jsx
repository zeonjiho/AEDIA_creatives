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
      // 실제 API 엔드포인트로 교체 예정
      const response = await api.get('/receipts?type=MEAL');
      setMealData(response.data);
    } catch (error) {
      console.error('식비 데이터 로드 실패:', error);
      // 임시 데이터 (API 구현 전까지)
      const dummyData = [
        { 
          _id: '1', 
          title: '팀 회식 - 한식당',
          description: '프로젝트 완료 기념 회식',
          date: '2024-01-15T00:00:00Z', 
          amount: 45000, 
          category: 'DINNER', 
          status: 'APPROVED', 
          userName: '김직원',
          userId: 'user1',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'AEDIA Studio',
          attachmentUrls: ['receipt1.jpg'],
          createdAt: '2024-01-15T12:00:00Z',
          approvedAt: '2024-01-16T09:00:00Z'
        },
        { 
          _id: '2', 
          title: '클라이언트 미팅 점심',
          description: '신규 프로젝트 논의 중 식사',
          date: '2024-01-15T00:00:00Z', 
          amount: 28000, 
          category: 'LUNCH', 
          status: 'PENDING', 
          userName: '박스태프',
          userId: 'user2',
          paymentMethod: 'CORPORATE_CARD',
          projectName: null,
          attachmentUrls: [],
          createdAt: '2024-01-15T13:30:00Z'
        },
        { 
          _id: '3', 
          title: '야근 저녁식사',
          description: '마감 작업으로 인한 저녁식사',
          date: '2024-01-14T00:00:00Z', 
          amount: 15000, 
          category: 'DINNER', 
          status: 'APPROVED', 
          userName: '이매니저',
          userId: 'user3',
          paymentMethod: 'PERSONAL_CARD',
          projectName: 'Mobile App',
          attachmentUrls: ['receipt2.jpg'],
          createdAt: '2024-01-14T19:00:00Z',
          approvedAt: '2024-01-15T08:30:00Z'
        },
        { 
          _id: '4', 
          title: '팀 미팅 커피',
          description: '주간 회의 중 커피 구매',
          date: '2024-01-14T00:00:00Z', 
          amount: 12000, 
          category: 'COFFEE', 
          status: 'REJECTED', 
          userName: '최직원',
          userId: 'user4',
          paymentMethod: 'CASH',
          projectName: null,
          attachmentUrls: [],
          createdAt: '2024-01-14T10:15:00Z',
          rejectionReason: '개인 커피는 지원되지 않습니다'
        },
        { 
          _id: '5', 
          title: '출장 중 식사',
          description: '부산 출장 중 점심식사',
          date: '2024-01-13T00:00:00Z', 
          amount: 35000, 
          category: 'LUNCH', 
          status: 'APPROVED', 
          userName: '정스태프',
          userId: 'user5',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'Busan Project',
          attachmentUrls: ['receipt3.jpg'],
          createdAt: '2024-01-13T12:20:00Z',
          approvedAt: '2024-01-14T11:00:00Z'
        }
      ];
      setMealData(dummyData);
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
    const categoryMap = {
      'BREAKFAST': '아침',
      'LUNCH': '점심',
      'DINNER': '저녁',
      'SNACK': '간식',
      'COFFEE': '커피'
    };
    return categoryMap[category] || category;
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

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  // 프로젝트명 표시
  const getProjectDisplay = (projectName) => {
    return projectName || '미배정';
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
    let csvContent = '날짜,제목,사용자,카테고리,금액,결제방법,프로젝트,상태,메모\n';
    
    data.forEach(item => {
      const csvRow = [
        formatDate(item.date),
        item.title,
        item.userName,
        getCategoryText(item.category),
        item.amount,
        getPaymentMethodText(item.paymentMethod),
        getProjectDisplay(item.projectName),
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
                <td style={{fontWeight: '500'}}>{item.userName}</td>
                <td>{getCategoryText(item.category)}</td>
                <td style={{fontWeight: '600'}}>{formatAmount(item.amount)}</td>
                <td>{getPaymentMethodText(item.paymentMethod)}</td>
                <td>
                  {item.projectName ? (
                    <span className={ss.status_badge} style={{backgroundColor: 'var(--accent-color)', color: 'white'}}>
                      {item.projectName}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>미배정</span>
                  )}
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