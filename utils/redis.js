import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Display any error that occurs with the Redis client
    this.client.on('error', (err) => console.error('Redis Client Error:', err));

    // Promisify the Redis client methods for easier use with async/await
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  /**
   * Check if Redis connection is active
   * @returns {boolean} true if connection is alive, false otherwise
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Get the value of a key from Redis
   * @param {string} key - The key to retrieve
   * @returns {string|null} The value associated with the key, or null if not found
   */
  async get(key) {
    return await this.getAsync(key);
  }

  /**
   * Set a key-value pair in Redis with expiration
   * @param {string} key - The key to set
   * @param {string|number} value - The value to set
   * @param {number} duration - Time in seconds for the key to expire
   * @returns {Promise} Promise that resolves when the key is set
   */
  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  /**
   * Delete a key from Redis
   * @param {string} key - The key to delete
   * @returns {Promise} Promise that resolves when the key is deleted
   */
  async del(key) {
    await this.delAsync(key);
  }
}

// Exporting an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
