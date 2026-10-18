import os
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env from the main Spotify project folder
load_dotenv(
    os.path.join(os.path.dirname(__file__), "..", "..", ".env")
)

app = Flask(__name__)
CORS(app)

mongo_uri = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/spotify"
)

client = MongoClient(
    mongo_uri,
    serverSelectionTimeoutMS=3000
)

db = client["spotify"]


@app.route("/")
def home():
    return jsonify({
        "message": "Spotify Flask REST API is running!"
    })


@app.route("/api/health")
def health():
    try:
        client.admin.command("ping")

        return jsonify({
            "status": "ok",
            "service": "Flask",
            "database": "connected"
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )