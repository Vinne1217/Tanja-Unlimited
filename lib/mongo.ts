import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let dbPromise: Promise<Db> | null = null;

/**
 * Get a shared MongoDB Db instance.
 *
 * Expects the following env vars:
 * - MONGODB_URI - connection string
 * - MONGODB_DB  - database name
 */
export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !dbName) {
    console.warn(
      '[mongo] MONGODB_URI or MONGODB_DB not configured – cannot resolve tenant Stripe Connect account'
    );
    return null;
  }

  if (!dbPromise) {
    client = new MongoClient(uri);
    dbPromise = client.connect().then((c) => c.db(dbName));
  }

  try {
    return await dbPromise;
  } catch (error) {
    console.error('[mongo] Failed to connect to MongoDB:', error);
    return null;
  }
}

