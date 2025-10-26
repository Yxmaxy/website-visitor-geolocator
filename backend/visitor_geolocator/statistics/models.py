import json
from typing import Optional

from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import MultiPolygon


class LevelChoices(models.IntegerChoices):
    """
    Continent source: https://hub.arcgis.com/datasets/esri::world-continents/about
    Country source: https://hub.arcgis.com/datasets/esri::world-countries-generalized/about
    """

    CONTINENT = 0
    COUNTRY = 1


class Area(models.Model):
    name = models.CharField(max_length=255)
    geometry = gis_models.MultiPolygonField(srid=4326)
    level = models.IntegerField(choices=LevelChoices.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.name)

    @property
    def simplified_geometry(self) -> MultiPolygon:
        self.geometry: MultiPolygon

        if self.level == LevelChoices.CONTINENT:
            return self.geometry.simplify(0.1, preserve_topology=True)
        if self.level == LevelChoices.COUNTRY:
            return self.geometry.simplify(0.001, preserve_topology=True)
        return self.geometry.simplify(0.7, preserve_topology=True)

    @property
    def geojson_feature(self) -> Optional[dict]:
        if self.geometry and self.geometry.valid:
            simplified_geometry = self.simplified_geometry
            geojson_geometry: dict = json.loads(simplified_geometry.geojson)

            if (
                geojson_geometry
                and geojson_geometry.get("type")
                and geojson_geometry.get("coordinates")
            ):
                feature_data = {
                    "type": "Feature",
                    "properties": {
                        "name": self.name,
                        "level": self.level,
                    },
                    "geometry": geojson_geometry,
                }
                return feature_data
        return None
