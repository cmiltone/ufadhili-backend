import mongoose from 'mongoose';
import { MONGO_DB_URI } from '../config/mongoose';

export async function dbConnect(): Promise<void> {
  await mongoose.connect(MONGO_DB_URI);
}
