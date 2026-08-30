# ============================================================
# FOODHUB - APP.PY
# Flask + MongoDB
# Multi-Restaurant Admin System
# ============================================================

import os
import re

from functools import wraps
from datetime import datetime, timezone

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    jsonify,
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash,
)

from werkzeug.utils import secure_filename

from bson.objectid import ObjectId
from bson.errors import InvalidId

import pymongo.errors

from config import Config
from db import get_db


# ============================================================
# APP CONFIG
# ============================================================

app = Flask(__name__)
app.config.from_object(Config)

app.secret_key = (
    app.config.get("SECRET_KEY")
    or os.environ.get(
        "SECRET_KEY",
        "foodhub-development-secret-key",
    )
)


# ============================================================
# CONSTANTS
# ============================================================

ORDER_STATUS_FLOW = [
    "Preparing",
    "Out for Delivery",
    "Delivered",
]

DEFAULT_RESTAURANT_NAME = "FoodHub Restaurant"


# ============================================================
# ADMIN ACCOUNTS
# Password for all accounts: admin123
# ============================================================

ADMIN_ACCOUNTS = {

    "restaurant1": {
        "username": "restaurant1",
        "password": "admin123",
        "name": "Restaurant 1",
        "restaurant_id": "restaurant1",
    },

    "restaurant2": {
        "username": "restaurant2",
        "password": "admin123",
        "name": "Restaurant 2",
        "restaurant_id": "restaurant2",
    },

    "restaurant3": {
        "username": "restaurant3",
        "password": "admin123",
        "name": "Restaurant 3",
        "restaurant_id": "restaurant3",
    },

    "restaurant4": {
        "username": "restaurant4",
        "password": "admin123",
        "name": "Restaurant 4",
        "restaurant_id": "restaurant4",
    },

    "restaurant5": {
        "username": "restaurant5",
        "password": "admin123",
        "name": "Restaurant 5",
        "restaurant_id": "restaurant5",
    },

    "restaurant6": {
        "username": "restaurant6",
        "password": "admin123",
        "name": "Restaurant 6",
        "restaurant_id": "restaurant6",
    },

    "restaurant7": {
        "username": "restaurant7",
        "password": "admin123",
        "name": "Restaurant 7",
        "restaurant_id": "restaurant7",
    },

    "restaurant8": {
        "username": "restaurant8",
        "password": "admin123",
        "name": "Restaurant 8",
        "restaurant_id": "restaurant8",
    },

}


# ============================================================
# DATABASE
# ============================================================

def get_database():
    return get_db()


def now_utc():
    return datetime.now(timezone.utc)


# ============================================================
# OBJECT ID HELPER
# ============================================================

def oid(value):

    if value is None:
        return None

    if isinstance(value, ObjectId):
        return value

    try:
        return ObjectId(str(value))

    except (
        InvalidId,
        TypeError,
        ValueError,
    ):
        return None


# ============================================================
# DATABASE SETUP
# ============================================================

