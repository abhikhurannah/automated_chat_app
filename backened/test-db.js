import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection URI:', process.env.MONGODB_URI?.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials in log
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connection successful!');
        console.log('Host:', conn.connection.host);
        console.log('Database:', conn.connection.name);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('✅ Connection test completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error:', error.message);
        
        if (error.code === 8000) {
            console.log('\n🔧 Authentication failed. Please check:');
            console.log('1. Username and password in connection string');
            console.log('2. Database user exists in MongoDB Atlas');
            console.log('3. User has proper permissions (readWrite)');
        }
        
        if (error.code === 8001) {
            console.log('\n🔧 Network access denied. Please check:');
            console.log('1. Your IP is whitelisted in MongoDB Atlas');
            console.log('2. Network Access settings in Atlas');
        }
        
        process.exit(1);
    }
};

testConnection();