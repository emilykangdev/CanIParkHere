import geopandas as gpd
from shapely.geometry import Point

# Load at startup
rpz_data = gpd.read_file("data/rpz_areas_4326.geojson")
signs_data = gpd.read_file("data/parking_signs_4326.geojson")
categories_data = gpd.read_file("data/parking_categories_4326.geojson")

# Ensure coordinate systems match (important!)
rpz_data = rpz_data.to_crs(epsg=4326)
signs_data = signs_data.to_crs(epsg=4326)

print("RPZ bounds:", rpz_data.total_bounds)          # [minx, miny, maxx, maxy]
print("Invalid RPZ geometries:", rpz_data[~rpz_data.is_valid].shape[0])
print("Valid RPZ geometries: ", rpz_data[rpz_data.is_valid].shape[0])

rpz_data['geometry'] = rpz_data['geometry'].make_valid()
print("Invalid RPZ geometries after Buffer:", rpz_data[~rpz_data.is_valid].shape[0])

print("Signs bounds:", signs_data.total_bounds)
print("Categories bounds:", categories_data.total_bounds)

def get_rpz_zone(lat: float, lon: float):
    pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
    matching = rpz_data[rpz_data.geometry.intersects(pt)]
    return matching.to_dict("records")

def get_signs_nearby(lat: float, lon: float, radius_meters: float = 10):
    pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
    pt_proj = pt.to_crs(epsg=3857)  # For distance calc in meters
    signs_proj = signs_data.to_crs(epsg=3857)

    nearby = signs_proj[signs_proj.distance(pt_proj.iloc[0]) <= radius_meters]
    return nearby.to_crs(epsg=4326).to_dict("records")

def get_parking_category(lat: float, lon: float):
    pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
    matching = categories_data[categories_data.contains(pt)]
    return matching.to_dict("records")