def ensure_setup():

    """
    Creates indexes,
    creates restaurants,
    creates admin accounts,
    and inserts default food.
    """

    try:

        db = get_database()

        # ====================================================
        # CREATE INDEXES
        # ====================================================

        indexes = [
            (db.users, "email", True),
            (db.restaurants, "name", True),
            (db.admins, "username", True),
            (db.foods, "restaurant_id", False),
            (db.orders, "user_id", False),
            (db.orders, "restaurant_id", False),
        ]

        for collection, field, unique in indexes:

            try:

                collection.create_index(
                    field,
                    unique=unique,
                )

            except pymongo.errors.DuplicateKeyError:
                pass

            except Exception:
                pass


        # ====================================================
        # CREATE RESTAURANTS
        # ====================================================

        restaurant_ids = {}

        for account_key, account in ADMIN_ACCOUNTS.items():

            restaurant_name = account["name"]

            restaurant = db.restaurants.find_one(
                {
                    "$or": [
                        {
                            "admin_key": account_key
                        },
                        {
                            "name": restaurant_name
                        },
                    ]
                }
            )

            if not restaurant:

                result = db.restaurants.insert_one(
                    {
                        "name": restaurant_name,
                        "owner_name": restaurant_name,
                        "email": (
                            f"{account_key}@foodhub.com"
                        ),
                        "phone": "",
                        "description": (
                            f"Welcome to {restaurant_name}."
                        ),
                        "status": "active",
                        "admin_key": account_key,
                        "created_at": now_utc(),
                    }
                )

                restaurant = db.restaurants.find_one(
                    {
                        "_id": result.inserted_id
                    }
                )

            else:

                db.restaurants.update_one(
                    {
                        "_id": restaurant["_id"]
                    },
                    {
                        "$set": {
                            "admin_key": account_key,
                            "status": restaurant.get(
                                "status",
                                "active",
                            ),
                        }
                    },
                )

            restaurant_ids[account_key] = (
                restaurant["_id"]
            )


            # ================================================
            # CREATE OR UPDATE ADMIN
            # ================================================

            admin = db.admins.find_one(
                {
                    "username": account["username"]
                }
            )

            if not admin:

                db.admins.insert_one(
                    {
                        "username": (
                            account["username"]
                        ),
                        "password_hash": (
                            generate_password_hash(
                                account["password"]
                            )
                        ),
                        "restaurant_id": (
                            restaurant["_id"]
                        ),
                        "role": (
                            "restaurant_owner"
                        ),
                        "created_at": now_utc(),
                    }
                )

            else:

                db.admins.update_one(
                    {
                        "_id": admin["_id"]
                    },
                    {
                        "$set": {
                            "restaurant_id": (
                                restaurant["_id"]
                            ),
                            "role": (
                                "restaurant_owner"
                            ),
                        }
                    },
                )


        # ====================================================
        # FIX OLD FOODS
        # ====================================================

        db.foods.update_many(
            {
                "$or": [
                    {
                        "restaurant_id": {
                            "$exists": False
                        }
                    },
                    {
                        "restaurant_id": None
                    },
                ]
            },
            {
                "$set": {
                    "restaurant_id": (
                        restaurant_ids[
                            "restaurant1"
                        ]
                    ),
                    "available": True,
                }
            },
        )


        # ====================================================
        # DEFAULT FOOD
        # ====================================================

        if db.foods.count_documents({}) == 0:

            restaurant_id = (
                restaurant_ids["restaurant1"]
            )

            now = now_utc()

            foods = [

                {
                    "name": "Cheese Pizza",
                    "category": "Pizza",
                    "price": 249.0,
                    "rating": 4.8,
                    "description": (
                        "Loaded with mozzarella "
                        "cheese and herbs."
                    ),
                    "image": "images/Pizza.jpg",
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

                {
                    "name": "Chicken Burger",
                    "category": "Burger",
                    "price": 149.0,
                    "rating": 4.7,
                    "description": (
                        "Juicy grilled chicken burger."
                    ),
                    "image": "images/Burger.jpg",
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

                {
                    "name": "Chicken Biryani",
                    "category": "Biryani",
                    "price": 299.0,
                    "rating": 4.9,
                    "description": (
                        "Aromatic basmati rice "
                        "with chicken."
                    ),
                    "image": (
                        "images/Biryani.jpg"
                    ),
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

                {
                    "name": "Masala Dosa",
                    "category": "Dosa",
                    "price": 99.0,
                    "rating": 4.6,
                    "description": (
                        "Crispy dosa with "
                        "potato masala."
                    ),
                    "image": "images/Dosa.jpg",
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

                {
                    "name": "Orange Juice",
                    "category": "Juice",
                    "price": 79.0,
                    "rating": 4.5,
                    "description": (
                        "Fresh orange juice."
                    ),
                    "image": "images/Juice.jpg",
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

                {
                    "name": "Vanilla Ice Cream",
                    "category": "Ice Cream",
                    "price": 129.0,
                    "rating": 4.9,
                    "description": (
                        "Creamy vanilla ice cream."
                    ),
                    "image": (
                        "images/Ice Cream.jpg"
                    ),
                    "restaurant_id": (
                        restaurant_id
                    ),
                    "available": True,
                    "created_at": now,
                },

            ]

            db.foods.insert_many(foods)


        print("=" * 50)
        print(
            "FoodHub database setup completed"
        )
        print("=" * 50)

        for account in ADMIN_ACCOUNTS.values():

            print(
                f"{account['username']} / "
                f"{account['password']}"
            )

        print("=" * 50)


    except pymongo.errors.ServerSelectionTimeoutError as error:

        print(
            "MongoDB connection failed:"
        )

        print(error)


    except pymongo.errors.ConnectionFailure as error:

        print(
            "MongoDB connection failure:"
        )

        print(error)


    except Exception as error:

        print(
            "Database setup error:"
        )

        print(error)


with app.app_context():
    ensure_setup()


# ============================================================
# AUTH HELPERS
# ============================================================

def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if not session.get("user_id"):

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Please login first."
                    ),
                }
            ), 401

        return function(
            *args,
            **kwargs,
        )

    return wrapper


def restaurant_owner_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if not session.get("admin_id"):

            return redirect(
                url_for(
                    "admin_login"
                )
            )

        if not session.get(
            "restaurant_id"
        ):

            return redirect(
                url_for(
                    "admin_login"
                )
            )

        if not oid(
            session.get(
                "restaurant_id"
            )
        ):

            session.clear()

            return redirect(
                url_for(
                    "admin_login"
                )
            )

        return function(
            *args,
            **kwargs,
        )

    return wrapper


def admin_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if not session.get("admin_id"):

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Admin login required."
                    ),
                }
            ), 401

        restaurant_id = oid(
            session.get(
                "restaurant_id"
            )
        )

        if not restaurant_id:

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Invalid restaurant "
                        "session."
                    ),
                }
            ), 401

        return function(
            *args,
            **kwargs,
        )

    return wrapper


# ============================================================
# FILE HELPERS
# ============================================================

def allowed_file(filename):

    if not filename:

        return False

    if "." not in filename:

        return False

    extension = (
        filename
        .rsplit(
            ".",
            1,
        )[1]
        .lower()
    )

    allowed = getattr(
        Config,
        "ALLOWED_EXTENSIONS",
        {
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp",
        },
    )

    return extension in allowed


def food_image_url(image_path):

    if not image_path:

        return None

    image_path = (
        str(image_path)
        .strip()
    )

    if image_path.startswith(
        (
            "http://",
            "https://",
        )
    ):

        return image_path

    image_path = (
        image_path
        .lstrip("/")
    )

    if image_path.startswith(
        "static/"
    ):

        image_path = (
            image_path[
                len("static/")
            :]
        )

    if image_path.startswith(
        "static\\"
    ):

        image_path = (
            image_path[
                len("static\\")
            :]
        )

    image_path = (
        image_path
        .replace(
            "\\",
            "/",
        )
    )

    if "/" not in image_path:

        image_path = (
            "images/"
            + image_path
        )

    return url_for(
        "static",
        filename=image_path,
    )


def save_uploaded_image(file):

    if not file:

        return None

    if not file.filename:

        return None

    if not allowed_file(
        file.filename
    ):

        return None

    upload_folder = getattr(
        Config,
        "UPLOAD_FOLDER",
        "uploads",
    )

    upload_dir = os.path.join(
        app.static_folder,
        upload_folder,
    )

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    filename = secure_filename(
        file.filename
    )

    if not filename:

        return None

    base, extension = os.path.splitext(
        filename
    )

    final_name = filename

    counter = 1

    while os.path.exists(
        os.path.join(
            upload_dir,
            final_name,
        )
    ):

        final_name = (
            f"{base}_{counter}"
            f"{extension}"
        )

        counter += 1

    file.save(
        os.path.join(
            upload_dir,
            final_name,
        )
    )

    return (
        f"{upload_folder}/"
        f"{final_name}"
    ).replace(
        "\\",
        "/",
    )


# ============================================================
# REQUEST DATA
# ============================================================

def get_request_data():

    json_data = request.get_json(
        silent=True
    )

    if json_data is not None:

        return json_data

    return request.form


# ============================================================
# RESTAURANT HELPERS
# ============================================================

def get_current_restaurant():

    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    if not restaurant_id:

        return None

    db = get_database()

    return db.restaurants.find_one(
        {
            "_id": restaurant_id
        }
    )


