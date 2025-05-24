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
    email: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    address: {
        type: String,
    },
    roles: {
        type: Array,
        default: [],
    },
    avatar: {
        type: String,
        default: '',
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
        date: {
            type: String, // 'YYYY-MM-DD' 형식
            required: true
        },
        records: [{
            type: {
                type: String,
                enum: ['checkIn', 'checkOut'],
                required: true
            },
            time: {
                type: Date,
                required: true
            },
            method: {
                type: String,
                default: 'manual'
            }
        }],
        memo: String,      // 비고 사항
    }],

    mainLayout: {
        type: Object,
        default: {}
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;