from flask import Flask
from flask import render_template, session, request, flash, redirect, jsonify, url_for, send_from_directory
import os

import mydb as db
from models import create_app, create_tables
from models import db as database
from mysecurity import verify, decode, post_login, is_loggined
import files as files 

from tools import *

from functools import wraps
from datetime import datetime


app = Flask(__name__)
create_app(app)

app.secret_key = 'localtesting'


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_loggined():
            return redirect(url_for('pro_login'))
        return f(*args, **kwargs)
    return decorated_function



@app.get('/')
@app.get('/home')
@app.get('/index')
def index():
    videos = db.video_get()
    featured_videos = db.video_get()
    for video in videos:
        video.credits_text = db.get_credits(video)
        video.credits_simple = db.get_credits_simple(video)
    return render_template('index.html', videos=videos, featured_videos=featured_videos)



# ADMIN


@app.get('/pro')
@login_required
def pro():
    videos = db.video_get()
    return render_template('pro.html', videos=videos)

@app.get('/pro/add')
@login_required
def add():
    return render_template('add.html')

@app.get('/demo')
def demo():
    return render_template('demo.html')

@app.post('/pro/add')
@login_required
def video_add_post():
    try:
        url = request.form.get('url')
        title = request.form.get('title')
        description = request.form.get('description')
        is_featured = request.form.get('is_featured') == 'on'

        if not url:
            return jsonify({"error": "URL обязателен"}), 400
        if not title:
            return jsonify({"error": "Заголовок обязателен"}), 400
        if not description:
            description = ''
        if not is_featured:
            is_featured = False

        preview = request.files.get('preview')
        video_file = request.files.get('video')

        if not video_file:
            return jsonify({"error": "Видео файл обязателен"}), 400

        results = files.upload(url, preview, video_file)
        if not results:
            return jsonify({"error": "Ошибка при загрузке файлов"}), 400
        
        if 'error' in results:
            return jsonify({"error": results['error']}), 400
        
        max_order = db.get_max_video_order()
        
        video = db.create_video(title, description, url, is_featured, max_order + 1)
        
        credits_single_input = request.form.get('credits_single_input')
        if credits_single_input:
            roles, names, favs = parse_credits_input(credits_single_input)
        else:
            roles = request.form.getlist("credit_roles[]")
            names = request.form.getlist("credit_names[]")
            favs = request.form.getlist("credit_is_fav[]")
            
        db.create_credits(video, roles, names, favs)

        database.session.commit()
        
        return jsonify({
            "success": True,
            "message": "VIDEO SUCCESSFULLY ADDED",
            "url": url
        }), 200
    except Exception as e:
        return jsonify({"error": f"INTERNAL SERVER ERROR 2: {str(e)}"}), 500

@app.get('/pro/status/<string:url>')
@login_required
def check_status(url):
    try:
        video_path = f"static/videos/{url}.mp4"
        preview_path = f"static/previews/{url}.webp"
        
        status = {
            "url": url,
            "video_exists": os.path.exists(video_path),
            "preview_exists": os.path.exists(preview_path),
            "timestamp": datetime.now().isoformat()
        }
        
        if status["video_exists"]:
            status["video_size"] = os.path.getsize(video_path)
            status["video_size_mb"] = round(status["video_size"] / (1024 * 1024), 2)
        
        if status["preview_exists"]:
            status["preview_size"] = os.path.getsize(preview_path)
            status["preview_size_kb"] = round(status["preview_size"] / 1024, 2)
        
        try:
            video = db.get_video_by_url(url)
            status["in_database"] = True
            status["video_id"] = video.id
        except:
            status["in_database"] = False
        
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({"error": f"Ошибка при проверке статуса: {str(e)}"}), 500
        

@app.post('/pro/up/<string:link>')
@login_required
def move_video_up(link):
    video = db.get_video_by_url(link)
    if above_video := db.get_above_video(video):
        db.swap_orders(video, above_video)
        database.session.commit()
    return redirect(url_for('pro'))

@app.post('/pro/down/<string:link>')
@login_required
def move_video_down(link):
    video = db.get_video_by_url(link)
    if below_video := db.get_below_video(video):
        db.swap_orders(video, below_video)
        database.session.commit()
    return redirect(url_for('pro'))

@app.post('/pro/delete/<link>')
@login_required
def video_del(link):
    db.video_delete(link)
    flash('Видео удалено')
    return redirect(url_for('pro'))



# LOGIN


@app.get('/pro/login')
def pro_login():
    if is_loggined():
        return redirect(url_for('pro'))
    return render_template('login.html')

@app.post('/pro/login')
def pro_login_post():
    if is_loggined():
        return redirect(url_for('pro'))
    
    password = request.form.get('password')
    if post_login(password) == True:
        return redirect(url_for('pro'))

    return render_template('login.html')

@app.route('/pro/logout', methods=['POST', 'GET'])
def logout():
    if is_loggined():
        session.pop('token', None)
        flash("YOU'RE NOT AN ADMIN NOW")

    return redirect(url_for('index'))

if __name__ == "__main__":
    with app.app_context():
        create_tables()
    app.run(debug=True, port=5400, host='0.0.0.0')