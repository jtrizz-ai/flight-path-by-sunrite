import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import modulesRoutes from './routes/modules.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // In production, restrict to your app's domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', modulesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Flight Path API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      modules: '/api/modules',
      moduleDetail: '/api/modules/:id',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 Flight Path API Server
  📡 Running on: http://localhost:${PORT}
  📝 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

export default app;
