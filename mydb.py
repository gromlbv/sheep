from models import db, Video, Credit
import files

from sqlalchemy import desc
from sqlalchemy import func



def video_get():
    videos = Video.query.order_by(Video.order).all()
    return videos

def video_delete(url):
    video = Video.query.filter_by(url=url).first()
    if video:
        files.delete(video.url)
        db.session.delete(video)
        db.session.commit()
        return True
    return False
    

def get_max_video_order() -> int:
    return db.session.query(func.max(Video.order)).scalar() or 0

def create_video(title: str, description: str, url: str, is_featured: bool, order: int) -> Video:
    video = Video(title=title, description=description, url=url, credits=[], is_featured=is_featured, order=order)
    db.session.add(video)
    return video

def create_credits(video, roles, names, favs) -> None:
    checked_favs = set(i for i, fav in enumerate(favs) if fav == 'on')
    
    for i, (role, name) in enumerate(zip(roles, names)):
        if role and name:
            credit = Credit(
                role=role,
                name=name,
                is_fav=i in checked_favs,
                video=video
            )
            db.session.add(credit)

def get_video_by_url(url):
    return Video.query.filter_by(url=url).first_or_404()

def get_above_video(video):
    return (
        Video.query
        .filter(Video.order < video.order)
        .order_by(desc(Video.order))
        .first()
    )

def get_below_video(video):
    return (
        Video.query
        .filter(Video.order > video.order)
        .order_by(Video.order)
        .first()
    )

def swap_orders(video1, video2):
    video1.order, video2.order = video2.order, video1.order


def get_credits(video):
    credits = video.credits
    if not credits:
        return ""
    
    credit_lines = []
    for credit in credits:
        line = f"{credit.role}: {credit.name}"
        credit_lines.append(line)
    
    return "\\n".join(credit_lines)