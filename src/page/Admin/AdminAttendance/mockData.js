// 전지호 직원의 출석 목업 데이터
// 2022년 12월 1일부터 2025년 2월까지
// 대부분 재택근무, 약 5% 출석

// 근무시간 계산 함수 (가변 점심시간)
const calculateWorkHours = (checkIn, checkOut, date) => {
    if (!checkIn || !checkOut) return null;

    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);
    let diff = (end - start) / (1000 * 60 * 60); // 시간 단위

    // 다음날로 넘어간 경우 처리
    if (diff < 0) {
        diff += 24;
    }

    // 점심시간 계산 (0.5-1.5시간 사이, 짧은 근무는 점심 없음)
    let lunchHours = 0;
    if (diff > 6) { // 6시간 이상 근무시에만 점심시간 적용
        const seed = date.getDate() + date.getMonth() * 31;
        const lunchVariation = (seed % 6) * 0.2; // 0, 0.2, 0.4, 0.6, 0.8, 1.0
        lunchHours = 0.5 + lunchVariation; // 0.5~1.5시간

        // 크런치 모드에서는 점심을 못 먹는 경우도
        if (diff > 15) { // 15시간 이상 극한 근무
            lunchHours = (seed % 3) === 0 ? 0 : 0.5; // 33% 확률로 점심 스킵
        }
    }

    const actualWorkHours = Math.max(0, diff - lunchHours);

    // 소수점 1자리로 반올림하되, 좀 더 자연스럽게
    return Math.round(actualWorkHours * 10) / 10;
};

// 날짜 범위 생성 함수
const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

// 주말 여부 확인
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
};

// 전지호 사용자 정보
const jeonJihoUser = {
    _id: 'jeon_jiho_001',
    name: '전지호',
    userType: 'internal'
};

// 기타 직원들 정보
const otherUsers = [
    { _id: 'kim_emp_001', name: '김직원', userType: 'internal' },
    { _id: 'lee_emp_002', name: '이직원', userType: 'internal' },
    { _id: 'park_staff_003', name: '박스태프', userType: 'external' },
    { _id: 'choi_emp_004', name: '최직원', userType: 'internal' },
    { _id: 'jung_staff_005', name: '정스태프', userType: 'external' }
];

// 랜덤 분 생성 함수 (더 큰 범위의 랜덤성)
const getRandomMinutes = (date, offset = 0) => {
    const seed = date.getDate() + date.getMonth() * 31 + offset;
    return String(seed % 60).padStart(2, '0');
};

// 랜덤 시간 생성 함수 (시간대별 범위 내에서)
const getRandomHour = (baseHour, range, date, offset = 0) => {
    const seed = date.getDate() + date.getMonth() * 31 + offset;
    const randomOffset = (seed % (range * 2 + 1)) - range; // -range ~ +range
    const newHour = Math.max(0, Math.min(23, baseHour + randomOffset));
    return String(newHour).padStart(2, '0');
};

// 시간에 랜덤 분 추가 함수
const addRandomMinutes = (time, date, offset = 0) => {
    const [hour] = time.split(':');
    const minutes = getRandomMinutes(date, offset);
    return `${hour}:${minutes}:00`;
};

// 랜덤 시간 범위 생성 함수
const generateRandomTime = (baseHour, hourRange, date, offset = 0) => {
    const randomHour = getRandomHour(baseHour, hourRange, date, offset);
    const randomMinutes = getRandomMinutes(date, offset);
    return `${randomHour}:${randomMinutes}:00`;
};

