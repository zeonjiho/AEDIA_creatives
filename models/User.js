const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    loginId: {
        type: String,
    },
    password: {
        type: String,
    },
    name: {
        type: String,
    },
    userType: {
        type: String,
        enum: ['internal', 'external'],
        default: 'internal',
    },
    phone: {
        type: String,
    },
    emergencyContact: {
        type: String,
    },
    email: {
        type: String,
    },
    slackId: {
        type: String,
    },
    snsId: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    address: {
        type: String,
    },
    joinYear: {
        type: String,
    },
    hireYear: {
        type: Number,
    },
    adminMemo: {
        type: String,
    },
    roles: {
        type: Array,
        default: [],
    },
    department: {
        type: String,
    },
    experience: {
        type: String,
    },
    avatar: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    // 외부 스태프 SNS
    sns: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted', 'waiting'],
        default: 'waiting',
    },
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project',
    }],
    attendance: [{
        type: {
            type: String,
            enum: ['checkIn', 'checkOut'],
            required: true
        },
        time: {
            type: Date,
            required: true
        },
        date: {
            type: String, // 'YYYY-MM-DD' 형식
            required: true
        },
        method: {
            type: String,
            default: 'manual'
        },
        memo: String      // 비고 사항
    }],

    mainLayout: {
        type: Object,
        default: {}
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;