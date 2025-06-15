# Website Visitor Geolocator 🌍


## Setup
1. Create and activate environment
    ```
    conda create -n visitor-geolocator python=3.12
    conda activate visitor-geolocator
    conda install conda-forge::gdal
    ```
2. Install dependencies
    ```
    pip install -r requirements.txt
    ```
3. Initialize database
    ```
    python manage.py migrate
    ```
4. Create a superuser
    ```
    python manage.py createsuperuser
    ```
5. Run the server or install the `visitor_geolocator` package using `pip install -e .`
    ```
    python manage.py runserver
    ```


## Code structure
- `example_app/` - a basic app to showcase the package
- `visitor_geolocator/` - the package
