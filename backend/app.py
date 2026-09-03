"""
Smart Dam Monitoring System - Flask REST API Backend (Person 3 Module)
"""

import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# Add root directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import Config
from backend.database import init_db
from backend.routes.sensor import sensor_bp
from backend.routes.prediction import prediction_bp
from backend.routes.alerts import alerts_bp
from backend.routes.settings import settings_bp

def create_app():
    """App Factory for Flask Backend Application."""
    app = Flask(__name__, static_folder="../", static_url_path="")
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing for all API endpoints
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLite Database Tables
    init_db()

    # Register API Blueprints
    app.register_blueprint(sensor_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(settings_bp)

    @app.route("/")
    def serve_frontend():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Dam Monitoring AI Pro Backend",
            "version": "1.0.0"
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"status": "error", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    print(f"===========================================================")
    print(f" 🌊 SMART DAM MONITORING SYSTEM BACKEND ACTIVE")
    print(f" 🚀 Running on http://{Config.HOST}:{Config.PORT}")
    print(f" ===========================================================")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
