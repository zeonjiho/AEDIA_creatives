const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    // 기본 정보
    title: {
        type: String,
        trim: true
    },

    // 등록하는 사람이 적는 메모
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
        enum: ['식비', '택시비', '숙박비', '기타']
    },

    // 결제 정보
    paymentMethod: {
        type: String,
        required: true,
        enum: ['CORPORATE_CARD', 'PERSONAL_CARD', 'CASH'],
        default: 'CORPORATE_CARD'
    },

    // 법인카드 정보 (법인카드 결제 시에만 사용)
    creditCardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditCard',
    },

    // StepperModal 확장 필드들
    // 분할결제 정보
    isSplitPayment: {
        type: Boolean,
        default: false
    },
    splitPayments: [{
        paymentMethod: {
            type: String,
            enum: ['CORPORATE_CARD', 'PERSONAL_CARD', 'CASH'],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        cardType: String, // 법인카드/개인카드
        creditCardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CreditCard'
        }
    }],
    myAmount: {
        type: Number,
        min: 0
    },

    // 다중인원 결제 정보
    isMultiPersonPayment: {
        type: Boolean,
        default: false
    },
    participants: [{
        person: {
            _id: mongoose.Schema.Types.ObjectId,
            name: String,
            userType: String,
            profileImage: String
        },
        project: String
    }],

    // 결제 세부 정보
    cardType: String, // 법인카드/개인카드
    bankName: String,
    bankNameOther: String,
    accountNumber: String,

    // 택시비 사유 (9시간 미만 근무 시)
    taxiReason: String,

    // 식비 사유 (출퇴근 기록 없을 시)
    mealReason: String,

    // StepperModal dateTime 객체
    stepperDateTime: {
        year: String,
        month: String,
        day: String,
        hour: String,
        minute: String
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
    },

    // 관리자 메모
    adminNote: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// 인덱스 설정
receiptSchema.index({ userId: 1, date: -1 });
receiptSchema.index({ type: 1, status: 1 });
receiptSchema.index({ projectId: 1 });
receiptSchema.index({ creditCardId: 1 });

// 가상 필드: 카테고리 한글명 (이미 한글로 저장되므로 그대로 반환)
receiptSchema.virtual('categoryName').get(function() {
    return this.category;
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
        'CASH': '현금/계좌이체'
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