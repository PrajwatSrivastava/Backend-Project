class ApiErrors extends Error{

    constructor(
        statusCode,
        message,
        errors = [],
        stack = ""
    ){
        super()
        this.statusCode = statusCode
        this.message = message,
        this.data = null,
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }

}

export {ApiErrors}