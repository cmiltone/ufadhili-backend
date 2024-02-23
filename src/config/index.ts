import dotenv from 'dotenv';

const config = dotenv.config();

if (config.error) throw new Error('Could not find .env file');