def serialize_restaurant(
    restaurant
):

    return {
        "id": str(
            restaurant["_id"]
        ),
        "name": restaurant.get(
            "name",
            "",
        ),
        "owner_name": restaurant.get(
            "owner_name",
            "",
        ),
        "email": restaurant.get(
            "email",
            "",
        ),
        "phone": restaurant.get(
            "phone",
            "",
        ),
        "description": restaurant.get(
            "description",
            "",
        ),
        "status": restaurant.get(
            "status",
            "active",
        ),
    }


# ============================================================
# FOOD SERIALIZER
# ============================================================

CATEGORY_DEFAULT_IMAGES = {

    "pizza":
        "/static/images/Pizza.jpg",

    "burger":
        "/static/images/Burger.jpg",

    "biryani":
        "/static/images/Biryani.jpg",

    "dosa":
        "/static/images/Dosa.jpg",

    "juice":
        "/static/images/Juice.jpg",

    "ice cream":
        "/static/images/Ice Cream.jpg",

    "icecream":
        "/static/images/Ice Cream.jpg",

    "indian":
        "/static/images/Biryani.jpg",

    "chinese":
        "/static/images/Burger.jpg",

    "dessert":
        "/static/images/Ice Cream.jpg",

    "drinks":
        "/static/images/Juice.jpg",
}


def category_default_image(
    category
):

    category = (
        str(category or "")
        .strip()
        .lower()
    )

    return CATEGORY_DEFAULT_IMAGES.get(
        category,
        "/static/images/logo.png",
    )


def image_file_exists(
    image_url
):

    if not image_url:

        return False

    if not image_url.startswith(
        "/static/"
    ):

        return False

    relative_path = image_url[
        len("/static/")
        :
    ]

    full_path = os.path.join(
        app.static_folder,
        relative_path,
    )

    return os.path.isfile(
        full_path
    )


def serialize_food(food):

    try:

        price = float(
            food.get(
                "price",
                0,
            )
        )

    except (
        ValueError,
        TypeError,
    ):

        price = 0.0

    try:

        rating = float(
            food.get(
                "rating",
                4.5,
            )
        )

    except (
        ValueError,
        TypeError,
    ):

        rating = 4.5

    restaurant_id = food.get(
        "restaurant_id"
    )

    category = food.get(
        "category",
        "",
    )

    image = food.get(
        "image"
    )

    image_url = (
        food_image_url(
            image
        )
        if image
        else None
    )

    is_external = bool(
        image_url
        and image_url.startswith(
            (
                "http://",
                "https://",
            )
        )
    )

    if (
        not image_url
        or (
            not is_external
            and not image_file_exists(
                image_url
            )
        )
    ):

        image_url = (
            category_default_image(
                category
            )
        )

    return {

        "id": str(
            food["_id"]
        ),

        "name": food.get(
            "name",
            "",
        ),

        "category": food.get(
            "category",
            "",
        ),

        "price": price,

        "rating": rating,

        "description": food.get(
            "description",
            "",
        ),

        "image": image,

        "image_url": image_url,

        "restaurant_id": (
            str(
                restaurant_id
            )
            if restaurant_id
            else None
        ),

        "available": food.get(
            "available",
            True,
        ),
    }


# ============================================================
# ORDER SERIALIZER
# ============================================================

def serialize_order(order):

    items = []

    # ========================================================
    # SERIALIZE EACH ORDER ITEM
    # ========================================================

    for item in order.get(
        "items",
        [],
    ):

        try:

            price = float(
                item.get(
                    "price",
                    0,
                )
            )

        except (
            ValueError,
            TypeError,
        ):

            price = 0.0

        try:

            quantity = int(
                item.get(
                    "quantity",
                    1,
                )
            )

        except (
            ValueError,
            TypeError,
        ):

            quantity = 1

        if quantity < 1:

            quantity = 1


        # ====================================================
        # RESTAURANT ID
        # ====================================================

        item_restaurant_id = item.get(
            "restaurant_id"
        )


        # ====================================================
        # FOOD IMAGE
        # ====================================================

        image = item.get(
            "image"
        )

        image_url = (
            food_image_url(
                image
            )
            if image
            else None
        )


        # ====================================================
        # CATEGORY
        # ====================================================

        category = item.get(
            "category",
            "",
        )


        # ====================================================
        # EXTERNAL IMAGE CHECK
        # ====================================================

        is_external = bool(

            image_url

            and image_url.startswith(
                (
                    "http://",
                    "https://",
                )
            )

        )


        # ====================================================
        # DEFAULT IMAGE
        # ====================================================

        if (

            not image_url

            or (

                not is_external

                and not image_file_exists(
                    image_url
                )

            )

        ):

            image_url = (
                category_default_image(
                    category
                )
            )


        # ====================================================
        # IMPORTANT:
        # ADD ITEM TO ITEMS LIST
        # ====================================================

        items.append(
            {

                "food_id": str(
                    item.get(
                        "food_id",
                        "",
                    )
                ),

                "name": item.get(
                    "name",
                    "Food Item",
                ),

                "category": category,

                "price": price,

                "quantity": quantity,

                "image": image,

                "image_url": image_url,

                "restaurant_id": (

                    str(
                        item_restaurant_id
                    )

                    if item_restaurant_id

                    else None

                ),

            }
        )


    # ========================================================
    # CREATED AT
    # ========================================================

    created_at = order.get(
        "created_at"
    )

    if created_at:

        try:

            created_at = (
                created_at.strftime(
                    "%Y-%m-%d %H:%M"
                )
            )

        except AttributeError:

            created_at = str(
                created_at
            )


    # ========================================================
    # RETURN ORDER
    # ========================================================

    return {

        "id": str(
            order["_id"]
        ),

        "user_id": str(
            order.get(
                "user_id",
                "",
            )
        ),

        "restaurant_id": (

            str(
                order.get(
                    "restaurant_id"
                )
            )

            if order.get(
                "restaurant_id"
            )

            else None

        ),

        "items": items,

        "item_total": float(
            order.get(
                "item_total",
                0,
            )
        ),

        "gst": float(
            order.get(
                "gst",
                0,
            )
        ),

        "delivery_charge": float(
            order.get(
                "delivery_charge",
                0,
            )
        ),

        "grand_total": float(
            order.get(
                "grand_total",
                0,
            )
        ),

        "payment_method": order.get(
            "payment_method",
            "Cash On Delivery",
        ),

        "customer_name": order.get(
            "customer_name",
            "",
        ),

        "customer_phone": order.get(
            "customer_phone",
            "",
        ),

        "customer_address": order.get(
            "customer_address",
            "",
        ),

        "status": order.get(
            "status",
            "Preparing",
        ),

        "created_at": created_at,

    }


