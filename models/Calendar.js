const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const calendarSchema = new Schema({
    linkId: {
        type: String,
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
});

const Calendar = mongoose.model('Calendar', calendarSchema);
module.exports = Calendar;