import os
import json

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon

from visitor_geolocator.statistics.models import Area, LevelChoices


class Command(BaseCommand):
    help = "Import areas from a GeoJSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--override", action="store_true", help="Override existing areas"
        )

    def handle(self, *args, **options):
        if options["override"]:
            Area.objects.all().delete()

        self.import_areas(
            "countries.geojson",
            LevelChoices.COUNTRY,
            "COUNTRY",
        )
        self.import_areas(
            "continents.geojson",
            LevelChoices.CONTINENT,
            "CONTINENT",
        )

    def import_areas(self, geojson_file_name: str, level: int, name_variable: str):
        if level not in LevelChoices.values:
            self.stderr.write(self.style.ERROR(f"Invalid level: {level}"))
            return

        geojson_file_path = os.path.join(
            "visitor_geolocator", "statistics", "data", geojson_file_name
        )

        if not os.path.exists(geojson_file_path):
            self.stderr.write(
                self.style.ERROR(f"File does not exist: {geojson_file_path}")
            )
            return

        with open(geojson_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for feature in data["features"]:
            geometry = GEOSGeometry(json.dumps(feature["geometry"]))
            properties = feature["properties"]

            # Convert Polygon to MultiPolygon if needed
            if geometry.geom_type == "Polygon":
                geometry = MultiPolygon(geometry)

            Area.objects.create(
                name=properties.get(name_variable),
                geometry=geometry,
                level=level,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imported {len(data['features'])} areas for level {level}"
            )
        )
