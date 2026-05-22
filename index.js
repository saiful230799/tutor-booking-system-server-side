const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8000;


app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

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
        console.log("Connected to MongoDB successfully!");

        const db = client.db("mediQueueDB");
        const tutorsCollection = db.collection("tutors");
        const bookingsCollection = db.collection("bookings");

        // --- ROUTES ---

        app.get("/tutors", async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { userEmail: email } : {};
                const result = await tutorsCollection.find(query).toArray();
                res.json(result);
            } catch (error) {
                console.error("Error fetching tutors:", error);
                res.status(500).json({ error: "Failed to fetch tutors" });
            }
        });

        app.get("/tutors/:tutorId", async (req, res) => {
            try {
                const tutorId = req.params.tutorId;
                console.log("Fetching tutor with ID:", tutorId);
                
                let result = await tutorsCollection.findOne({ _id: tutorId });
                
                if (!result && ObjectId.isValid(tutorId)) {
                    try {
                        result = await tutorsCollection.findOne({ _id: new ObjectId(tutorId) });
                    } catch (err) {
                        console.log("ObjectId conversion failed:", err.message);
                    }
                }

                if (!result) {
                    console.log("Tutor not found for ID:", tutorId);
                    return res.status(404).json({ error: "Tutor not found" });
                }

                console.log("Tutor found:", result.tutorName);
                res.json(result);
            } catch (error) {
                console.error("Error fetching tutor:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        app.post("/tutors", async (req, res) => {
            try {
                const { _id, ...tutorData } = req.body;
                
                const result = await tutorsCollection.insertOne(tutorData);
                console.log("New tutor added with ID:", result.insertedId);
                res.status(201).json(result);
            } catch (error) {
                console.error("Error inserting tutor:", error);
                res.status(500).json({ error: "Failed to insert tutor" });
            }
        });

        app.delete("/tutors/:id", async (req, res) => {
            try {
                const id = req.params.id;
                console.log("Deleting tutor with ID:", id);
                
                let query = { _id: id };
                let result = await tutorsCollection.deleteOne(query);
                
                if (result.deletedCount === 0 && ObjectId.isValid(id)) {
                    query = { _id: new ObjectId(id) };
                    result = await tutorsCollection.deleteOne(query);
                }
                
                if (result.deletedCount === 0) {
                    console.log("No tutor found to delete with ID:", id);
                    return res.status(404).json({ error: "Tutor not found" });
                }
                
                console.log("Tutor deleted successfully");
                res.send(result);
            } catch (error) {
                console.error("Error deleting tutor:", error);
                res.status(500).json({ error: "Failed to delete tutor" });
            }
        });

        app.put("/tutors/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;
                console.log("Updating tutor with ID:", id);
                
                const updateDoc = {
                    $set: {
                        tutorName: updatedData.tutorName,
                        subject: updatedData.subject,
                        hourlyFee: updatedData.hourlyFee,
                        availableDays: updatedData.availableDays,
                        timeSlot: updatedData.timeSlot,
                        photo: updatedData.photo,
                        totalSlot: updatedData.totalSlot,
                        institution: updatedData.institution,
                        location: updatedData.location,
                        teachingMode: updatedData.teachingMode,
                        experience: updatedData.experience
                    },
                };
                
                let filter = { _id: id };
                let result = await tutorsCollection.updateOne(filter, updateDoc);
                
                if (result.matchedCount === 0 && ObjectId.isValid(id)) {
                    filter = { _id: new ObjectId(id) };
                    result = await tutorsCollection.updateOne(filter, updateDoc);
                }
                if (result.matchedCount === 0) {
                    console.log("No tutor found to update with ID:", id);
                    return res.status(404).json({ error: "Tutor not found" });
                }
                console.log("Tutor updated successfully");
                res.send(result);
            } catch (error) {
                console.error("Error updating tutor:", error);
                res.status(500).json({ error: "Failed to update tutor" });
            }
        });

        app.post("/bookings", async (req, res) => {
            try {
                const result = await bookingsCollection.insertOne(req.body);
                console.log("New booking created with ID:", result.insertedId);
                res.status(201).json(result);
            } catch (error) {
                console.error("Error creating booking:", error);
                res.status(500).json({ error: "Failed to create booking" });
            }
        });

       app.get("/bookings", async (req, res) => {
    try {
        const email = req.query.email;
        console.log("Fetching bookings for:", email); 
        const query = email ? { 
        studentEmail: email } : {}; 
        const result = await bookingsCollection.find(query).toArray();
        console.log("Result found:", result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

app.patch("/bookings/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { 
            $set: { status: 'cancelled' } 
        };
        const result = await bookingsCollection.updateOne(filter, updateDoc);
        res.json(result);
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: "Failed to cancel booking" });
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
    res.send('MediQueue Server is running...');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});