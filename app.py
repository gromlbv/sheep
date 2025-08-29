from flask import Flask
from flask import render_template

from admin import admin_bp
from admin.models import create_app, create_tables
import admin.mydb as db

from env_service import getenv


app = Flask(__name__)
create_app(app)

app.secret_key = getenv('SECRET_KEY')
app.register_blueprint(admin_bp)


@app.get('/')
@app.get('/home')
@app.get('/index')
def index():
    videos = db.video_get()
    featured_videos = db.video_get
    for video in videos:
        video.credits_text = db.get_credits(video)
        video.credits_simple = db.get_credits_simple(video)
    return render_template('index.j2', videos=videos, featured_videos=featured_videos)


if __name__ == "__main__":
    with app.app_context():
        create_tables()
    app.run(debug=True, port=5400, host='0.0.0.0')