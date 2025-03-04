const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const hyperlinkSchema = new Schema({
    poster: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    dataType: {
        type: String,
        enum: ['hyperlink', 'collection'],
        default: 'hyperlink'
    },
    collectionBody: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hyperlink'
    }],
    contentType: {
        type: String,
        default: 'link'
    },
    content: {
        type: String,
        default: ''
    },
    codeLanguage: {
        type: String,
        default: undefined
    },
    tags: {
        type: Array,
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    thumbnailRatio: {
        type: Number,
        default: undefined
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedAt: {
        type: Date,
        default: undefined
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    },
    visibility: {
        type: String,
        enum: ['public', 'private'], // 특정 사용자나 그룹만 접근 가능한 restricted 등 추후 추가 가능
        default: 'public'
    },
    comments: {
        type: Array,
        default: []
    },
    views: {
        type: Array,
        default: []
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
})

const Hyperlink = mongoose.model('Hyperlink', hyperlinkSchema);

module.exports = Hyperlink;