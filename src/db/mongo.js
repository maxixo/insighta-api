import { MongoClient } from 'mongodb';

import { env } from '../config/env.js';
import { DatabaseError } from '../utils/appError.js';

class MongoConnectionManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.uri = null;
    this.dbName = null;
    this.ready = false;
  }

  async connect(options = {}) {
    const uri = options.uri ?? env.MONGO_URI;
    const dbName = options.dbName ?? env.DB_NAME;

    if (this.client && this.db && this.uri === uri && this.dbName === dbName) {
      return this.db;
    }

    if (this.client) {
      await this.close();
    }

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: env.MONGO_MAX_POOL_SIZE,
        minPoolSize: env.MONGO_MIN_POOL_SIZE,
        serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT_MS
      });
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.uri = uri;
      this.dbName = dbName;
      this.ready = true;
      return this.db;
    } catch (error) {
      this.ready = false;
      throw new DatabaseError('Database error', error);
    }
  }

  getDb() {
    if (!this.db) {
      throw new DatabaseError('Database error');
    }

    return this.db;
  }

  getCollection(name) {
    return this.getDb().collection(name);
  }

  async ping() {
    if (!this.db) {
      return false;
    }

    try {
      await this.db.command({ ping: 1 });
      this.ready = true;
      return true;
    } catch {
      this.ready = false;
      return false;
    }
  }

  isReady() {
    return this.ready;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }

    this.client = null;
    this.db = null;
    this.uri = null;
    this.dbName = null;
    this.ready = false;
  }
}

export const mongoManager = new MongoConnectionManager();
