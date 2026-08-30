from pymongo import MongoClient
from config import Config

_client = None
_db = None


def get_db():
    """Create (once) and return the MongoDB database handle."""
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        _db = _client[Config.MONGO_DB]
    return _db
