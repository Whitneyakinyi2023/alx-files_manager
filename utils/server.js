import express from 'express';
import routes from './routes/index';

// Initialize express app
const app = express();

// Load routes
app.use('/', routes);

// Set the port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
