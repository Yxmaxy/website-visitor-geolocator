# pylint: disable=line-too-long, broad-exception-caught

import json
import importlib.resources

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

        try:
            # Use importlib.resources to access the data file from the package
            with importlib.resources.files("visitor_geolocator.statistics").joinpath(
                "data", geojson_file_name
            ).open("r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stderr.write(
                self.style.ERROR(f"File does not exist: {geojson_file_name}")
            )
            return
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f"Error reading file {geojson_file_name}: {e}")
            )
            return

        for feature in data["features"]:
            try:
                geometry = GEOSGeometry(json.dumps(feature["geometry"]))
                properties: dict = feature["properties"]

                area_name = properties.get(name_variable)

                # skip unwanted areas
                if area_name in ["Antarctica"]:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Skipping {area_name} - it is not a country"
                        )
                    )
                    continue

                # validate geometry and attempt to repair if invalid
                if not geometry.valid:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Invalid geometry for {area_name} - attempting to repair..."
                        )
                    )
                    # try to repair the geometry using buffer(0) technique
                    try:
                        repaired_geometry = geometry.buffer(0)
                        if repaired_geometry.valid:
                            geometry = repaired_geometry
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"Successfully repaired geometry for {area_name}"
                                )
                            )
                        else:
                            self.stderr.write(
                                self.style.WARNING(
                                    f"Could not repair geometry for {area_name} - skipping"
                                )
                            )
                            continue
                    except Exception as repair_error:
                        self.stderr.write(
                            self.style.WARNING(
                                f"Could not repair geometry for {area_name}: {repair_error} - skipping"
                            )
                        )
                        continue

                # convert Polygon to MultiPolygon if needed
                if geometry.geom_type == "Polygon":
                    geometry = MultiPolygon(geometry)

                Area.objects.create(
                    name=area_name,
                    geometry=geometry,
                    level=level,
                )
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"Error processing feature for {properties.get(name_variable) if 'properties' in locals() else 'unknown'}: {e}"
                    )
                )
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imported {len(data['features'])} areas for level {level}"
            )
        )
