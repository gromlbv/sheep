from hashlib import sha256
import jwt

from flask import session
from datetime import datetime, timedelta
import time

secretkey = 'localtesting'


def myhash(message):
    message = message.encode()
    message = sha256(message)
    message = message.hexdigest()
    return message


def encode(user_id):
    iat = int(time.time())
    exp = int((datetime.now() + timedelta(weeks=2)).timestamp())
    encoded_jwt = jwt.encode(
        {
            'sub': user_id,
            'iat': iat,
            'exp': exp
        },
        secretkey,
        algorithm="HS256"
    )
    return encoded_jwt


def decode(token):
    try:
        payload = jwt.decode(
            token,
            secretkey,
            algorithms=["HS256"]
        )
        return payload['sub']
    except jwt.ExpiredSignatureError:
        print("Токен истёк")
    except jwt.InvalidTokenError:
        print("Недействительный токен")

    return None


def verify(token):
    try:
        jwt.decode(
            token,
            secretkey,
            algorithms=["HS256"]
        )
        return True
    except jwt.ExpiredSignatureError:
        return False
    
    except jwt.InvalidTokenError:
        return False

def is_loggined():
    if not 'token' in session:
        return False
    
    user_token = session['token']
    if verify(user_token) == True:
        return True
    
    session.pop('token', None)
    return False

def post_login(password):
    target_password = '6f435ef26f75e6e4624505fd9e09426806b90d6f7e7c51982cb092715dcf1ba0'

    if not password:
        raise ValueError('ERROR')

    print(password)
    password = myhash(password)
    print(password)
    if not target_password == password:
        raise ValueError("PASSWORD DOESN'T MATCH")

    token = encode(password)
    session['token'] = token

    return True