import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import loadRoutes from './routes/loadRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. CORS Configuration
// Using 'origin: true' allows any origin to connect while still allowing credentials if necessary.
// 'optionsSuccessStatus: 200' is important for some legacy browsers/proxies.
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Explicitly handle OPTIONS for all routes
app.options('*', cors());

app.use(express.json() as any);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Root Route - To confirm server is running when visited in browser
app.get('/', (_req, res) => {
  res.send('RoadHive Backend Server is Running!');
});

// 404 Handler for debugging
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
