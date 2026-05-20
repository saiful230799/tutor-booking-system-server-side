const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 8000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))
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

const { toNodeHandler } = require("better-auth/node");
const { initAuth } = require("./auth.js");

async function server() {
  try {
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const db = client.db("mediQueueDB");
    const tutorsCollection = db.collection("tutors");
    const bookingsCollection = db.collection("bookings");

    app.get("/tutors", async (req, res) => {
        try {
            const limit = parseInt(req.query.limit); 
            let cursor = tutorsCollection.find();
            if (limit) {
                cursor = cursor.limit(limit);
            }
            const result = await cursor.toArray();
            res.json(result); 
        } catch (error) {
            console.error("Error fetching tutors:", error);
            res.status(500).json({ error: "Failed to fetch tutors data" });
        }
    });

    app.get("/tutors/:tutorId", async (req, res) => {
        try {
            const tutorId = req.params.tutorId;
            let query = { _id: tutorId }; 

            if (ObjectId.isValid(tutorId)) {
                query = {
                    $or: [
                        { _id: tutorId },
                        { _id: new ObjectId(tutorId) }
                    ]
                };
            }

            const result = await tutorsCollection.findOne(query);
            
            if (!result) {
                return res.status(200).json({ error: true, message: "Tutor not found in database" });
            }
            
            res.json(result);
        } catch (error) {
            console.error("Error fetching single tutor:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    app.post("/bookings", async (req, res) => {
        try {
            const bookingData = req.body;
            const result = await bookingsCollection.insertOne(bookingData);
            res.status(201).json(result);
        } catch (error) {
            console.error("Error creating booking:", error);
            res.status(500).json({ error: "Failed to create booking" });
        }
    });

    app.get("/bookings", async (req, res) => {
        try {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { studentEmail: email };
            }
            const result = await bookingsCollection.find(query).toArray();
            res.json(result);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            res.status(500).json({ error: "Failed to fetch bookings data" });
        }
    });

    app.post("/tutors", async (req, res) => {
        try {
            const result = await tutorsCollection.insertOne(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error("Error inserting tutor:", error);
            res.status(500).json({ error: "Failed to insert tutor data" });
        }
    });

    const auth = initAuth(client);
    app.use("/api/auth", (req, res, next) => {
        toNodeHandler(auth)(req, res, next);
    });

  } catch (error) {
    console.error("Server startup error:", error);
  }
}

server().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MediQueue Server is running...')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port} PORT`)
})