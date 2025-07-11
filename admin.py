import os
import shutil
import click

@click.group()
def admin():
    pass

@admin.command()
def clear_all():
    # Delete instance folder
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    shutil.rmtree(instance_dir, ignore_errors=True)

    # Delete static directories
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    for dir_name in ['videos', 'backgrounds', 'highlights', 'previews']:
        dir_path = os.path.join(static_dir, dir_name)
        shutil.rmtree(dir_path, ignore_errors=True)


if __name__ == '__main__':
    admin()