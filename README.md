# FoodHub Backend (Python + Flask + MongoDB)

இது உங்க FoodHub frontend-ஐ **Python (Flask) + MongoDB** backend-உடன் இணைக்குது.
Fake `localStorage` login/cart/order logic போய், real MongoDB-ல data save ஆகும்.

## 1. Project Structure

```
foodhub/
├── app.py            # Flask app: page routes + REST API (MongoDB வெச்சு)
├── config.py          # MongoDB URI / secret key settings (env vars)
├── db.py               # MongoDB connection helper
├── requirements.txt
├── templates/           # உங்க existing HTML pages (design மாறல)
└── static/
    ├── css/
    ├── images/
    └── js/               # backend API call பண்ண மாதிரி update பண்ணப்பட்டது
```

## 2. MongoDB Install பண்ணுங்க (Windows)

1. Download பண்ணுங்க: https://www.mongodb.com/try/download/community
2. "MongoDB Community Server" install பண்ணுங்க (default settings-லேயே Next அடிச்சா போதும்)
3. Install ஆனதும், MongoDB ஒரு **Windows Service** ஆ automatic ஆ run ஆகும் (port 27017)
4. Verify பண்ண, Command Prompt-ல:
   ```powershell
   mongosh
   ```
   இது MongoDB shell-ஐ open பண்ணும். வேலை செஞ்சா MongoDB running ஆ இருக்கு அப்படின்னு அர்த்தம். `exit` பண்ணி வெளியே வாங்க.

> `mongosh` command not found-னு வந்தா, schema.sql கதை மாதிரி — MongoDB bin folder-ஐ PATH-ல add பண்ணனும் (usually `C:\Program Files\MongoDB\Server\<version>\bin`).

## 3. Python Dependencies Install பண்ணுங்க

```powershell
cd foodhub
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 4. App-ஐ Run பண்ணுங்க

```powershell
python app.py
```

இது இப்படி காட்டணும்:
```
Default admin created -> username: admin / password: admin123
Seeded default menu items into MongoDB.
* Running on http://127.0.0.1:5000
```

Browser-ல **http://localhost:5000** போங்க.

- **Admin Username:** `admin`
- **Admin Password:** `admin123`

## 5. MongoDB-ல Default Settings

`config.py`-ல default values:
```python
MONGO_URI = "mongodb://localhost:27017"
MONGO_DB  = "foodhub"
```

MongoDB **local ஆ, default port (27017)-ல** run ஆகுதுன்னா, எந்த change-உம் தேவையில்ல — நேரடியா `python app.py` run பண்ணிடலாம். (MySQL மாதிரி username/password create பண்ணி set பண்ண வேண்டிய அவசியம் இல்ல — MongoDB local install default ஆ **authentication இல்லாம** வரும்.)

MongoDB Atlas (cloud) அல்லது வேற username/password வெச்சு run பண்ணனும்னா:
```powershell
$env:MONGO_URI="mongodb://username:password@host:27017"
$env:MONGO_DB="foodhub"
python app.py
```

## 6. Data எப்படி Store ஆகுது (Collections)

MySQL "tables" மாதிரி, MongoDB-ல "**collections**" இருக்கும்:

| Collection | என்ன இருக்கும் |
|---|---|
| `users` | Registered customers (name, email, mobile, password hash) |
| `admins` | Admin account (default: admin/admin123) |
| `foods` | Menu items (name, category, price, image, etc.) |
| `orders` | ஒவ்வொரு order-உம் — items array embedded ஆவே இருக்கும் (SQL மாதிரி தனி `order_items` table தேவையில்ல) |
| `contact_messages` | Contact form messages |

## 7. Data-ஐ பாக்க (MongoDB Compass — GUI Tool, Recommended)

1. Download: https://www.mongodb.com/try/download/compass
2. Install பண்ணி open பண்ணுங்க
3. Connect பண்ணுங்க: `mongodb://localhost:27017`
4. Left side **"foodhub"** database click பண்ணுங்க — `users`, `foods`, `orders` etc collections Excel மாதிரி browse பண்ணலாம்

Terminal-லேயே பாக்கணும்னா:
```powershell
mongosh
use foodhub
db.users.find().pretty()
db.orders.find().pretty()
db.foods.find().pretty()
```

## 8. என்ன Wired Up ஆகி இருக்கு

| Page | Backend Behavior |
|---|---|
| `register.html` | `POST /api/register` — password hash பண்ணி `users` collection-ல save |
| `login.html` | `POST /api/login` — password verify, server session start |
| `menu.html` | `GET /api/foods` — MongoDB-ல இருந்து live menu |
| `cart.html` | Cart browser-ல (localStorage) இருக்கும், checkout வரைக்கும் |
| `payment.html` | `POST /api/orders` — order `orders` collection-ல save (items array-ஆ embed) |
| `orders.html` | `GET /api/orders` — logged-in user-ஓட own orders + live status |
| `admin_login.html` | `POST /api/admin/login` |
| `admin_dashboard.html` | `GET /api/admin/dashboard` — live stats |
| `add_food.html` | `POST /api/admin/foods` (image upload உடன்) |
| `edit_food.html` | `GET /api/foods`, `PUT/DELETE /api/admin/foods/<id>` |
| `view_orders.html` | `GET /api/admin/orders`, `PUT /api/admin/orders/<id>/status` |
| `contact.html` | `POST /api/contact` — `contact_messages` collection-ல save |

Ownership check எல்லாம் **server-side session** (cookie) வெச்சு தான் — localStorage flags UI-க்கு மட்டும், security-க்கு இல்ல.

## 9. Production Note

- `debug=True` production-ல use பண்ண வேண்டாம்
- Real WSGI server (gunicorn/waitress) use பண்ணுங்க
- Strong random `SECRET_KEY` set பண்ணுங்க
