const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const slackCodeSchema = new Schema({
    slackId: {
        type: String,
    },
    code: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const SlackCode = mongoose.model('SlackCode', slackCodeSchema);
module.exports = SlackCode;