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

export const generateTrendCSV = () => {
    let csvContent = '월,신규 가입자,재무 지출\n';
    const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
    const newUsers = [12, 19, 3, 5, 2, 3];
    const expenses = [65, 59, 80, 81, 56, 55];
    months.forEach((month, index) => {
        csvContent += `${month},${newUsers[index]},${expenses[index]}\n`;
    });
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
export const generateTableCSV = (tableData, headers) => {
    let csvContent = headers.join(',') + '\n';

    tableData.forEach(row => {
        const csvRow = headers.map(header => {
            let value = '';
            switch (header) {
                case '이름':
                    value = row.name || '';
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