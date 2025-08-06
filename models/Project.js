const mongoose = require('mongoose')
const Schema = mongoose.Schema;

// 스탭 역할 서브스키마 - 유연한 구조
const staffRoleSchema = new Schema({
    roleName: {
        type: String,
        required: true,
        trim: true
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
    }]
});

// 프로젝트 메인 스키마
const projectSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [
            'concept',
            'development',
            'pre_production',
            'production',
            'post_production',
            'vfx',
            'sound_design',
            'quality_check',
            'delivery',
            'deleted'
        ],
        default: 'concept'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    thumbnail: {
        type: String,
        default: 'default_thumbnail.jpeg'
    },
    deadline: {
        type: Date,
        required: true
    },
    isHide: {
        type: Boolean,
        default: false
    },

    // 담당 PD (User 컬렉션 참조)
    assignedPd: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    // User 컬렉션 참조하는 팀 멤버
    team: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    // 유연한 스탭리스트 구조
    staffList: [staffRoleSchema]
}, {
    timestamps: true // createdAt, updatedAt 자동 생성
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;