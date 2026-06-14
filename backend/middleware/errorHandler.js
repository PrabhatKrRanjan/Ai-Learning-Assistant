const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found with id of ${err.value}`;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 400;
        message = `Duplicate field value entered for field: ${field}`;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(val => val.message)
            .join(', ');
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File size exceeds maximum limit of 10MB';
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    console.error('Error', {
        message: err.message,
        stack:
            process.env.NODE_ENV === 'development'
                ? err.stack
                : undefined,
    });

    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
        }),
    });
};

export default errorHandler;