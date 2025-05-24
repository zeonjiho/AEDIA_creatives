const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const todoSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    dueDate: {
        type: String, // 'YYYY-MM-DD' 형식으로 저장
        required: true,
    },
    dueTime: {
        type: String, // 'HH:MM' 형식으로 저장 (옵션)
        default: null,
    },
    poster: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        default: null, // 프로젝트가 없는 할 일도 있을 수 있음
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

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;