# ============================================================
# PAGE ROUTES
# ============================================================

@app.route("/")
def index():

    if session.get("user_id"):

        return redirect(
            url_for(
                "home_page"
            )
        )

    return redirect(
        url_for(
            "login_page"
        )
    )


@app.route("/home.html")
def home_page():

    return render_template(
        "home.html"
    )


@app.route("/menu.html")
def menu_page():

    return render_template(
        "menu.html"
    )


@app.route("/restaurants.html")
def restaurants_page():

    return render_template(
        "restaurants.html"
    )


@app.route("/cart.html")
def cart_page():

    return render_template(
        "cart.html"
    )


@app.route("/orders.html")
def orders_page():

    if not session.get("user_id"):

        return redirect(
            url_for(
                "login_page"
            )
        )

    return render_template(
        "orders.html"
    )


@app.route("/profile.html")
def profile_page():

    if not session.get("user_id"):

        return redirect(
            url_for(
                "login_page"
            )
        )

    return render_template(
        "profile.html"
    )


@app.route("/help.html")
def help_page():

    return render_template(
        "help.html"
    )


@app.route("/settings.html")
def settings_page():

    if not session.get("user_id"):

        return redirect(
            url_for(
                "login_page"
            )
        )

    return render_template(
        "settings.html"
    )


@app.route("/contact.html")
def contact_page():

    return render_template(
        "contact.html"
    )


@app.route("/offers.html")
def offers_page():

    return render_template(
        "offers.html"
    )


@app.route("/login.html")
def login_page():

    return render_template(
        "login.html"
    )


@app.route("/register.html")
def register_page():

    return render_template(
        "register.html"
    )


@app.route("/payment.html")
@login_required
def payment_page():

    return render_template(
        "payment.html"
    )


@app.route("/success.html")
@login_required
def success_page():

    return render_template(
        "success.html"
    )


# ============================================================
# ADMIN LOGIN PAGE
# ============================================================

@app.route(
    "/admin_login.html",
    methods=[
        "GET",
        "POST",
    ],
)
def admin_login():

    if request.method == "POST":

        username = (
            request.form.get(
                "username",
                "",
            )
            .strip()
        )

        password = (
            request.form.get(
                "password",
                "",
            )
            .strip()
        )

        account = ADMIN_ACCOUNTS.get(
            username
        )

        if not account:

            return render_template(
                "admin_login.html",
                error=(
                    "Invalid username or password."
                ),
            )

        if password != account["password"]:

            return render_template(
                "admin_login.html",
                error=(
                    "Invalid username or password."
                ),
            )

        db = get_database()

        restaurant = (
            db.restaurants.find_one(
                {
                    "$or": [
                        {
                            "admin_key": username
                        },
                        {
                            "name": account["name"]
                        },
                    ]
                }
            )
        )

        if not restaurant:

            return render_template(
                "admin_login.html",
                error=(
                    "Restaurant not found."
                ),
            )

        session.clear()

        session["admin_logged_in"] = True

        session["admin_id"] = username

        session["admin_username"] = username

        session["admin_name"] = (
            account["name"]
        )

        session["restaurant_id"] = str(
            restaurant["_id"]
        )

        session["restaurant_name"] = (
            restaurant.get(
                "name",
                "",
            )
        )

        session["admin_role"] = (
            "restaurant_owner"
        )

        return redirect(
            url_for(
                "admin_dashboard"
            )
        )

    return render_template(
        "admin_login.html"
    )


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@app.route("/admin/dashboard")
@restaurant_owner_required
def admin_dashboard():

    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    if not restaurant_id:

        return redirect(
            url_for(
                "admin_login"
            )
        )

    db = get_database()

    restaurant = (
        db.restaurants.find_one(
            {
                "_id": restaurant_id
            }
        )
    )

    if not restaurant:

        session.clear()

        return redirect(
            url_for(
                "admin_login"
            )
        )


    menu_items = list(

        db.foods.find(
            {
                "restaurant_id": (
                    restaurant_id
                )
            }
        ).sort(
            "created_at",
            -1,
        )

    )


    orders = list(

        db.orders.find(
            {
                "restaurant_id": (
                    restaurant_id
                )
            }
        ).sort(
            "created_at",
            -1,
        )

    )


    total_orders = len(
        orders
    )

    total_revenue = 0.0

    total_items_sold = 0


    for order in orders:

        for item in order.get(
            "items",
            [],
        ):

            try:

                price = float(
                    item.get(
                        "price",
                        0,
                    )
                )

            except (
                ValueError,
                TypeError,
            ):

                price = 0.0

            try:

                quantity = int(
                    item.get(
                        "quantity",
                        1,
                    )
                )

            except (
                ValueError,
                TypeError,
            ):

                quantity = 1

            total_revenue += (
                price * quantity
            )

            total_items_sold += (
                quantity
            )


    analytics = {

        "total_orders":
            total_orders,

        "total_revenue":
            round(
                total_revenue,
                2,
            ),

        "total_items_sold":
            total_items_sold,

        "total_menu_items":
            len(menu_items),

    }


    return render_template(

        "admin_dashboard.html",

        restaurant_name=(
            restaurant.get(
                "name",
                DEFAULT_RESTAURANT_NAME,
            )
        ),

        menu_items=menu_items,

        orders=orders,

        analytics=analytics,

    )


# ============================================================
# ADMIN ADD FOOD PAGE
# ============================================================

@app.route("/admin/add-food")
@restaurant_owner_required
def admin_add_food_page():

    restaurant = (
        get_current_restaurant()
    )

    if not restaurant:

        session.clear()

        return redirect(
            url_for(
                "admin_login"
            )
        )

    return render_template(

        "admin_add_food.html",

        restaurant_name=(
            restaurant.get(
                "name",
                DEFAULT_RESTAURANT_NAME,
            )
        ),

    )


