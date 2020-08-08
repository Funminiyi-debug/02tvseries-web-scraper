const moment = require('moment')

exports.formatMessage = ( username, message) => {

    return ({
        username, 
        message,
        time: moment().format('h:mm')
    })
}