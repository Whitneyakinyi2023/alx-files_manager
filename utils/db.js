import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Class for performing operations with MongoDB service
 */
class DBClient {
  constructor() {
    this.db = null;
    this.init();
  }

  /**
   * Initializes the MongoDB connection and collections
   */
  async init() {
    try {
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      console.log('Connected successfully to MongoDB server');
      this.db = client.db(DB_DATABASE);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    } catch (err) {
      console.error(`Failed to connect to MongoDB: ${err.message}`);
      this.db = null;
    }
  }

  /**
   * Checks if connection to MongoDB is alive
   * @return {boolean} true if connection is alive, false otherwise
   */
  isAlive() {
    return Boolean(this.db);
  }

  /**
   * Returns the number of documents in the users collection
   * @return {Promise<number>} number of users
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return await this.usersCollection.countDocuments();
  }

  /**
   * Returns the number of documents in the files collection
   * @return {Promise<number>} number of files
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return await this.filesCollection.countDocuments();
  }
}

// Export an instance of the DBClient class
const dbClient = new DBClient();
export default dbClient;
