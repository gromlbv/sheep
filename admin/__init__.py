from flask import Blueprint

# admin_bp = admin blueprint
# /pro/ - admin page
# /pro/login - login page
# /pro/add - add video page

admin_bp = Blueprint('admin', __name__, url_prefix='/pro')

from . import routes