from django.db import models
from django.contrib.gis.db import models as gis_models


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
