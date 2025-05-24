const mongoose = require('mongoose')
const Schema = mongoose.Schema;

// 예약 정보를 담는 서브스키마
const reservationSchema = new Schema({
    // 참석자 목록 (여러 명 가능)
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
    }],
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['예약됨', '취소됨', '완료됨'],
        default: '예약됨'
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 회의실 스키마
const roomSchema = new Schema({
    roomName: {
        type: String,
        required: true,
    },
    reservations: [reservationSchema]  // 예약 정보 배열
});

// 시간 충돌 체크 메서드 추가
// roomSchema.methods.checkAvailability = function(startTime, endTime) {
//     return !this.reservations.some(reservation => {
//         if (reservation.status === '취소됨') return false;

//         const reservationStart = new Date(reservation.startTime);
//         const reservationEnd = new Date(reservation.endTime);
//         const checkStart = new Date(startTime);
//         const checkEnd = new Date(endTime);

//         // 시간 충돌 확인
//         return (checkStart < reservationEnd && checkEnd > reservationStart);
//     });
// };

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;