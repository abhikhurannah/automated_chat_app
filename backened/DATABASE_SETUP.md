# Alternative MongoDB Setup Options

## Option 1: MongoDB Atlas (Cloud) - RECOMMENDED

### Fix Your Current Setup:
1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Database Access**: Create/verify user with correct credentials
3. **Network Access**: Whitelist your IP or use 0.0.0.0/0 for development
4. **Get Fresh Connection String**: From Connect → Connect your application

### Update .env with new credentials:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.p22dp.mongodb.net/chatty?retryWrites=true&w=majority
```

## Option 2: Local MongoDB

### Install MongoDB locally:
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

### Update .env for local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/chatty
```

## Option 3: MongoDB Docker Container

### Run MongoDB in Docker:
```bash
# Pull and run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

### Update .env for Docker MongoDB:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/chatty?authSource=admin
```

## Option 4: Free MongoDB Atlas Alternative

### Use MongoDB Atlas Free Tier:
1. Create new account at https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 Sandbox)
3. Set up database user and network access
4. Get connection string

## Testing Your Connection

Run the test script:
```bash
npm run test-db
```

If successful, start the server:
```bash
npm run dev
```