@app.route("/add_food.html")
@restaurant_owner_required
def add_food_page():

    return redirect(
        url_for(
            "admin_add_food_page"
        )
    )


@app.route("/edit_food.html")
@restaurant_owner_required
def edit_food_page():

    restaurant = (
        get_current_restaurant()
    )

    if not restaurant:

        session.clear()

        return redirect(
            url_for(
                "admin_login"
            )
        )

    return render_template(

        "edit_food.html",

        restaurant_name=(
            restaurant.get(
                "name",
                DEFAULT_RESTAURANT_NAME,
            )
        ),

    )


@app.route("/view_orders.html")
@restaurant_owner_required
def view_orders_page():

    restaurant = (
        get_current_restaurant()
    )

    if not restaurant:

        session.clear()

        return redirect(
            url_for(
                "admin_login"
            )
        )

    return render_template(

        "view_orders.html",

        restaurant_name=(
            restaurant.get(
                "name",
                DEFAULT_RESTAURANT_NAME,
            )
        ),

    )


# ============================================================
# CUSTOMER REGISTER
# ============================================================

@app.route(
    "/api/register",
    methods=["POST"],
)
def api_register():

    data = get_request_data()

    name = str(
        data.get("name") or ""
    ).strip()

    email = str(
        data.get("email") or ""
    ).strip().lower()

    mobile = str(
        data.get("mobile") or ""
    ).strip()

    password = str(
        data.get("password") or ""
    )

    if not all(
        [
            name,
            email,
            mobile,
            password,
        ]
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please fill all fields."
                ),
            }
        ), 400


    if (
        len(mobile) != 10
        or not mobile.isdigit()
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Enter valid 10-digit "
                    "mobile number."
                ),
            }
        ), 400


    if len(password) < 6:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Password must be at "
                    "least 6 characters."
                ),
            }
        ), 400


    db = get_database()

    if db.users.find_one(
        {
            "email": email
        }
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Email already exists."
                ),
            }
        ), 409


    try:

        result = db.users.insert_one(
            {
                "name": name,
                "email": email,
                "mobile": mobile,
                "password_hash": (
                    generate_password_hash(
                        password
                    )
                ),
                "created_at": (
                    now_utc()
                ),
            }
        )

    except pymongo.errors.DuplicateKeyError:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Email already exists."
                ),
            }
        ), 409


    return jsonify(
        {
            "success": True,
            "message": (
                "Registration successful!"
            ),
            "user_id": str(
                result.inserted_id
            ),
        }
    )


# ============================================================
# CUSTOMER LOGIN
# ============================================================

@app.route(
    "/api/login",
    methods=["POST"],
)
def api_login():

    data = get_request_data()

    email = str(
        data.get("email") or ""
    ).strip().lower()

    password = str(
        data.get("password") or ""
    )

    if not email or not password:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please enter email "
                    "and password."
                ),
            }
        ), 400


    db = get_database()

    user = db.users.find_one(
        {
            "email": email
        }
    )

    if not user:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid email or password."
                ),
            }
        ), 401


    password_hash = user.get(
        "password_hash"
    )

    if not password_hash:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Password data is missing."
                ),
            }
        ), 500


    try:

        valid_password = (
            check_password_hash(
                password_hash,
                password,
            )
        )

    except Exception:

        valid_password = False


    if not valid_password:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid email or password."
                ),
            }
        ), 401


    session.clear()

    session["user_id"] = str(
        user["_id"]
    )

    session["user_name"] = (
        user.get(
            "name",
            "",
        )
    )

    session["user_email"] = (
        user.get(
            "email",
            email,
        )
    )


    return jsonify(
        {
            "success": True,
            "message": (
                "Login successful!"
            ),
            "user": {
                "id": str(
                    user["_id"]
                ),
                "name": user.get(
                    "name",
                    "",
                ),
                "email": user.get(
                    "email",
                    email,
                ),
            },
        }
    )


# ============================================================
# CUSTOMER LOGOUT
# ============================================================

@app.route(
    "/api/logout",
    methods=["POST"],
)
def api_logout():

    session.clear()

    return jsonify(
        {
            "success": True,
            "message": (
                "Logged out successfully."
            ),
        }
    )


# ============================================================
# CUSTOMER SESSION
# ============================================================

@app.route(
    "/api/session",
    methods=["GET"],
)
def api_session():

    user_id = session.get(
        "user_id"
    )

    if user_id:

        return jsonify(
            {
                "logged_in": True,
                "name": session.get(
                    "user_name",
                    "User",
                ),
                "email": session.get(
                    "user_email",
                    "",
                ),
                "user_id": user_id,
            }
        )

    return jsonify(
        {
            "logged_in": False
        }
    )


# ============================================================
# CUSTOMER PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["GET"],
)
@login_required
def api_get_profile():

    user_oid = oid(
        session.get(
            "user_id"
        )
    )

    if not user_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid user session."
                ),
            }
        ), 401


    db = get_database()

    user = db.users.find_one(
        {
            "_id": user_oid
        }
    )

    if not user:

        return jsonify(
            {
                "success": False,
                "message": (
                    "User not found."
                ),
            }
        ), 404


    return jsonify(
        {
            "success": True,
            "profile": {
                "name": user.get(
                    "name",
                    "",
                ),
                "email": user.get(
                    "email",
                    "",
                ),
                "mobile": user.get(
                    "mobile",
                    "",
                ),
            },
        }
    )


# ============================================================
# CUSTOMER PROFILE UPDATE
# ============================================================

@app.route(
    "/api/profile/update",
    methods=["POST"],
)
@login_required
def api_update_profile():

    data = get_request_data()

    name = str(
        data.get("name") or ""
    ).strip()

    mobile = str(
        data.get("mobile") or ""
    ).strip()

    if not name:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Name cannot be empty."
                ),
            }
        ), 400


    if (
        mobile
        and (
            len(mobile) != 10
            or not mobile.isdigit()
        )
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Enter a valid 10-digit "
                    "mobile number."
                ),
            }
        ), 400


    user_oid = oid(
        session.get(
            "user_id"
        )
    )

    if not user_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid user session."
                ),
            }
        ), 401


    db = get_database()

    update = {
        "name": name
    }

    if mobile:

        update["mobile"] = mobile


    db.users.update_one(
        {
            "_id": user_oid
        },
        {
            "$set": update
        },
    )

    session["user_name"] = name


    return jsonify(
        {
            "success": True,
            "message": (
                "Profile updated successfully!"
            ),
            "user": {
                "name": name,
                "mobile": mobile,
            },
        }
    )


