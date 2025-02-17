
from flask import Blueprint, render_template, request, jsonify
from app.models import Area
from app import db
import requests
import os
from config import Config

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html', api_key=Config.ORS_API_KEY)

@main.route('/save_area', methods=['POST'])
def save_area():
    data = request.json
    name = data.get('name', 'Unnamed Area')
    coordinates = data.get('coordinates', [])
    
    area = Area(name=name)
    area.set_coordinates(coordinates)
    
    db.session.add(area)
    db.session.commit()
    
    return jsonify({'success': True, 'id': area.id})

@main.route('/get_areas', methods=['GET'])
def get_areas():
    areas = Area.query.all()
    result = []
    
    for area in areas:
        result.append({
            'id': area.id,
            'name': area.name,
            'coordinates': area.get_coordinates()
        })
    
    return jsonify(result)


@main.route('/get_route', methods=['POST'])
def get_route():
    data = request.json
    start = data.get('start')
    end = data.get('end')
    
    if not start or not end:
        return jsonify({'error': 'Start and end points are required'}), 400
    
    # Call OpenRouteService API for routing
    api_key = Config.ORS_API_KEY
    
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json; charset=utf-8'
    }
    
    body = {
        "coordinates": [start, end],
        "instructions": True,
        "format": "geojson"
    }
    
    try:
        response = requests.post(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            json=body,
            headers=headers
        )
        
        response_data = response.json()
        
        if response.status_code == 200:
            return response_data
        else:
            # Extract the error message
            error_message = "Failed to get route"
            if 'error' in response_data and 'message' in response_data['error']:
                error_message = response_data['error']['message']
            return jsonify({'error': error_message}), response.status_code
    except Exception as e:
        print(f"Exception in get_route: {str(e)}")
        return jsonify({'error': f'Exception: {str(e)}'}), 500


# from flask import Blueprint, render_template, request, jsonify
# from app.models import Area
# from app import db
# import requests
# import os
# from config import Config

# main = Blueprint('main', __name__)

# @main.route('/')
# def index():
#     return render_template('index.html', api_key=Config.ORS_API_KEY)

# @main.route('/save_area', methods=['POST'])
# def save_area():
#     data = request.json
#     name = data.get('name', 'Unnamed Area')
#     coordinates = data.get('coordinates', [])
    
#     area = Area(name=name)
#     area.set_coordinates(coordinates)
    
#     db.session.add(area)
#     db.session.commit()
    
#     return jsonify({'success': True, 'id': area.id})

# @main.route('/get_areas', methods=['GET'])
# def get_areas():
#     areas = Area.query.all()
#     result = []
    
#     for area in areas:
#         result.append({
#             'id': area.id,
#             'name': area.name,
#             'coordinates': area.get_coordinates()
#         })
    
#     return jsonify(result)

# @main.route('/get_route', methods=['POST'])
# def get_route():
#     data = request.json
#     start = data.get('start')
#     end = data.get('end')
    
#     if not start or not end:
#         return jsonify({'error': 'Start and end points are required'}), 400
        
#     # Call OpenRouteService API for routing
#     api_key = Config.ORS_API_KEY
    
#     headers = {
#         'Authorization': api_key,
#         'Content-Type': 'application/json; charset=utf-8'
#     }
    
#     body = {
#         "coordinates": [start, end],
#         "instructions": True,
#         "format": "geojson"
#     }
    
#     response = requests.post(
#         'https://api.openrouteservice.org/v2/directions/driving-car',
#         json=body,
#         headers=headers
#     )
    
#     if response.status_code == 200:
#         return response.json()
#     else:
#         return jsonify({'error': 'Failed to get route'}), 500
    

