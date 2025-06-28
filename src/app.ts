import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';


// Import routes
import { chaptersRouter } from './routes/chapters.route';
import { authRouter } from './routes/auth.route';
import { progressRouter } from './routes/progress.route';
import { questionsRouter } from './routes/questions.route';
import { titlesRouter } from './routes/titles.route';

// Load environment variables
const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: isProd ? '*' : (process.env.FRONTEND_URL || 'http://localhost:8081'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SpoilerShield API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/progress', progressRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/titles', titlesRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format'
    });
  }

  // Default error response
  return res.status(err.status || 500).json({
  success: false,
  error: err.message || 'Internal server error',
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});
});

export default app;