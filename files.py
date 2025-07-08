import subprocess, os

from flask import abort
from PIL import Image
from werkzeug.utils import secure_filename



def convert_to_webp(file, url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{url}.webp")
    ext = os.path.splitext(secure_filename(file.filename))[1].lower()

    if ext in (".png", ".jpg", ".jpeg", ".bmp"):
        Image.open(file).convert("RGB").save(output_path, "WEBP")
    else:
        raise ValueError(f"Неподдерживаемый формат файла: {ext}")

    return output_path

def convert_to_mp4(file, url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{url}.mp4")
    temp_path = os.path.join(output_dir, f"temp_{url}.input")

    file.save(temp_path)

    subprocess.run([
        "ffmpeg", "-i", temp_path,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        output_path
    ], check=True)

    os.remove(temp_path)
    return output_path

def upload(url, preview, background, highlight, video):
    try:
        return {
            "preview": convert_to_webp(preview, url, "static/previews"),
            "background": convert_to_webp(background, url, "static/backgrounds"),
            "highlight": convert_to_webp(highlight, url, "static/highlights"),
            "video": convert_to_mp4(video, url, "static/videos"),
        }
    except Exception as e:
        return {"error": str(e)}



def delete(url):
    try:
        files_to_delete = [
            f"static/previews/{url}.webp",
            f"static/backgrounds/{url}.webp",
            f"static/videos/{url}.webp",
        ]

        deleted_files = []

        for file_path in files_to_delete:
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_files.append(file_path)

    except Exception as e:
        abort(500, description=f"Ошибка при удалении: {str(e)}")
