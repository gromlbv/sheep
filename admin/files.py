import subprocess, os

from PIL import Image
from werkzeug.utils import secure_filename

import shutil 
import uuid

def convert_to_webp(file, url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{url}.webp")
    ext = os.path.splitext(secure_filename(file.filename))[1].lower()

    if ext in (".png", ".jpg", ".jpeg", ".bmp"):
        Image.open(file).convert("RGB").save(output_path, "WEBP")
    else:
        raise ValueError(f"Неподдерживаемый формат файла: {ext}")

    return output_path

def convert_to_mp4(file, url, output_dir, timeout=120):
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{url}.mp4")
    temp_path = os.path.join(output_dir, f"temp_{url}_{uuid.uuid4().hex}.input")

    with open(temp_path, "wb") as f:
        file.stream.seek(0)
        shutil.copyfileobj(file.stream, f)

    handbrake_paths = [
        "C:\\Program Files\\HandBrake\\HandBrakeCLI.exe",
        "/usr/bin/HandBrakeCLI",
        "/usr/local/bin/HandBrakeCLI"
    ]
    
    handbrake_cli = None
    for path in handbrake_paths:
        if os.path.exists(path):
            handbrake_cli = path
            break

    if not handbrake_cli:
        raise FileNotFoundError("HandBrakeCLI not found")

    process = None
    try:
        process = subprocess.Popen(
            [
                handbrake_cli,
                "--input", temp_path,
                "--output", output_path,
                "--format", "mp4",
                "--encoder", "x264",
                "--quality", "23",
                "--preset", "Very Fast 1080p30",
                "--audio", "aac",
                "--ab", "128",
                "--optimize"
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        process.wait(timeout=timeout)
        
        if os.path.exists(output_path):
            return output_path
        else:
            return None
    except:
        return None

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    

def upload(url, preview, video):
    results = {}
    
    if preview:
        try:
            results['preview'] = convert_to_webp(preview, url, "static/previews")
        except Exception as e:
            results['preview_error'] = str(e)
            
    if video:
        try:
            video_path = convert_to_mp4(video, url, "static/videos")
            if video_path:
                results['video'] = video_path
            else:
                return False
        except:
            return False

    return results
        

def delete(url):
    import time
    
    files_to_delete = [
        f"static/previews/{url}.webp",
        f"static/videos/{url}.mp4",
    ]

    deleted_files = []
    
    for file_path in files_to_delete:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted_files.append(file_path)
            except PermissionError:
                time.sleep(0.5)
                try:
                    os.remove(file_path)
                    deleted_files.append(file_path)
                except:
                    pass
            except Exception:
                pass

    return {"deleted_files": deleted_files, "count": len(deleted_files)}