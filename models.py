from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from sqlalchemy.orm import Mapped, relationship
from sqlalchemy import desc, asc

import json

db = SQLAlchemy()

def migrate(app, db):
    Migrate(app, db)

def create_app(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
    app.config ["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    migrate(app, db)
    return app

def create_tables():
    db.create_all()


class Credit(db.Model):
    __tablename__ = 'credits'

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_fav = db.Column(db.Boolean, nullable=False, default=False, server_default='0')

    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'), nullable=False)
    video = db.relationship('Video', back_populates='credits')
    
    def __init__(self, role, name, is_fav, video):
        self.role = role
        self.name = name
        self.video = video
        self.is_fav = is_fav

class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(100), nullable=False, unique=True)
    credits = db.relationship('Credit', back_populates='video', cascade='all, delete-orphan')

    is_featured = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    order = db.Column(db.Integer)

    def __init__(self, title, description, url, credits=None, is_featured=False, order=None):
        self.title = title
        self.description = description
        self.url = url
        self.credits = credits or []
        self.is_featured = is_featured
        self.order = order