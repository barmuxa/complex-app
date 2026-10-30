const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const client = new MongoClient(process.env.CONNECTIONSTRING); // the connection string from .env

async function start() {
  await client.connect();
  module.exports = client; // export the connected MongoClient instance
  const app = require('./app');
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
  });
}

start();
