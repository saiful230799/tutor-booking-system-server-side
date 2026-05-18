const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 8000;


app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function server() {
  try {
    const db = client.db("mediQueueDB");
    const tutorsCollection = db.collection("tutors");

    app.get("/tutors", async (req, res) => {
        const cursor = tutorsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get("/tutors/:tutorId", async (req, res) => {
        const tutorId = req.params.tutorId;
        const query = { _id: new ObjectId(tutorId) };
        const result = await tutorsCollection.findOne(query);
        res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
server().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MediQueue Server is running...')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port} PORT`)
})