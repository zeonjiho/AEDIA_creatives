import React, { useEffect, useState, useRef } from 'react'
import ss from '../CSS/AdminChart.module.css'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import { 
  generateUserStatusCSV, 
  generateUserTypeCSV, 
  generateFinanceCSV, 
  generateTrendCSV 
} from '../../../utils/exportUtils'

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

const AdminMain = () => {
  const [userList, setUserList] = useState([]);
  const chartRefs = useRef({});
  const [dashboardStats, setDashboardStats] = useState({
    users: { total: 0, active: 0, waiting: 0, internal: 0, external: 0 },
    finance: { 
      meal: { total: 108000, approved: 73000, pending: 15000, rejected: 20000 },
      taxi: { total: 265000, approved: 111000, pending: 99000, rejected: 55000 }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/get-user-list?userType=all');
      setUserList(response.data);
      
      // 사용자 통계 계산
      const userStats = {
        total: response.data.length,
        active: response.data.filter(user => user.status === 'active').length,
        waiting: response.data.filter(user => user.status === 'waiting').length,
        internal: response.data.filter(user => user.userType === 'internal').length,
        external: response.data.filter(user => user.userType === 'external').length
      };

      setDashboardStats(prev => ({
        ...prev,
        users: userStats
      }));
    } catch (err) {
      console.log(err);
    }
  }

  // 전체 통계 계산
  const getTotalStats = () => ({
    totalUsers: dashboardStats.users.total,
    pendingApprovals: dashboardStats.users.waiting,
    totalFinance: dashboardStats.finance.meal.total + dashboardStats.finance.taxi.total,
    pendingFinance: dashboardStats.finance.meal.pending + dashboardStats.finance.taxi.pending
  });

  // 사용자 현황 도넛 차트 데이터
  const userStatusChartData = {
    labels: ['활성 유저', '승인 대기', '비활성'],
    datasets: [
      {
        data: [
          dashboardStats.users.active,
          dashboardStats.users.waiting,
          dashboardStats.users.total - dashboardStats.users.active - dashboardStats.users.waiting
        ],
        backgroundColor: [
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(134, 142, 150, 0.8)'
        ],
        borderColor: [
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(134, 142, 150, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 사용자 유형별 바 차트 데이터
  const userTypeChartData = {
    labels: ['내부 직원', '외부 스태프'],
    datasets: [
      {
        label: '사용자 수',
        data: [dashboardStats.users.internal, dashboardStats.users.external],
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(64, 192, 87, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(64, 192, 87, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 재무 현황 바 차트 데이터
  const financeChartData = {
    labels: ['식비', '택시비'],
    datasets: [
      {
        label: '승인된 금액',
        data: [dashboardStats.finance.meal.approved, dashboardStats.finance.taxi.approved],
        backgroundColor: 'rgba(64, 192, 87, 0.8)',
        borderColor: 'rgba(64, 192, 87, 1)',
        borderWidth: 2
      },
      {
        label: '대기 중인 금액',
        data: [dashboardStats.finance.meal.pending, dashboardStats.finance.taxi.pending],
        backgroundColor: 'rgba(253, 126, 20, 0.8)',
        borderColor: 'rgba(253, 126, 20, 1)',
        borderWidth: 2
      },
      {
        label: '거절된 금액',
        data: [dashboardStats.finance.meal.rejected, dashboardStats.finance.taxi.rejected],
        backgroundColor: 'rgba(250, 82, 82, 0.8)',
        borderColor: 'rgba(250, 82, 82, 1)',
        borderWidth: 2
      }
    ]
  };

  // 월별 트렌드 라인 차트 데이터 (예시)
  const trendChartData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [
      {
        label: '신규 가입자',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgba(74, 144, 226, 1)',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.4
      },
      {
        label: '재무 지출',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'rgba(253, 126, 20, 1)',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        tension: 0.4
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
            return new Intl.NumberFormat('ko-KR').format(value);
          }
        }
      }
    }
  };

  const totalStats = getTotalStats();

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>관리자 대시보드</h1>
        <div className={ss.summary_stats}>
          <div className={ss.stat_item}>
            <span className={ss.stat_number}>{totalStats.totalUsers}</span>
            <div className={ss.stat_label}>전체 사용자</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{totalStats.pendingApprovals}</span>
            <div className={ss.stat_label}>승인 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{formatAmount(totalStats.totalFinance)}</span>
            <div className={ss.stat_label}>총 재무</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{dashboardStats.users.total}</div>
          <div className={ss.metric_label}>총 사용자</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            +{dashboardStats.users.waiting} 대기 중
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{formatAmount(dashboardStats.finance.meal.approved + dashboardStats.finance.taxi.approved)}</div>
          <div className={ss.metric_label}>승인된 재무</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            이번 달
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{formatAmount(dashboardStats.finance.meal.pending + dashboardStats.finance.taxi.pending)}</div>
          <div className={ss.metric_label}>대기 중인 재무</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            처리 필요
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            사용자 현황
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['user-status-chart'] = el}>
            <Doughnut data={userStatusChartData} options={chartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              사용자 유형별 분포
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['user-type-chart'] }}
              chartTitle="사용자 유형별 분포"
              csvData={generateUserTypeCSV(dashboardStats.users)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['user-type-chart'] = el}>
            <Bar data={userTypeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.finance}`}></div>
              재무 현황
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['finance-chart'] }}
              chartTitle="재무 현황"
              csvData={generateFinanceCSV(dashboardStats.finance)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['finance-chart'] = el}>
            <Bar data={financeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              월별 트렌드
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['trend-chart'] }}
              chartTitle="월별 트렌드"
              csvData={generateTrendCSV()}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['trend-chart'] = el}>
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMain