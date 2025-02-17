from app import db
import json

class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True)
    coordinates = db.Column(db.Text)  # Stored as GeoJSON
    
    def set_coordinates(self, coords_list):
        self.coordinates = json.dumps(coords_list)
    
    def get_coordinates(self):
        return json.loads(self.coordinates)