# ============================================================
# RESTAURANT LIST
# ============================================================

@app.route(
    "/api/restaurants",
    methods=["GET"],
)
def api_restaurants():

    db = get_database()

    restaurants = list(

        db.restaurants.find(
            {
                "status": "active"
            }
        ).sort(
            "name",
            1,
        )

    )

    return jsonify(
        {
            "success": True,
            "restaurants": [
                serialize_restaurant(
                    restaurant
                )
                for restaurant
                in restaurants
            ],
        }
    )


# ============================================================
# RESTAURANT DETAIL
# ============================================================

@app.route(
    "/api/restaurants/<restaurant_id>",
    methods=["GET"],
)
def api_restaurant_detail(
    restaurant_id
):

    restaurant_oid = oid(
        restaurant_id
    )

    if not restaurant_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid restaurant ID."
                ),
            }
        ), 400


    db = get_database()

    restaurant = (
        db.restaurants.find_one(
            {
                "_id": restaurant_oid
            }
        )
    )

    if not restaurant:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Restaurant not found."
                ),
            }
        ), 404


    return jsonify(
        {
            "success": True,
            "restaurant": (
                serialize_restaurant(
                    restaurant
                )
            ),
        }
    )


# ============================================================
# ADMIN API LOGIN
# ============================================================

@app.route(
    "/api/admin/login",
    methods=["POST"],
)
def api_admin_login():

    data = get_request_data()

    username = str(
        data.get("username") or ""
    ).strip()

    password = str(
        data.get("password") or ""
    )

    if not username or not password:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please enter username "
                    "and password."
                ),
            }
        ), 400


    account = ADMIN_ACCOUNTS.get(
        username
    )

    if not account:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid Username "
                    "or Password"
                ),
            }
        ), 401


    if password != account["password"]:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid Username "
                    "or Password"
                ),
            }
        ), 401


    db = get_database()

    restaurant = (
        db.restaurants.find_one(
            {
                "$or": [
                    {
                        "admin_key": username
                    },
                    {
                        "name": account["name"]
                    },
                ]
            }
        )
    )

    if not restaurant:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Restaurant not found."
                ),
            }
        ), 404


    admin = db.admins.find_one(
        {
            "username": username
        }
    )

    if not admin:

        result = db.admins.insert_one(
            {
                "username": username,
                "password_hash": (
                    generate_password_hash(
                        account["password"]
                    )
                ),
                "restaurant_id": (
                    restaurant["_id"]
                ),
                "role": (
                    "restaurant_owner"
                ),
                "created_at": (
                    now_utc()
                ),
            }
        )

        admin_id = str(
            result.inserted_id
        )

    else:

        admin_id = str(
            admin["_id"]
        )

        db.admins.update_one(
            {
                "_id": admin["_id"]
            },
            {
                "$set": {
                    "restaurant_id": (
                        restaurant["_id"]
                    ),
                    "role": (
                        "restaurant_owner"
                    ),
                }
            },
        )


    session.clear()

    session["admin_logged_in"] = True

    session["admin_id"] = admin_id

    session["admin_username"] = (
        username
    )

    session["restaurant_id"] = str(
        restaurant["_id"]
    )

    session["restaurant_name"] = (
        restaurant.get(
            "name",
            "",
        )
    )

    session["admin_role"] = (
        "restaurant_owner"
    )


    return jsonify(
        {
            "success": True,
            "message": (
                "Admin Login Successful"
            ),
            "admin": {
                "id": admin_id,
                "username": username,
                "role": (
                    "restaurant_owner"
                ),
                "restaurant_id": str(
                    restaurant["_id"]
                ),
                "restaurant_name": (
                    restaurant.get(
                        "name",
                        "",
                    )
                ),
            },
        }
    )


# ============================================================
# ADMIN LOGOUT
# ============================================================

@app.route(
    "/api/admin/logout",
    methods=["POST"],
)
def api_admin_logout():

    for key in [

        "admin_logged_in",

        "admin_id",

        "admin_username",

        "admin_name",

        "restaurant_id",

        "restaurant_name",

        "admin_role",

    ]:

        session.pop(
            key,
            None,
        )


    return jsonify(
        {
            "success": True,
            "message": (
                "Admin logged out successfully."
            ),
        }
    )


# ============================================================
# ADMIN SESSION
# ============================================================

@app.route(
    "/api/admin/session",
    methods=["GET"],
)
def api_admin_session():

    admin_id = session.get(
        "admin_id"
    )

    restaurant_id = session.get(
        "restaurant_id"
    )

    if admin_id and restaurant_id:

        return jsonify(
            {
                "logged_in": True,
                "admin_id": admin_id,
                "username": (
                    session.get(
                        "admin_username",
                        "",
                    )
                ),
                "role": (
                    session.get(
                        "admin_role",
                        "restaurant_owner",
                    )
                ),
                "restaurant_id": (
                    restaurant_id
                ),
                "restaurant_name": (
                    session.get(
                        "restaurant_name",
                        "",
                    )
                ),
            }
        )

    return jsonify(
        {
            "logged_in": False
        }
    )


# ============================================================
# GET FOODS
# ============================================================

