const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        default: ''
    },
    userName: {
        type: String,
        default: ''
    },
    fullName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 0 // 정상0 정지1 탈퇴2 퇴출3
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    birthday: {
        type: Date,
    },
    gender: {
        type: Number,
        default: 0 //남자0 여자1 기타2 말하기싫음3
    },
    occupation: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    accessCount: {
        type: Number,
        default: 0
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    admin: {
        type: Boolean,
        default: false
    },
    stats: {
        type: Object,
        default: {
            posts: 0,
            followers: 0,
            following: 0,
            likes: 0,
            uploads: 0,
            views: 0,
        }
    },
    avatar: {
        type: String,
        default: ''
    },
    profileSNS: {
        type: String,
        default: ''
    },
    //Collection 차후 추가
    theme: {
        type: Number,
        default: 0 //dark0, light1, system2 중 하나
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'en'
    },
    likeList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hyperlink'
    }],

    //일단은 더미
    level: {
        type: Number,
        default: 0
    },
    exp: {
        type: Number,
        default: 0
    },
})

const User = mongoose.model('User', userSchema);

module.exports = User;