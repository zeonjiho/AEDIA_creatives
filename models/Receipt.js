const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    // 기본 정보
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    // 금액 및 날짜
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    time: {
        type: String, // HH:MM 형식
        default: function() {
            return new Date().toTimeString().substr(0, 5);
        }
    },

    // 분류
    type: {
        type: String,
        required: true,
        enum: ['MEAL', 'TAXI', 'OTHER'],
        default: 'OTHER'
    },

    category: {
        type: String,
        required: true,
        enum: [
            // 식비 관련
            'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'COFFEE',
            // 교통비 관련  
            'TAXI', 'BUS', 'SUBWAY', 'TRAIN', 'FLIGHT',
            // 기타
            'OFFICE_SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'EDUCATION', 'ENTERTAINMENT', 'OTHER'
        ]
    },

    // 결제 정보
    paymentMethod: {
        type: String,
        required: true,
        enum: ['CORPORATE_CARD', 'PERSONAL_CARD', 'CASH', 'BANK_TRANSFER'],
        default: 'CORPORATE_CARD'
    },

    // 상태
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'],
        default: 'PENDING'
    },

    // 사용자 정보
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    userName: {
        type: String,
        required: true
    },

    // 프로젝트 연결 (선택사항)
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },

    projectName: {
        type: String
    },

    // 택시 전용 필드
    route: {
        type: String, // 출발지 → 도착지
        required: function() {
            return this.type === 'TAXI';
        }
    },

    // 첨부파일
    attachmentUrls: [{
        type: String
    }],

    // 승인 관련
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvedAt: {
        type: Date
    },

    rejectionReason: {
        type: String
    }
}, {
    timestamps: true
});

// 인덱스 설정
receiptSchema.index({ userId: 1, date: -1 });
receiptSchema.index({ type: 1, status: 1 });
receiptSchema.index({ projectId: 1 });

// 가상 필드: 카테고리 한글명
receiptSchema.virtual('categoryName').get(function() {
    const categoryMap = {
        'BREAKFAST': '아침',
        'LUNCH': '점심',
        'DINNER': '저녁',
        'SNACK': '간식',
        'COFFEE': '커피',
        'TAXI': '택시',
        'BUS': '버스',
        'SUBWAY': '지하철',
        'TRAIN': '기차',
        'FLIGHT': '항공',
        'OFFICE_SUPPLIES': '사무용품',
        'EQUIPMENT': '장비',
        'SOFTWARE': '소프트웨어',
        'EDUCATION': '교육',
        'ENTERTAINMENT': '접대',
        'OTHER': '기타'
    };
    return categoryMap[this.category] || this.category;
});

// 가상 필드: 상태 한글명
receiptSchema.virtual('statusName').get(function() {
    const statusMap = {
        'PENDING': '승인 대기',
        'APPROVED': '승인',
        'REJECTED': '거절',
        'PROCESSING': '처리 중'
    };
    return statusMap[this.status] || this.status;
});

// 가상 필드: 결제방법 한글명
receiptSchema.virtual('paymentMethodName').get(function() {
    const paymentMap = {
        'CORPORATE_CARD': '법인카드',
        'PERSONAL_CARD': '개인카드',
        'CASH': '현금',
        'BANK_TRANSFER': '계좌이체'
    };
    return paymentMap[this.paymentMethod] || this.paymentMethod;
});

// Static 메서드: 타입별 통계
receiptSchema.statics.getStatsByType = function(type, startDate, endDate) {
    const matchStage = { type };

    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
};

// Static 메서드: 월별 트렌드
receiptSchema.statics.getMonthlyTrend = function(type, year) {
    return this.aggregate([{
            $match: {
                type,
                date: {
                    $gte: new Date(`${year}-01-01`),
                    $lt: new Date(`${year + 1}-01-01`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$date' },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
};

module.exports = mongoose.model('Receipt', receiptSchema);