@app.route(
    "/api/foods",
    methods=["GET"],
)
def api_foods():

    category = (
        request.args.get(
            "category",
            "",
        )
        .strip()
    )

    search = (
        request.args.get(
            "search",
            "",
        )
        .strip()
    )

    restaurant_id = (
        request.args.get(
            "restaurant_id",
            "",
        )
        .strip()
    )

    db = get_database()

    query = {
        "available": {
            "$ne": False
        }
    }


    if restaurant_id:

        restaurant_oid = oid(
            restaurant_id
        )

        if not restaurant_oid:

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Invalid restaurant ID."
                    ),
                }
            ), 400

        query["restaurant_id"] = (
            restaurant_oid
        )


    if (
        category
        and category.lower() != "all"
    ):

        query["category"] = {
            "$regex": (
                f"^{re.escape(category)}$"
            ),
            "$options": "i",
        }


    if search:

        safe_search = re.escape(
            search
        )

        query["$or"] = [

            {
                "name": {
                    "$regex": (
                        safe_search
                    ),
                    "$options": "i",
                }
            },

            {
                "category": {
                    "$regex": (
                        safe_search
                    ),
                    "$options": "i",
                }
            },

        ]


    foods = list(

        db.foods.find(
            query
        ).sort(
            "created_at",
            -1,
        )

    )


    return jsonify(
        {
            "success": True,
            "foods": [
                serialize_food(
                    food
                )
                for food
                in foods
            ],
        }
    )


# ============================================================
# ADMIN GET FOODS
# ============================================================

@app.route(
    "/api/admin/foods",
    methods=["GET"],
)
@admin_required
def api_admin_foods():

    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    db = get_database()

    foods = list(

        db.foods.find(
            {
                "restaurant_id": (
                    restaurant_id
                )
            }
        ).sort(
            "created_at",
            -1,
        )

    )


    return jsonify(
        {
            "success": True,
            "foods": [
                serialize_food(
                    food
                )
                for food
                in foods
            ],
        }
    )


# ============================================================
# ADMIN ADD FOOD
# ============================================================

@app.route(
    "/api/admin/foods",
    methods=["POST"],
)
@admin_required
def api_add_food():

    data = get_request_data()

    name = str(
        data.get("name") or ""
    ).strip()

    category = str(
        data.get("category") or ""
    ).strip()

    price_value = data.get(
        "price"
    )

    description = str(
        data.get(
            "description"
        )
        or ""
    ).strip()


    if (

        not name

        or not category

        or price_value in (
            None,
            "",
        )

    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please fill all "
                    "required fields."
                ),
            }
        ), 400


    try:

        price = float(
            price_value
        )

    except (
        ValueError,
        TypeError,
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid price."
                ),
            }
        ), 400


    if price < 0:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Price cannot be negative."
                ),
            }
        ), 400


    image_rel_path = None

    file = request.files.get(
        "image"
    )

    if file and file.filename:

        if not allowed_file(
            file.filename
        ):

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Invalid image format."
                    ),
                }
            ), 400

        image_rel_path = (
            save_uploaded_image(
                file
            )
        )


    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    if not restaurant_id:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Restaurant session "
                    "is invalid."
                ),
            }
        ), 401


    db = get_database()

    result = db.foods.insert_one(
        {
            "name": name,
            "category": category,
            "price": price,
            "rating": 4.5,
            "description": description,
            "image": image_rel_path,
            "restaurant_id": (
                restaurant_id
            ),
            "available": True,
            "created_at": (
                now_utc()
            ),
        }
    )


    return jsonify(
        {
            "success": True,
            "message": (
                "Food added successfully!"
            ),
            "food_id": str(
                result.inserted_id
            ),
        }
    )


# ============================================================
# ADMIN DELETE FOOD
# ============================================================

@app.route(
    "/api/admin/foods/<food_id>",
    methods=["DELETE"],
)
@admin_required
def api_delete_food(food_id):

    food_oid = oid(
        food_id
    )

    if not food_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid food ID."
                ),
            }
        ), 400


    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    db = get_database()

    result = db.foods.delete_one(
        {
            "_id": food_oid,
            "restaurant_id": (
                restaurant_id
            ),
        }
    )


    if result.deleted_count == 0:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Food not found in "
                    "your restaurant."
                ),
            }
        ), 404


    return jsonify(
        {
            "success": True,
            "message": (
                "Food deleted successfully!"
            ),
        }
    )


# ============================================================
# PLACE ORDER
# ============================================================

@app.route(
    "/api/orders",
    methods=["POST"],
)
@login_required
def api_place_order():

    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    items = data.get(
        "items"
    ) or []

    payment_method = str(
        data.get(
            "payment_method",
            "Cash On Delivery",
        )
    ).strip()


    delivery_details = (
        data.get(
            "delivery_details"
        )
        or {}
    )

    customer_name = str(
        delivery_details.get(
            "name"
        )
        or ""
    ).strip()

    customer_phone = str(
        delivery_details.get(
            "phone"
        )
        or ""
    ).strip()

    customer_address = str(
        delivery_details.get(
            "address"
        )
        or ""
    ).strip()


    if (
        not customer_name
        or not customer_phone
        or not customer_address
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please enter your name, "
                    "phone number and delivery "
                    "address."
                ),
            }
        ), 400


    if (
        len(customer_phone) != 10
        or not customer_phone.isdigit()
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Enter a valid 10-digit "
                    "phone number."
                ),
            }
        ), 400


    if not items:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Your cart is empty."
                ),
            }
        ), 400


    db = get_database()

    item_total = 0.0

    order_items = []

    restaurant_ids = set()


    for item in items:

        if not isinstance(
            item,
            dict,
        ):

            continue


        food_id = (

            item.get(
                "food_id"
            )

            or item.get(
                "id"
            )

            or item.get(
                "_id"
            )

        )


        try:

            quantity = int(
                item.get(
                    "quantity",
                    1,
                )
            )

        except (
            ValueError,
            TypeError,
        ):

            quantity = 1


        if quantity < 1:

            quantity = 1


        food = None

        food_oid = oid(
            food_id
        )

        if food_oid:

            food = (
                db.foods.find_one(
                    {
                        "_id": food_oid,
                        "available": {
                            "$ne": False
                        },
                    }
                )
            )


        if not food:

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Food item not found. "
                        "Please refresh the menu."
                    ),
                }
            ), 404


        restaurant_id = food.get(
            "restaurant_id"
        )

        if not restaurant_id:

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Food is not linked "
                        "to a restaurant."
                    ),
                }
            ), 500


        restaurant_ids.add(
            str(
                restaurant_id
            )
        )


        try:

            food_price = float(
                food.get(
                    "price",
                    0,
                )
            )

        except (
            ValueError,
            TypeError,
        ):

            food_price = 0.0


        item_total += (
            food_price
            * quantity
        )


        # ================================================
        # IMPORTANT:
        # STORE IMAGE + CATEGORY + RESTAURANT
        # ================================================

        order_items.append(
            {

                "food_id": str(
                    food["_id"]
                ),

                "name": food.get(
                    "name",
                    "Food Item",
                ),

                "category": food.get(
                    "category",
                    "",
                ),

                "price": food_price,

                "quantity": quantity,

                "image": food.get(
                    "image"
                ),

                "restaurant_id": (
                    restaurant_id
                ),

            }
        )


    if not order_items:

        return jsonify(
            {
                "success": False,
                "message": (
                    "No valid food items found."
                ),
            }
        ), 400


    if len(restaurant_ids) > 1:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please place separate "
                    "orders for different "
                    "restaurants."
                ),
            }
        ), 400


    restaurant_id = oid(
        next(
            iter(
                restaurant_ids
            )
        )
    )

    if not restaurant_id:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid restaurant "
                    "information."
                ),
            }
        ), 400


    gst = 20.0

    delivery_charge = 40.0

    grand_total = (

        item_total

        + gst

        + delivery_charge

    )


    user_oid = oid(
        session.get(
            "user_id"
        )
    )

    if not user_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid user session."
                ),
            }
        ), 401


    result = db.orders.insert_one(
        {

            "user_id":
                user_oid,

            "restaurant_id":
                restaurant_id,

            "items":
                order_items,

            "item_total":
                round(
                    item_total,
                    2,
                ),

            "gst":
                round(
                    gst,
                    2,
                ),

            "delivery_charge":
                round(
                    delivery_charge,
                    2,
                ),

            "grand_total":
                round(
                    grand_total,
                    2,
                ),

            "payment_method":
                (
                    payment_method
                    or "Cash On Delivery"
                ),

            "customer_name":
                customer_name,

            "customer_phone":
                customer_phone,

            "customer_address":
                customer_address,

            "status":
                "Preparing",

            "created_at":
                now_utc(),

        }
    )


    return jsonify(
        {
            "success": True,
            "message": (
                "Order placed successfully!"
            ),
            "order_id": str(
                result.inserted_id
            ),
            "grand_total": round(
                grand_total,
                2,
            ),
        }
    )