// 전지호의 출석 데이터 생성
const generateJeonJihoAttendanceData = () => {
    const startDate = new Date('2022-12-01');
    const endDate = new Date('2025-02-28');
    const dateRange = generateDateRange(startDate, endDate);

    // 휴가 기간 설정 (2024년 8월 23일 ~ 9월 8일)
    const vacationStart = new Date('2024-08-23');
    const vacationEnd = new Date('2024-09-08');

    const attendanceData = [];

    // 출석할 날짜들을 미리 정하기 (약 2% - 일관된 결과를 위해)
    const totalWorkDays = dateRange.filter(date => !isWeekend(date)).length;
    const attendanceDays = Math.floor(totalWorkDays * 0.02);

    // 고정된 출석 날짜들 (해시 기반으로 일관성 있게 선택)
    const attendanceDateIndices = [];
    for (let i = 0; i < attendanceDays; i++) {
        // 간격을 두고 출석 날짜 선택 (일관된 결과를 위해)
        const index = Math.floor((totalWorkDays / attendanceDays) * i) + (i % 3);
        if (index < totalWorkDays) {
            attendanceDateIndices.push(index);
        }
    }

    let workDayIndex = 0;

    dateRange.forEach((date, index) => {
        const dateString = date.toISOString().split('T')[0];

        // 주말은 제외
        if (isWeekend(date)) {
            return;
        }

        let status = 'remote'; // 기본은 재택근무
        let checkInTime = generateRandomTime(9, 2, date, 0); // 7-11시 사이
        let checkOutTime = generateRandomTime(18, 3, date, 1); // 15-21시 사이
        let note = '재택근무';

        // 휴가 기간 체크 (우선순위 높음)
        if (date >= vacationStart && date <= vacationEnd) {
            status = 'vacation';
            checkInTime = null;
            checkOutTime = null;
            note = '하계휴가';
        }
        // 미리 정한 출석 날짜인지 확인 (휴가 기간이 아닐 때만)
        else if (attendanceDateIndices.includes(workDayIndex)) {
            status = 'present';

            // 첫 출근일 처리 (오리엔테이션/미팅)
            if (workDayIndex === 0) {
                checkInTime = generateRandomTime(9, 1, date, 0); // 8-10시 사이
                checkOutTime = generateRandomTime(15, 2, date, 1); // 13-17시 사이 (짧은 시간)
                note = '';
            } else {
                // VFX 프로젝트 사이클에 맞는 근무 패턴 (3개월 단위)
                const monthCycle = date.getMonth() % 3; // 0, 1, 2로 순환
                const dayOfMonth = date.getDate();

                let workPattern;

                if (monthCycle === 0) {
                    // 프리프로덕션/초기 단계 - 정상 근무 위주
                    workPattern = dayOfMonth % 4;
                    switch (workPattern) {
                        case 0:
                        case 1: // 50% 정상 근무
                            checkInTime = generateRandomTime(9, 1, date, 0); // 8-10시 사이
                            checkOutTime = generateRandomTime(18, 2, date, 1); // 16-20시 사이
                            note = '정상 근무';
                            break;
                        case 2: // 25% 약간 연장
                            checkInTime = generateRandomTime(9, 1, date, 0); // 8-10시 사이
                            checkOutTime = generateRandomTime(21, 2, date, 1); // 19-23시 사이
                            note = '연장 근무';
                            break;
                        case 3: // 25% 새벽 작업
                            checkInTime = generateRandomTime(4, 2, date, 0); // 2-6시 사이
                            checkOutTime = generateRandomTime(15, 3, date, 1); // 12-18시 사이
                            note = '새벽 집중 작업';
                            break;
                    }
                } else if (monthCycle === 1) {
                    // 프로덕션 중반 - 연장 근무 증가
                    workPattern = dayOfMonth % 5;
                    switch (workPattern) {
                        case 0: // 20% 정상 근무
                            checkInTime = generateRandomTime(9, 1, date, 0); // 8-10시 사이
                            checkOutTime = generateRandomTime(18, 1, date, 1); // 17-19시 사이
                            note = '정상 근무';
                            break;
                        case 1:
                        case 2: // 40% 연장 근무
                            checkInTime = generateRandomTime(9, 2, date, 0); // 7-11시 사이
                            checkOutTime = generateRandomTime(22, 3, date, 1); // 19시-새벽1시 사이
                            note = '연장 근무';
                            break;
                        case 3: // 20% 야간 작업
                            checkInTime = generateRandomTime(15, 3, date, 0); // 12-18시 사이
                            checkOutTime = generateRandomTime(3, 2, date, 1); // 1-5시 사이
                            note = '야간 작업 (VFX 진행)';
                            break;
                        case 4: // 20% 새벽 렌더링 작업
                            checkInTime = generateRandomTime(3, 2, date, 0); // 1-5시 사이
                            checkOutTime = generateRandomTime(16, 4, date, 1); // 12-20시 사이
                            note = '새벽 작업 (VFX 렌더링)';
                            break;
                    }
                } else {
                    // 마감/파이널 단계 - 크런치 모드
                    workPattern = dayOfMonth % 6;
                    switch (workPattern) {
                        case 0: // 17% 마감 연장 근무
                            checkInTime = generateRandomTime(9, 2, date, 0); // 7-11시 사이
                            checkOutTime = generateRandomTime(23, 2, date, 1); // 21시-새벽1시 사이
                            note = '마감 연장 근무';
                            break;
                        case 1: // 17% 야간 마감 작업
                            checkInTime = generateRandomTime(14, 3, date, 0); // 11-17시 사이
                            checkOutTime = generateRandomTime(4, 3, date, 1); // 1-7시 사이
                            note = '야간 작업 (VFX 마감)';
                            break;
                        case 2: // 17% 장시간 크런치
                            checkInTime = generateRandomTime(11, 3, date, 0); // 8-14시 사이
                            checkOutTime = generateRandomTime(5, 3, date, 1); // 2-8시 사이
                            note = '장시간 근무 (VFX 마감)';
                            break;
                        case 3: // 17% 올나이트
                            checkInTime = generateRandomTime(18, 2, date, 0); // 16-20시 사이
                            checkOutTime = generateRandomTime(8, 3, date, 1); // 5-11시 사이
                            note = '올나이트 (VFX 마감)';
                            break;
                        case 4: // 17% 극한 렌더링 크런치
                            checkInTime = generateRandomTime(2, 3, date, 0); // 23시-5시 사이
                            checkOutTime = generateRandomTime(22, 3, date, 1); // 19시-새벽1시 사이
                            note = '극한 마감 (VFX 파이널)';
                            break;
                        case 5: // 15% 새벽 장시간 렌더링
                            checkInTime = generateRandomTime(1, 2, date, 0); // 23시-3시 사이
                            checkOutTime = generateRandomTime(19, 4, date, 1); // 15-23시 사이
                            note = '새벽 장시간 작업';
                            break;
                    }
                }
            }
        }
        // 가끔 지각이나 연차도 추가 (휴가 기간이 아닐 때만)
        else {
            const randomValue = (date.getDate() + date.getMonth()) % 100;
            if (randomValue <= 3) {
                // 4% 재택근무 중 지각 (VFX 특성상 새벽 지각도 포함)
                status = 'remote';
                const latePattern = randomValue % 3;
                if (latePattern === 0) {
                    checkInTime = generateRandomTime(10, 2, date, 2); // 8-12시 사이 늦은 시작
                    checkOutTime = generateRandomTime(19, 3, date, 3); // 16-22시 사이
                    note = '재택근무 (늦은 시작)';
                } else if (latePattern === 1) {
                    checkInTime = generateRandomTime(4, 3, date, 2); // 1-7시 사이 새벽 지각
                    checkOutTime = generateRandomTime(14, 4, date, 3); // 10-18시 사이
                    note = '새벽 작업 (늦은 시작)';
                } else {
                    checkInTime = generateRandomTime(16, 3, date, 2); // 13-19시 사이 오후 지각
                    checkOutTime = generateRandomTime(3, 3, date, 3); // 0-6시 사이
                    note = '야간 작업 (늦은 시작)';
                }
            } else if (randomValue <= 5) {
                // 2% 결석
                status = 'absent';
                checkInTime = null;
                checkOutTime = null;
                note = '무단결석';
            } else if (randomValue === 6) {
                // 1% 연차 (VFX 바쁜 스케줄로 휴가 적음)
                status = 'vacation';
                checkInTime = null;
                checkOutTime = null;
                note = '연차';
            } else if (randomValue === 7) {
                // 1% 사무실 출근 지각 (매우 드물게)
                status = 'late';
                checkInTime = addRandomMinutes('10:15:00', date, 4);
                checkOutTime = addRandomMinutes('18:30:00', date, 5);
                note = '사무실 출근 지각';
            } else if (randomValue <= 15) {
                // 8% 재택근무 중 정상 작업 패턴
                status = 'remote';
                checkInTime = generateRandomTime(9, 2, date, 2); // 7-11시 사이
                checkOutTime = generateRandomTime(18, 3, date, 3); // 15-21시 사이
                note = '재택근무';
            } else if (randomValue <= 23) {
                // 8% 재택근무 중 연장 작업 패턴
                status = 'remote';
                checkInTime = generateRandomTime(9, 2, date, 2); // 7-11시 사이
                checkOutTime = generateRandomTime(21, 3, date, 3); // 18시-자정 사이
                note = '연장 근무';
            } else if (randomValue <= 31) {
                // 8% 재택근무 중 새벽 작업
                status = 'remote';
                checkInTime = generateRandomTime(3, 3, date, 2); // 0-6시 사이
                checkOutTime = generateRandomTime(16, 5, date, 3); // 11-21시 사이
                note = '새벽 작업 (VFX 렌더링)';
            } else if (randomValue <= 39) {
                // 8% 재택근무 중 야간 작업 (프로젝트에 따라)
                const monthCycle = date.getMonth() % 3;
                status = 'remote';
                if (monthCycle === 2) { // 마감 단계에서만 야간/올나이트
                    checkInTime = generateRandomTime(16, 4, date, 2); // 12-20시 사이
                    checkOutTime = generateRandomTime(4, 4, date, 3); // 0-8시 사이
                    note = '야간 작업 (VFX 마감)';
                } else { // 평상시는 정상 연장
                    checkInTime = generateRandomTime(9, 2, date, 2); // 7-11시 사이
                    checkOutTime = generateRandomTime(20, 2, date, 3); // 18-22시 사이
                    note = '재택 연장근무';
                }
            } else if (randomValue <= 47) {
                // 8% 재택근무 중 정상시간 
                status = 'remote';
                checkInTime = generateRandomTime(9, 2, date, 2); // 7-11시 사이
                checkOutTime = generateRandomTime(18, 2, date, 3); // 16-20시 사이
                note = '재택근무';
            }
        }

        const workHours = checkInTime && checkOutTime ? calculateWorkHours(checkInTime, checkOutTime, date) : null;

        attendanceData.push({
            _id: `jeon_jiho_${dateString}`,
            userId: jeonJihoUser._id,
            userName: jeonJihoUser.name,
            userType: jeonJihoUser.userType,
            date: dateString,
            status: status,
            checkInTime: checkInTime,
            checkOutTime: checkOutTime,
            workHours: workHours,
            note: note
        });

        workDayIndex++;
    });

    return attendanceData;
};

