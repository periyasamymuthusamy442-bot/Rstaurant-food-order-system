import os


class Config:
    # ---- MongoDB connection settings ----
    # Override with environment variables, e.g.:
    #   export MONGO_URI="mongodb://localhost:27017"
    #   export MONGO_DB="foodhub"
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB = os.environ.get("MONGO_DB", "foodhub")

    # ---- Flask settings ----
    SECRET_KEY = os.environ.get("SECRET_KEY", "foodhub-dev-secret-change-me")

    # Folder (inside static/) where uploaded food images are stored
    UPLOAD_FOLDER = "images/uploads"
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
