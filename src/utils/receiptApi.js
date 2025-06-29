import api from './api';

// ============================================
// Receipt API 서비스 함수들
// ============================================

/**
 * 영수증 목록 조회
 * @param {Object} params - 필터링 및 페이징 옵션
 * @returns {Promise} API 응답
 */
export const getReceipts = async(params = {}) => {
    try {
        const response = await api.get('/receipts', { params });
        return response.data;
    } catch (error) {
        console.error('영수증 목록 조회 실패:', error);
        throw error;
    }
};

/**
 * 영수증 상세 조회
 * @param {string} receiptId - 영수증 ID
 * @returns {Promise} API 응답
 */
export const getReceiptById = async(receiptId) => {
    try {
        const response = await api.get(`/receipts/${receiptId}`);
        return response.data;
    } catch (error) {
        console.error('영수증 상세 조회 실패:', error);
        throw error;
    }
};

/**
 * 새 영수증 생성
 * @param {Object} receiptData - 영수증 데이터
 * @returns {Promise} API 응답
 */
export const createReceipt = async(receiptData) => {
    try {
        const response = await api.post('/receipts', receiptData);
        return response.data;
    } catch (error) {
        console.error('영수증 생성 실패:', error);
        throw error;
    }
};

/**
 * 영수증 수정
 * @param {string} receiptId - 영수증 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise} API 응답
 */
export const updateReceipt = async(receiptId, updateData) => {
    try {
        const response = await api.put(`/receipts/${receiptId}`, updateData);
        return response.data;
    } catch (error) {
        console.error('영수증 수정 실패:', error);
        throw error;
    }
};

/**
 * 영수증 삭제
 * @param {string} receiptId - 영수증 ID
 * @returns {Promise} API 응답
 */
export const deleteReceipt = async(receiptId) => {
    try {
        const response = await api.delete(`/receipts/${receiptId}`);
        return response.data;
    } catch (error) {
        console.error('영수증 삭제 실패:', error);
        throw error;
    }
};

/**
 * 영수증 승인
 * @param {string} receiptId - 영수증 ID
 * @param {string} approvedBy - 승인자 ID
 * @returns {Promise} API 응답
 */
export const approveReceipt = async(receiptId, approvedBy) => {
    try {
        const response = await api.patch(`/receipts/${receiptId}/approve`, { approvedBy });
        return response.data;
    } catch (error) {
        console.error('영수증 승인 실패:', error);
        throw error;
    }
};

/**
 * 영수증 거절
 * @param {string} receiptId - 영수증 ID
 * @param {string} rejectionReason - 거절 사유
 * @returns {Promise} API 응답
 */
export const rejectReceipt = async(receiptId, rejectionReason) => {
    try {
        const response = await api.patch(`/receipts/${receiptId}/reject`, { rejectionReason });
        return response.data;
    } catch (error) {
        console.error('영수증 거절 실패:', error);
        throw error;
    }
};

/**
 * 영수증 통계 조회
 * @param {Object} params - 통계 조회 옵션
 * @returns {Promise} API 응답
 */
export const getReceiptStats = async(params = {}) => {
    try {
        const response = await api.get('/receipts/stats/summary', { params });
        return response.data;
    } catch (error) {
        console.error('영수증 통계 조회 실패:', error);
        throw error;
    }
};

/**
 * 영수증 월별 트렌드 조회
 * @param {Object} params - 트렌드 조회 옵션
 * @returns {Promise} API 응답
 */
export const getReceiptMonthlyTrend = async(params = {}) => {
    try {
        const response = await api.get('/receipts/stats/monthly', { params });
        return response.data;
    } catch (error) {
        console.error('영수증 월별 트렌드 조회 실패:', error);
        throw error;
    }
};

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * 타입별 영수증 조회
 * @param {string} type - 영수증 타입 (MEAL, TAXI, OTHER)
 * @returns {Promise} API 응답
 */
export const getReceiptsByType = async(type) => {
    return getReceipts({ type });
};

/**
 * 상태별 영수증 조회
 * @param {string} status - 영수증 상태 (PENDING, APPROVED, REJECTED, PROCESSING)
 * @returns {Promise} API 응답
 */
export const getReceiptsByStatus = async(status) => {
    return getReceipts({ status });
};

/**
 * 사용자별 영수증 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise} API 응답
 */
export const getReceiptsByUserId = async(userId) => {
    return getReceipts({ userId });
};

/**
 * 프로젝트별 영수증 조회
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise} API 응답
 */
export const getReceiptsByProjectId = async(projectId) => {
    return getReceipts({ projectId });
};

/**
 * 날짜 범위별 영수증 조회
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Promise} API 응답
 */
export const getReceiptsByDateRange = async(startDate, endDate) => {
    return getReceipts({ startDate, endDate });
};

// ============================================
// 상수 정의 (Receipt 모델과 동일)
// ============================================

