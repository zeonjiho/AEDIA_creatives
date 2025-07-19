const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
    name: {
        type: String,
        default: 'AEDIA STUDIO',
    },
    logo: {
        type: String,
        default: 'AEDIALOGO.svg',
    },
    address: {
        type: String,
        default: '',
    },
    latitude: {
        type: Number,
        default: null,
    },
    longitude: {
        type: Number,
        default: null,
    },
    phone: {
        type: String,
        default: '',
    },
    email: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    adminUsers: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['super_admin', 'admin', 'pd'],
            default: 'admin'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    settings: {
        autoLogout: {
            type: Number,
            default: 24 // 시간 단위
        },
        slackIntegration: {
            type: Boolean,
            default: true
        },
        emailNotification: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// 업데이트 시 updatedAt 자동 갱신
companySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;