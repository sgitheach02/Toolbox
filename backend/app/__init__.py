# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
import os
import logging

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    CORS(app, origins=["http://localhost:3000"])
    
    # Configuration logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Enregistrement des blueprints
    from app.routes.reconnaissance import recon_bp
    from app.routes.exploitation import exploit_bp
    from app.routes.network import network_bp
    from app.routes.bruteforce import bruteforce_bp
    from app.routes.reports import reports_bp
    
    app.register_blueprint(recon_bp, url_prefix="/api/recon")
    app.register_blueprint(exploit_bp, url_prefix="/api/exploit")
    app.register_blueprint(network_bp, url_prefix="/api/network")
    app.register_blueprint(bruteforce_bp, url_prefix="/api/bruteforce")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    
    return app