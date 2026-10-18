const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
})

const app = express()
const PORT = 5000
app.use(cors({origin: "http://localhost:5173"}))
app.use(express.json())

app.get("/", (req, res) => {
    res.json({message: "Spotify Express API is running!"})
})

app.get("/api/health", async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping()
        res.json({
             "status": "ok",
            "service": "Express",
            "database": "connected"
        })
    }
    catch(error) {
        res.status(500).json({
            status: "error",
            message: error.message
        })
    }
})

async function startServer() {
    try {
        await mongoose.connect(
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/spotify"
        )

        console.log("MongoDB connected through Express")

        app.listen(PORT, () => {
            console.log(`Express API running at http://localhost:${PORT}`)
        })
    }
    catch(error) {
        console.error("Startup failed:", error.message)
    }
}

startServer()