from flask import Flask
from flask import render_template, session, request, flash, redirect, jsonify, url_for, send_from_directory

import mydb as db
from models import create_app, create_tables
from models import db as database
from mysecurity import verify, decode, post_login, is_loggined
from files import upload 

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


@app.post('/pro/add')
@login_required
def video_add_post():
    url = request.form.get('url')
    title = request.form.get('title')
    description = request.form.get('description')
    is_featured = request.form.get('is_featured') == 'on'

    if not url:
        raise ValueError('NO URL')
    if not title:
        raise ValueError('NO TITLE')
    if not description:
        description = ''
    if not is_featured:
        is_featured = False

    preview = request.files['preview']
    background = request.files['background']
    highlight = request.files['highlight']
    video_file = request.files['video']

    upload(url, preview, background, highlight, video_file)
    
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
    return redirect(url_for('pro'))

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