export const RECEIPT_TYPES = {
    MEAL: 'MEAL',
    TAXI: 'TAXI',
    OTHER: 'OTHER'
};

export const RECEIPT_CATEGORIES = {
    // 식비 관련
    BREAKFAST: 'BREAKFAST',
    LUNCH: 'LUNCH',
    DINNER: 'DINNER',
    SNACK: 'SNACK',
    COFFEE: 'COFFEE',
    // 교통비 관련
    TAXI: 'TAXI',
    BUS: 'BUS',
    SUBWAY: 'SUBWAY',
    TRAIN: 'TRAIN',
    FLIGHT: 'FLIGHT',
    // 기타
    OFFICE_SUPPLIES: 'OFFICE_SUPPLIES',
    EQUIPMENT: 'EQUIPMENT',
    SOFTWARE: 'SOFTWARE',
    EDUCATION: 'EDUCATION',
    ENTERTAINMENT: 'ENTERTAINMENT',
    OTHER: 'OTHER'
};

export const RECEIPT_STATUSES = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PROCESSING: 'PROCESSING'
};

export const PAYMENT_METHODS = {
    CORPORATE_CARD: 'CORPORATE_CARD',
    PERSONAL_CARD: 'PERSONAL_CARD',
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER'
};

// 한글 매핑
export const CATEGORY_NAMES = {
    BREAKFAST: '아침',
    LUNCH: '점심',
    DINNER: '저녁',
    SNACK: '간식',
    COFFEE: '커피',
    TAXI: '택시',
    BUS: '버스',
    SUBWAY: '지하철',
    TRAIN: '기차',
    FLIGHT: '항공',
    OFFICE_SUPPLIES: '사무용품',
    EQUIPMENT: '장비',
    SOFTWARE: '소프트웨어',
    EDUCATION: '교육',
    ENTERTAINMENT: '접대',
    OTHER: '기타'
};

export const STATUS_NAMES = {
    PENDING: '승인 대기',
    APPROVED: '승인',
    REJECTED: '거절',
    PROCESSING: '처리 중'
};

export const PAYMENT_METHOD_NAMES = {
    CORPORATE_CARD: '법인카드',
    PERSONAL_CARD: '개인카드',
    CASH: '현금',
    BANK_TRANSFER: '계좌이체'
};

// ============================================
// mockDatabase 호환성을 위한 배열 형태 상수들
// ============================================

export const receiptCategories = [
    { id: 'BREAKFAST', name: '아침', nameEn: 'Breakfast' },
    { id: 'LUNCH', name: '점심', nameEn: 'Lunch' },
    { id: 'DINNER', name: '저녁', nameEn: 'Dinner' },
    { id: 'SNACK', name: '간식', nameEn: 'Snack' },
    { id: 'COFFEE', name: '커피', nameEn: 'Coffee' },
    { id: 'TAXI', name: '택시', nameEn: 'Taxi' },
    { id: 'BUS', name: '버스', nameEn: 'Bus' },
    { id: 'SUBWAY', name: '지하철', nameEn: 'Subway' },
    { id: 'TRAIN', name: '기차', nameEn: 'Train' },
    { id: 'FLIGHT', name: '항공', nameEn: 'Flight' },
    { id: 'OFFICE_SUPPLIES', name: '사무용품', nameEn: 'Office Supplies' },
    { id: 'EQUIPMENT', name: '장비', nameEn: 'Equipment' },
    { id: 'SOFTWARE', name: '소프트웨어', nameEn: 'Software' },
    { id: 'EDUCATION', name: '교육', nameEn: 'Education' },
    { id: 'ENTERTAINMENT', name: '접대', nameEn: 'Entertainment' },
    { id: 'OTHER', name: '기타', nameEn: 'Other' }
];

export const receiptStatuses = [
    { id: 'PENDING', name: '승인 대기', nameEn: 'Pending' },
    { id: 'APPROVED', name: '승인', nameEn: 'Approved' },
    { id: 'REJECTED', name: '거절', nameEn: 'Rejected' },
    { id: 'PROCESSING', name: '처리 중', nameEn: 'Processing' }
];

export const receiptTypes = [
    { id: 'MEAL', name: '식대', nameEn: 'Meal Expenses' },
    { id: 'TAXI', name: '택시', nameEn: 'Taxi Expenses' },
    { id: 'OTHER', name: '기타', nameEn: 'Other' }
];

export const paymentMethods = [
    { id: 'CORPORATE_CARD', name: '법인카드', nameEn: 'Corporate Card' },
    { id: 'PERSONAL_CARD', name: '개인카드', nameEn: 'Personal Card' },
    { id: 'CASH', name: '현금', nameEn: 'Cash' },
    { id: 'BANK_TRANSFER', name: '계좌이체', nameEn: 'Bank Transfer' }
];