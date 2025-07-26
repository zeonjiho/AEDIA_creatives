import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// PDF 내보내기 함수
export const exportToPDF = async(chartElement, chartTitle) => {
    try {
        if (!chartElement) {
            throw new Error('차트 요소를 찾을 수 없습니다.');
        }

        const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        // 제목 추가
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(chartTitle, 20, 20);

        // 차트 이미지 추가
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);

        // 생성 날짜 추가
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleDateString('ko-KR')}`, 20, 280);

        // 파일 다운로드
        const fileName = `${chartTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        return { success: true };
    } catch (error) {
        console.error('PDF 내보내기 실패:', error);
        return { success: false, error: error.message };
    }
};

// CSV 내보내기 함수
export const exportToCSV = (csvContent, fileName) => {
    try {
        if (!csvContent) {
            throw new Error('CSV 데이터가 없습니다.');
        }

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true };
    } catch (error) {
        console.error('CSV 내보내기 실패:', error);
        return { success: false, error: error.message };
    }
};

// 차트별 CSV 데이터 생성 함수들
export const generateUserStatusCSV = (stats) => {
    let csvContent = '상태,사용자 수\n';
    csvContent += `활성 유저,${stats.active}\n`;
    csvContent += `승인 대기,${stats.waiting}\n`;
    csvContent += `비활성,${stats.total - stats.active - stats.waiting}\n`;
    return csvContent;
};

export const generateUserTypeCSV = (stats) => {
    let csvContent = '사용자 유형,사용자 수\n';
    csvContent += `내부 직원,${stats.internal}\n`;
    csvContent += `외부 스태프,${stats.external}\n`;
    return csvContent;
};

export const generateFinanceCSV = (financeStats) => {
    let csvContent = '구분,식비,택시비\n';
    csvContent += `승인된 금액,${financeStats.meal.approved},${financeStats.taxi.approved}\n`;
    csvContent += `대기 중인 금액,${financeStats.meal.pending},${financeStats.taxi.pending}\n`;
    csvContent += `거절된 금액,${financeStats.meal.rejected},${financeStats.taxi.rejected}\n`;
    return csvContent;
};

export const generateTrendCSV = (userList = [], receipts = []) => {
    let csvContent = '월,신규 가입자,재무 지출\n';
    
    // 현재 월을 기준으로 최근 6개월 계산
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      // 해당 월의 신규 가입자 수 계산 (내부 직원만)
      const monthNewUsers = userList.filter(user => {
        if (user.userType !== 'internal') return false;
        const userDate = new Date(user.createdAt);
        return userDate.getFullYear() === year && userDate.getMonth() + 1 === month;
      }).length;
      
      // 해당 월의 재무 지출 계산 (거절된 항목 제외)
      const monthExpenses = receipts
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        })
        .filter(item => item.status !== 'REJECTED')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
      
      csvContent += `${month}월,${monthNewUsers},${monthExpenses}\n`;
    }
    
    return csvContent;
};

export const generateDepartmentCSV = (departmentData) => {
    let csvContent = '소속,스태프 수\n';
    Object.entries(departmentData).forEach(([dept, count]) => {
        csvContent += `${dept},${count}\n`;
    });
    return csvContent;
};

export const generateRoleCSV = (roleData) => {
    let csvContent = '역할,스태프 수\n';
    Object.entries(roleData).forEach(([role, count]) => {
        csvContent += `${role},${count}\n`;
    });
    return csvContent;
};

export const generateMonthlyStaffCSV = () => {
    let csvContent = '월,신규 스태프\n';
    const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
    const values = [2, 4, 1, 3, 2, 1];
    months.forEach((month, index) => {
        csvContent += `${month},${values[index]}\n`;
    });
    return csvContent;
};

