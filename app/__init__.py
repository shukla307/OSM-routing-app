from flask import Flask
from flask_sqlalchemy import SQLAlchemy # type: ignore
from config import Config
import os

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    
    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    from app.routes import main
    app.register_blueprint(main)
    
    with app.app_context():
        db.create_all()
    
    return app



#
# 
# 
# 
# 
#  from flask import Flask
# from flask_sqlalchemy import SQLAlchemy 
# from config import Config
# import os

# db = SQLAlchemy()

# def create_app(config_class=Config):
#     app = Flask(__name__)
#     app.config.from_object(config_class)
    
#     db.init_app(app)
    
#     # Ensure instance folder exists
#     os.makedirs(app.instance_path, exist_ok=True)
    
#     from app.routes import main
#     app.register_blueprint(main)
    
#     with app.app_context():
#         db.create_all()
    
#     return app