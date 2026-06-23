import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

// ESM module specific code to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: "*",
    method: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);

app.use(errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        statusCode: 404,
    });
});

// Serve static files from the React app
// app.use(express.static(path.join(__dirname, '../client/build')));


// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} on port http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // exit process
    process.exit(1);
})