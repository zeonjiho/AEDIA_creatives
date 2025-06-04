const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const calendarSchema = new Schema({
    linkId: {
        type: String,
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
    },
});

const Calendar = mongoose.model('Calendar', calendarSchema);
module.exports = Calendar;