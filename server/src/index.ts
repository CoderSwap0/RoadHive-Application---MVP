import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import loadRoutes from './routes/loadRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow frontend to communicate with backend
// In production, replace '*' with your specific GitHub Pages URL, e.g., 'https://yourusername.github.io'
app.use(cors({
  origin: [
    'http://localhost:3000',      
    'http://localhost:5173',
    'https://coderswap0.github.io', // Added your GitHub Pages domain
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
