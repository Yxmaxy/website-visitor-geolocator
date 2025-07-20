# Website Visitor Geolocator 🌍

This is a simple web app that allows you to track visitors to your website and get their geolocation data.

It consists of two main parts:
- `backend/` - the backend server (Django)
- `frontend/` - the frontend web app (React)

## Features
- Track visitors to your website
- Get their geolocation data
- Get notifications when new visitors arrive on the website.

## Setup

1. Run `./generate-env.sh` to generate the `.env` files for both the backend and the frontend.

### Backend

You can use the `backend/example_app/` as a reference for how to use the `visitor_geolocator` package.

You can also install the app as a package using for example `pip install -e .`. in your project.

To run the example app, do the following:
1. Change into the `backend/` directory
    ```
    cd backend/
    ```
2. Create and activate environment
    ```
    conda create -n visitor-geolocator python=3.12
    conda activate visitor-geolocator
    conda install conda-forge::gdal
    ```
3. Install dependencies
    ```
    pip install -r requirements.txt
    ```
4. Initialize the database (we are using SQLite for this example)
    ```
    python manage.py migrate
    ```
5. Create a superuser
    ```
    python manage.py createsuperuser
    ```
6. Run the server or install the `visitor_geolocator` package using `pip install -e .`
    ```
    python manage.py runserver
    ```

You can access the admin interface at `http://localhost:8000/admin/`.


### Frontend
1. Change into the `frontend/` directory
    ```
    cd frontend/
    ```
2. Install dependencies
    ```
    npm install
    ```
3. Run the server
    ```
    npm run dev
    ```

You can access the app at `http://localhost:5173/`.

#### Optional - test a notification on website visit

You can test a notification on website visit by running the following command:

```
python3 -m http.server 5500
```

Then access the website at `http://localhost:5500/website-example.html`.

When you visit the website, you should receive a notification.