// 테이블 데이터를 CSV로 변환하는 범용 함수
export const generateTableCSV = (tableData, headers, reportInfo = {}) => {
    let csvContent = '';

    // 헤더 정보 추가
    csvContent += '=== AEDIA 출석 관리 시스템 ===\n';
    csvContent += `리포트: ${reportInfo.title || '데이터 내보내기'}\n`;
    csvContent += `내보내기 날짜: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}\n`;

    // 데이터 기간 자동 계산 및 표시
    if (tableData && tableData.length > 0) {
        const dates = tableData.map(row => new Date(row.date)).filter(date => !isNaN(date));
        if (dates.length > 0) {
            const earliestDate = new Date(Math.min(...dates));
            const latestDate = new Date(Math.max(...dates));
            csvContent += `데이터 기간: ${earliestDate.toLocaleDateString('ko-KR')} ~ ${latestDate.toLocaleDateString('ko-KR')}\n`;
        }
    }

    // 필터 정보 추가 (있는 경우)
    if (reportInfo.filters && Object.keys(reportInfo.filters).length > 0) {
        csvContent += '\n=== 적용된 필터 ===\n';
        Object.entries(reportInfo.filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                csvContent += `${key}: ${value}\n`;
            }
        });
    }

    // 총 레코드 수 정보
    csvContent += `\n총 레코드 수: ${tableData.length}건\n`;

    // 상태별 통계 (출석 데이터인 경우)
    if (tableData.length > 0 && tableData[0].status) {
        const statusCounts = {};
        tableData.forEach(row => {
            const status = getStatusTextForCSV(row.status);
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        csvContent += '\n=== 상태별 통계 ===\n';
        Object.entries(statusCounts).forEach(([status, count]) => {
            const percentage = ((count / tableData.length) * 100).toFixed(1);
            csvContent += `${status}: ${count}건 (${percentage}%)\n`;
        });
    }

    csvContent += '\n'; // 빈 줄

    // 실제 데이터 테이블 헤더
    csvContent += headers.join(',') + '\n';

    // 데이터 행들
    tableData.forEach(row => {
        const csvRow = headers.map(header => {
            let value = '';
            switch (header) {
                case '이름':
                    value = row.name || row.userName || '';
                    break;
                case '소속':
                    value = row.department || '미정';
                    break;
                case '전화번호':
                    value = formatPhoneNumberForCSV(row.phone);
                    break;
                case '이메일':
                    value = row.email || '';
                    break;
                case '상태':
                    value = getStatusTextForCSV(row.status);
                    break;
                case '역할':
                    value = row.roles && row.roles.length > 0 ? row.roles.join('; ') : '미정';
                    break;
                case '가입일':
                    value = formatDateForCSV(row.createdAt);
                    break;
                case '사용자 유형':
                    value = getUserTypeTextForCSV(row.userType);
                    break;
                case '날짜':
                    value = formatDateForCSV(row.date);
                    break;
                case '구분':
                    value = getUserTypeTextForCSV(row.userType);
                    break;
                case '출근시간':
                    value = formatTimeForCSV(row.checkInTime);
                    break;
                case '퇴근시간':
                    value = formatTimeForCSV(row.checkOutTime);
                    break;
                case '근무시간':
                    value = formatWorkHoursForCSV(row.workHours);
                    break;
                case '비고':
                    value = row.note || '';
                    break;
                default:
                    value = row[header.toLowerCase()] || '';
            }

            // CSV에서 특수문자 처리
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        });

        csvContent += csvRow.join(',') + '\n';
    });

    return csvContent;
};

// CSV용 헬퍼 함수들
const formatPhoneNumberForCSV = (phone) => {
    if (!phone) return '';
    if (phone.length === 11) {
        return `${phone.slice(0, 3 )}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
};

const getStatusTextForCSV = (status) => {
    switch (status) {
        case 'waiting':
            return '승인 대기';
        case 'active':
            return '활동 중';
        case 'inactive':
            return '비활성';
        case 'present':
            return '출석';
        case 'late':
            return '지각';
        case 'absent':
            return '결석';
        case 'vacation':
            return '휴가';
        case 'remote':
            return '재택근무';
        default:
            return status || '';
    }
};

const getUserTypeTextForCSV = (userType) => {
    switch (userType) {
        case 'internal':
            return '내부 직원';
        case 'external':
            return '외부 스태프';
        default:
            return userType || '';
    }
};

const formatDateForCSV = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const formatTimeForCSV = (timeString) => {
    if (!timeString) return '';
    // HH:MM:SS 형식의 문자열인 경우 HH:MM만 반환
    if (typeof timeString === 'string' && timeString.includes(':')) {
        return timeString.substring(0, 5);
    }
    // Date 객체인 경우
    const time = new Date(timeString);
    return time.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatWorkHoursForCSV = (hours) => {
    if (!hours) return '';
    return hours.toFixed(2);
};