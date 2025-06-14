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

const AdminFinanceTaxi = () => {
  const [taxiData, setTaxiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTaxiData();
  }, []);

  // 택시비 데이터 가져오기 (실제 API 호출)
  const fetchTaxiData = async () => {
    try {
      setLoading(true);
      // 실제 API 엔드포인트로 교체 예정
      const response = await api.get('/receipts?type=TAXI');
      setTaxiData(response.data);
    } catch (error) {
      console.error('택시비 데이터 로드 실패:', error);
      // 임시 데이터 (API 구현 전까지)
      const dummyData = [
        { 
          _id: '1', 
          title: '클라이언트 미팅 이동',
          description: '강남역에서 클라이언트 사무실까지',
          date: '2024-01-15T00:00:00Z', 
          time: '18:30',
          amount: 45000, 
          route: '강남역 → 테헤란로 클라이언트 사무실', 
          category: 'TAXI',
          status: 'APPROVED', 
          userName: '김직원',
          userId: 'user1',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'AEDIA Studio',
          attachmentUrls: ['receipt1.jpg'],
          createdAt: '2024-01-15T18:30:00Z',
          approvedAt: '2024-01-16T09:00:00Z'
        },
        { 
          _id: '2', 
          title: '야근 후 귀가',
          description: '야근 후 집까지 택시비',
          date: '2024-01-15T00:00:00Z', 
          time: '22:15',
          amount: 32000, 
          route: '회사 → 홍대입구역', 
          category: 'TAXI',
          status: 'PENDING', 
          userName: '박스태프',
          userId: 'user2',
          paymentMethod: 'PERSONAL_CARD',
          projectName: null,
          attachmentUrls: [],
          createdAt: '2024-01-15T22:15:00Z'
        },
        { 
          _id: '3', 
          title: '출장 공항 이동',
          description: '부산 출장을 위한 인천공항 이동',
          date: '2024-01-14T00:00:00Z', 
          time: '09:00',
          amount: 38000, 
          route: '인천공항 → 회사', 
          category: 'TAXI',
          status: 'APPROVED', 
          userName: '이매니저',
          userId: 'user3',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'Busan Project',
          attachmentUrls: ['receipt2.jpg'],
          createdAt: '2024-01-14T09:00:00Z',
          approvedAt: '2024-01-15T08:30:00Z'
        },
        { 
          _id: '4', 
          title: '개인 사유 이동',
          description: '개인 용무로 인한 택시 이용',
          date: '2024-01-14T00:00:00Z', 
          time: '19:45',
          amount: 55000, 
          route: '회사 → 수원역', 
          category: 'TAXI',
          status: 'REJECTED', 
          userName: '최직원',
          userId: 'user4',
          paymentMethod: 'PERSONAL_CARD',
          projectName: null,
          attachmentUrls: [],
          createdAt: '2024-01-14T19:45:00Z',
          rejectionReason: '개인 용무로 인한 택시비는 지원되지 않습니다'
        },
        { 
          _id: '5', 
          title: '회사 업무 이동',
          description: '거래처 방문을 위한 이동',
          date: '2024-01-13T00:00:00Z', 
          time: '08:30',
          amount: 28000, 
          route: '집 → 회사', 
          category: 'TAXI',
          status: 'APPROVED', 
          userName: '정스태프',
          userId: 'user5',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'Mobile App',
          attachmentUrls: ['receipt3.jpg'],
          createdAt: '2024-01-13T08:30:00Z',
          approvedAt: '2024-01-14T11:00:00Z'
        },
        { 
          _id: '6', 
          title: '긴급 회의 참석',
          description: '긴급 회의를 위한 판교 이동',
          date: '2024-01-13T00:00:00Z', 
          time: '14:20',
          amount: 67000, 
          route: '서울역 → 판교 테크노밸리', 
          category: 'TAXI',
          status: 'PROCESSING', 
          userName: '한매니저',
          userId: 'user6',
          paymentMethod: 'CORPORATE_CARD',
          projectName: 'AI Platform',
          attachmentUrls: ['receipt4.jpg'],
          createdAt: '2024-01-13T14:20:00Z'
        }
      ];
      setTaxiData(dummyData);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const getTaxiStats = () => {
    const stats = {
      total: taxiData.reduce((sum, item) => sum + item.amount, 0),
      approved: taxiData.filter(item => item.status === 'APPROVED').reduce((sum, item) => sum + item.amount, 0),
      pending: taxiData.filter(item => item.status === 'PENDING').reduce((sum, item) => sum + item.amount, 0),
      rejected: taxiData.filter(item => item.status === 'REJECTED').reduce((sum, item) => sum + item.amount, 0),
      processing: taxiData.filter(item => item.status === 'PROCESSING').reduce((sum, item) => sum + item.amount, 0),
      count: taxiData.length,
      pendingCount: taxiData.filter(item => item.status === 'PENDING').length,
      approvedCount: taxiData.filter(item => item.status === 'APPROVED').length,
      rejectedCount: taxiData.filter(item => item.status === 'REJECTED').length,
      processingCount: taxiData.filter(item => item.status === 'PROCESSING').length,
      avgAmount: Math.round(taxiData.reduce((sum, item) => sum + item.amount, 0) / taxiData.length) || 0
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

  // 시간 포맷팅
  const formatTime = (time) => {
    return time;
  }

  // 프로젝트명 표시
  const getProjectDisplay = (projectName) => {
    return projectName || '미배정';
  }

  const stats = getTaxiStats();

  // 상태별 금액 도넛 차트
  const statusAmountChartData = {
    labels: ['승인', '승인 대기', '거절', '처리 중'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected, stats.processing],
        backgroundColor: [
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(250, 82, 82, 0.8)',
          'rgba(74, 144, 226, 0.8)'
        ],
        borderColor: [
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(250, 82, 82, 1)',
          'rgba(74, 144, 226, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 시간대별 이용 현황
  const timeData = taxiData.reduce((acc, item) => {
    const hour = parseInt(item.time.split(':')[0]);
    let timeRange;
    if (hour >= 6 && hour < 12) timeRange = '오전';
    else if (hour >= 12 && hour < 18) timeRange = '오후';
    else if (hour >= 18 && hour < 22) timeRange = '저녁';
    else timeRange = '야간';
    
    acc[timeRange] = (acc[timeRange] || 0) + item.amount;
    return acc;
  }, {});

  const timeChartData = {
    labels: Object.keys(timeData),
    datasets: [
      {
        label: '이용 금액',
        data: Object.values(timeData),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(64, 192, 87, 0.8)',
          'rgba(134, 142, 150, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(64, 192, 87, 1)',
          'rgba(134, 142, 150, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 월별 택시비 트렌드 (예시)
  const monthlyTrendData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [
      {
        label: '택시비 지출',
        data: [580000, 720000, 450000, 690000, 820000, 650000],
        borderColor: 'rgba(74, 144, 226, 1)',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 개인별 이용 현황
  const userUsageData = taxiData.reduce((acc, item) => {
    acc[item.userName] = (acc[item.userName] || 0) + item.amount;
    return acc;
  }, {});

  const userChartData = {
    labels: Object.keys(userUsageData),
    datasets: [
      {
        label: '개인별 택시비',
        data: Object.values(userUsageData),
        backgroundColor: 'rgba(253, 126, 20, 0.8)',
        borderColor: 'rgba(253, 126, 20, 1)',
        borderWidth: 2
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

  // 택시 테이블 데이터를 CSV로 변환하는 함수
  const generateTaxiTableCSV = (data) => {
    let csvContent = '날짜,시간,제목,사용자,경로,금액,결제방법,프로젝트,상태,메모\n';
    
    data.forEach(item => {
      const csvRow = [
        formatDate(item.date),
        formatTime(item.time),
        item.title,
        item.userName,
        item.route,
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
    setTaxiData(prevData => 
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
          <p>택시비 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>택시비 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_finance}`}>
            <span className={ss.stat_number}>{formatAmount(stats.total)}</span>
            <div className={ss.stat_label}>총 택시비</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{stats.pendingCount + stats.processingCount}</span>
            <div className={ss.stat_label}>처리 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{formatAmount(stats.avgAmount)}</span>
            <div className={ss.stat_label}>평균 금액</div>
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
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{stats.count}</div>
          <div className={ss.metric_label}>총 이용 건수</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            월간 집계
          </div>
        </div>
      </div>

      {/* 필터 액션 */}
      <div className={ss.filter_actions}>
        <button className={`${ss.filter_button} ${ss.active}`}>전체</button>
        <button className={ss.filter_button}>승인</button>
        <button className={ss.filter_button}>대기</button>
        <button className={ss.filter_button}>거절</button>
        <button className={ss.filter_button}>고액(5만원↑)</button>
        <button className={ss.filter_button}>야간(22시↑)</button>
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
            {stats.processing > 0 && (
              <div className={ss.legend_item}>
                <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
                처리 중 ({formatAmount(stats.processing)})
              </div>
            )}
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            시간대별 이용 현황
          </div>
          <div className={ss.chart_content}>
            <Bar data={timeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            월별 택시비 트렌드
          </div>
          <div className={ss.chart_content}>
            <Line data={monthlyTrendData} options={chartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            개인별 이용 현황
          </div>
          <div className={ss.chart_content}>
            <Bar data={userChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            택시 이용 내역
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="택시_이용_내역"
            csvData={generateTaxiTableCSV(taxiData)}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>시간</th>
              <th>제목</th>
              <th>사용자</th>
              <th>경로</th>
              <th>금액</th>
              <th>결제방법</th>
              <th>프로젝트</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {taxiData && taxiData.length > 0 ? taxiData.map((item) => (
              <tr 
                key={item._id}
                onClick={() => handleRowClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <td>{formatDate(item.date)}</td>
                <td>{formatTime(item.time)}</td>
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {item.title}
                  {item.description && (
                    <div style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px'}}>
                      {item.description}
                    </div>
                  )}
                </td>
                <td style={{fontWeight: '500'}}>{item.userName}</td>
                <td style={{fontSize: '0.85rem'}}>{item.route}</td>
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
                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  택시 이용 내역이 없습니다.
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
        type="taxi"
        onUpdate={handleStatusUpdate}
      />
    </div>
  )
}

export default AdminFinanceTaxi