// 기타 직원들의 최근 30일 출석 데이터 생성
const generateOtherUsersAttendanceData = () => {
    const attendanceData = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // 주말은 제외
        if (isWeekend(date)) {
            continue;
        }

        const dateString = date.toISOString().split('T')[0];

        otherUsers.forEach((user, userIndex) => {
            // 일관된 결과를 위해 날짜와 사용자 인덱스를 기반으로 상태 결정
            const statusSeed = (date.getDate() + userIndex * 7) % 10;
            let status, checkInTime, checkOutTime, note;

            if (statusSeed < 6) {
                // 60% 정상 출석
                status = 'present';
                checkInTime = '09:00:00';
                checkOutTime = '18:00:00';
                note = '';
            } else if (statusSeed < 8) {
                // 20% 재택근무
                status = 'remote';
                checkInTime = '09:00:00';
                checkOutTime = '18:00:00';
                note = '재택근무';
            } else if (statusSeed === 8) {
                // 10% 지각
                status = 'late';
                checkInTime = '09:45:00';
                checkOutTime = '18:15:00';
                note = '';
            } else {
                // 10% 연차/휴가
                status = 'vacation';
                checkInTime = null;
                checkOutTime = null;
                note = '연차';
            }

            const workHours = checkInTime && checkOutTime ? calculateWorkHours(checkInTime, checkOutTime, date) : null;

            attendanceData.push({
                _id: `${user._id}_${dateString}`,
                userId: user._id,
                userName: user.name,
                userType: user.userType,
                date: dateString,
                status: status,
                checkInTime: checkInTime,
                checkOutTime: checkOutTime,
                workHours: workHours,
                note: note
            });
        });
    }

    return attendanceData;
};

// 전체 목업 데이터 생성
export const generateMockAttendanceData = () => {
    const jeonJihoData = generateJeonJihoAttendanceData();
    const otherUsersData = generateOtherUsersAttendanceData();

    // 날짜순으로 정렬 (최신순)
    const allData = [...jeonJihoData, ...otherUsersData].sort((a, b) => {
        if (a.date === b.date) {
            return new Date(`${a.date}T${a.checkInTime || '00:00'}`) - new Date(`${b.date}T${b.checkInTime || '00:00'}`);
        }
        return new Date(b.date) - new Date(a.date);
    });

    return allData;
};

// 사용자 목록 반환
export const getMockUserList = () => {
    return [jeonJihoUser, ...otherUsers];
};