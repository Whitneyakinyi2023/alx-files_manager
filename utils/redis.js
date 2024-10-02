import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();

    // Handle redis client errors
    this.client.on('error', (err) => console.error('Redis Client Error:', err));

    // Promisify Redis client methods to use them asynchronously
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Check if Redis connection is alive
  isAlive() {
    return this.client.connected;
  }

  // Get value by key (asynchronous)
  async get(key) {
    return await this.getAsync(key);
  }

  // Set a key with expiration
  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  // Delete a key
  async del(key) {
    await this.delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
