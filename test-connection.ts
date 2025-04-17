import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/finance-app';

async function testConnection() {
  try {
    // Using minimal connection options
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 20
    });
    console.log('Connection successful!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();