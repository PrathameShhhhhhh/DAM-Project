"""
Reservoir Hydraulic & Structural Telemetry System - Flask REST API Backend
"""

import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# Add parent directory to python path
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

    client_side_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../client side"))

    @app.route("/")
    def serve_frontend():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/client/")
    @app.route("/client/<path:filename>")
    def serve_client_app(filename="index.html"):
        if os.path.exists(os.path.join(client_side_folder, filename)):
            return send_from_directory(client_side_folder, filename)
        return send_from_directory(client_side_folder, "index.html")

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Reservoir Hydraulic Telemetry Platform",
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
    print("===========================================================")
    print(" RESERVOIR TELEMETRY BACKEND ACTIVE")
    print(f" Running on http://{Config.HOST}:{Config.PORT}")
    print(f" Citizen App available at: http://{Config.HOST}:{Config.PORT}/client/")
    print("===========================================================")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