# ============================================================
# CUSTOMER MY ORDERS
# ============================================================

@app.route(
    "/api/orders",
    methods=["GET"],
)
@login_required
def api_my_orders():

    user_oid = oid(
        session.get(
            "user_id"
        )
    )

    if not user_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid user session."
                ),
            }
        ), 401


    db = get_database()

    orders = list(

        db.orders.find(
            {
                "user_id":
                    user_oid
            }
        ).sort(
            "created_at",
            -1,
        )

    )


    return jsonify(
        {
            "success": True,
            "orders": [

                serialize_order(
                    order
                )

                for order

                in orders

            ],
        }
    )


# ============================================================
# ADMIN RESTAURANT ORDERS
# ============================================================

@app.route(
    "/api/admin/orders",
    methods=["GET"],
)
@admin_required
def api_admin_orders():

    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    db = get_database()

    orders = list(

        db.orders.find(
            {
                "restaurant_id":
                    restaurant_id
            }
        ).sort(
            "created_at",
            -1,
        )

    )


    return jsonify(
        {
            "success": True,
            "orders": [

                serialize_order(
                    order
                )

                for order

                in orders

            ],
        }
    )


# ============================================================
# ADMIN UPDATE ORDER STATUS
# ============================================================

@app.route(
    "/api/admin/orders/<order_id>/status",
    methods=["PUT"],
)
@admin_required
def api_update_order_status(
    order_id
):

    order_oid = oid(
        order_id
    )

    if not order_oid:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid order ID."
                ),
            }
        ), 400


    restaurant_id = oid(
        session.get(
            "restaurant_id"
        )
    )

    db = get_database()


    order = (
        db.orders.find_one(
            {
                "_id": order_oid,
                "restaurant_id":
                    restaurant_id,
            }
        )
    )


    if not order:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Order not found in "
                    "your restaurant."
                ),
            }
        ), 404


    current_status = order.get(
        "status",
        "Preparing",
    )


    if (
        current_status
        not in ORDER_STATUS_FLOW
    ):

        next_status = (
            ORDER_STATUS_FLOW[0]
        )

    else:

        current_index = (
            ORDER_STATUS_FLOW.index(
                current_status
            )
        )

        if current_index < (
            len(
                ORDER_STATUS_FLOW
            )
            - 1
        ):

            next_status = (
                ORDER_STATUS_FLOW[
                    current_index + 1
                ]
            )

        else:

            next_status = (
                ORDER_STATUS_FLOW[-1]
            )


    db.orders.update_one(
        {
            "_id": order_oid,
            "restaurant_id":
                restaurant_id,
        },
        {
            "$set": {
                "status":
                    next_status,

                "updated_at":
                    now_utc(),
            }
        },
    )


    return jsonify(
        {
            "success": True,
            "status": next_status,
        }
    )


# ============================================================
# CONTACT
# ============================================================

@app.route(
    "/api/contact",
    methods=["POST"],
)
def api_contact():

    data = get_request_data()

    name = str(
        data.get("name") or ""
    ).strip()

    email = str(
        data.get("email") or ""
    ).strip().lower()

    message = str(
        data.get("message") or ""
    ).strip()


    if (
        not name
        or not email
        or not message
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Please fill all fields."
                ),
            }
        ), 400


    db = get_database()

    db.contact_messages.insert_one(
        {
            "name": name,
            "email": email,
            "message": message,
            "created_at": (
                now_utc()
            ),
        }
    )


    return jsonify(
        {
            "success": True,
            "message": (
                "Your message has been "
                "sent successfully!"
            ),
        }
    )


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def page_not_found(error):

    if request.path.startswith(
        "/api/"
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "API endpoint not found."
                ),
            }
        ), 404


    return render_template(
        "login.html"
    ), 404


@app.errorhandler(500)
def internal_server_error(error):

    print(
        "Internal Server Error:",
        error,
    )

    if request.path.startswith(
        "/api/"
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Internal server error."
                ),
            }
        ), 500


    return (
        "Internal Server Error",
        500,
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )