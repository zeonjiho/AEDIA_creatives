const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['예정', '진행중', '완료', '취소'],
        default: '예정',
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
        
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;