module.exports = {
    validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    },
    validatePassword(password) {
        // at least one digit, one special character in !@#$%^&* and min length 8
        var re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
        return re.test(password);
    },
    sendError(res, message) {
        let err = new Error(message);
        err.status = 400;
        res.send(message);
        return err;
    }
}