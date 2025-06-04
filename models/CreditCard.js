const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const creditCardSchema = new Schema({
    cardName: {
        type: String,
    },
    number: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active',
    },
});

const CreditCard = mongoose.model('CreditCard', creditCardSchema);
module.exports = CreditCard;