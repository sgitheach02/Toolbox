
from flask import Flask
from flask_cors import CORS
from app.routes.scan import scan_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(scan_bp, url_prefix="/api/scan")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

