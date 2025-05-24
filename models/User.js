const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    loginId: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        enum: ['internal', 'external'],
        default: 'internal',
    },
    phone: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    roles: {
        type: Array,
        default: [],
    },
    profileImage: {
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

    mainLayout: {
        type: Object,
        default: {}
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;