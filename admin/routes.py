from flask import render_template, session, request, flash, redirect, jsonify, url_for
from functools import wraps
from datetime import datetime
import os

from . import admin_bp
from .mysecurity import post_login, is_loggined
from .mydb import video_get, create_video, get_max_video_order, create_credits, video_delete, get_video_by_url, get_above_video, get_below_video, swap_orders
from .files import upload as files_upload
from .models import db as database


from tools import parse_credits_input

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_loggined():
            return redirect(url_for('admin.pro_login'))
        return f(*args, **kwargs)
    return decorated_function

# LOGIN

@admin_bp.get('/login')
def pro_login():
    if is_loggined():
        return redirect(url_for('admin.pro'))
    return render_template('admin/login.j2')

@admin_bp.post('/login')
def pro_login_post():
    if is_loggined():
        return redirect(url_for('admin.pro'))
    
    password = request.form.get('password')
    if post_login(password) == True:
        return redirect(url_for('admin.pro'))

    return render_template('admin/login.j2')

@admin_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    if is_loggined():
        session.pop('token', None)
        flash("YOU'RE NOT AN ADMIN NOW")

    return redirect(url_for('index'))

@admin_bp.get('/')
@login_required
def pro():
    videos = video_get()
    return render_template('admin/pro.j2', videos=videos)

@admin_bp.get('/add')
@login_required
def add():
    return render_template('admin/add.j2')

@admin_bp.post('/add')
@login_required
def video_add_post():
    try:
        url = request.form.get('url')
        title = request.form.get('title')
        description = request.form.get('description')
        is_featured = request.form.get('is_featured') == 'on'

        if not url:
            return jsonify({"error": "URL REQUIRED"}), 400
        if not title:
            return jsonify({"error": "TITLE REQUIRED"}), 400
        if not description:
            description = ''
        if not is_featured:
            is_featured = False

        preview = request.files.get('preview')
        video_file = request.files.get('video')

        if not video_file:
            return jsonify({"error": "VIDEO FILE REQUIRED"}), 400

        results = files_upload(url, preview, video_file)
        if not results:
            return jsonify({"error": "ERROR UPLOADING FILES"}), 400
        
        max_order = get_max_video_order()
        
        video = create_video(title, description, url, is_featured, max_order + 1)
        
        credits_single_input = request.form.get('credits_single_input')
        if credits_single_input:
            roles, names, favs = parse_credits_input(credits_single_input)
        else:
            roles = request.form.getlist("credit_roles[]")
            names = request.form.getlist("credit_names[]")
            favs = request.form.getlist("credit_is_fav[]")
            
        create_credits(video, roles, names, favs)

        database.session.commit()
        
        return jsonify({
            "success": True,
            "message": "VIDEO ADDED SUCCESSFULLY",
            "url": url
        }), 200
    except Exception as e:
        return jsonify({"error": f"INTERNAL SERVER ERROR: {str(e)}"}), 500

@admin_bp.get('/status/<string:url>')
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
            video = get_video_by_url(url)
            status["in_database"] = True
            status["video_id"] = video.id
        except:
            status["in_database"] = False
        
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({"error": f"Ошибка при проверке статуса: {str(e)}"}), 500

@admin_bp.post('/up/<string:link>')
@login_required
def move_video_up(link):
    video = get_video_by_url(link)
    if above_video := get_above_video(video):
        swap_orders(video, above_video)
        database.session.commit()
    return redirect(url_for('admin.pro'))

@admin_bp.post('/down/<string:link>')
@login_required
def move_video_down(link):
    video = get_video_by_url(link)
    if below_video := get_below_video(video):
        swap_orders(video, below_video)
        database.session.commit()
    return redirect(url_for('admin.pro'))

@admin_bp.post('/delete/<link>')
@login_required
def video_del(link):
    video_delete(link)
    flash('VIDEO DELETED')
    return redirect(url_for('admin.pro'))