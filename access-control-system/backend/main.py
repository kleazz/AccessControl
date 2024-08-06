import os
import string
import urllib
import uuid
import pickle
import datetime
import time
import shutil
import subprocess

import cv2
from fastapi import FastAPI, File, UploadFile, Form, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import starlette

ATTENDANCE_LOG_DIR = './logs'
DB_PATH = './db'
for dir_ in [ATTENDANCE_LOG_DIR, DB_PATH]:
    if not os.path.exists(dir_):
        os.mkdir(dir_)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
async def login(file: UploadFile = File(...)):
    file.filename = f"{uuid.uuid4()}.png"
    contents = await file.read()

    with open(file.filename, "wb") as f:
        f.write(contents)

   
    user_name, match_status = recognize(cv2.imread(file.filename))

    if match_status:
        epoch_time = time.time()
        date = time.strftime('%Y%m%d', time.localtime(epoch_time))
        with open(os.path.join(ATTENDANCE_LOG_DIR, f'{date}.csv'), 'a') as f:
            f.write(f'{user_name},{datetime.datetime.now()},IN\n')

    os.remove(file.filename)  # Clean up the saved image

    return {'user': user_name, 'match_status': match_status}

@app.post("/logout")
async def logout(file: UploadFile = File(...)):
    file.filename = f"{uuid.uuid4()}.png"
    contents = await file.read()

    # example of how you can save the file
    with open(file.filename, "wb") as f:
        f.write(contents)

    user_name, match_status = recognize(cv2.imread(file.filename))

    if match_status:
        # Check if user has already checked in today
        epoch_time = time.time()
        date = time.strftime('%Y%m%d', time.localtime(epoch_time))
        log_file = os.path.join(ATTENDANCE_LOG_DIR, f'{date}.csv')

        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = f.readlines()
            if any(user_name in log and 'IN' in log for log in logs):
                with open(log_file, 'a') as f:
                    f.write(f'{user_name},{datetime.datetime.now()},OUT\n')
            else:
                return {'error': 'User has not checked in yet'}
        else:
            return {'error': 'No check-in records found for today'}

    os.remove(file.filename)  # Clean up the saved image

    return {'user': user_name, 'match_status': match_status}

@app.post("/register_new_user")
async def register_new_user(file: UploadFile = File(...), text=None):
    file.filename = f"{uuid.uuid4()}.png"
    contents = await file.read()

    # Save the uploaded image
    with open(file.filename, "wb") as f:
        f.write(contents)

    # Check if user already exists
    new_user_image = cv2.imread(file.filename)
    new_user_embeddings = face_recognition.face_encodings(new_user_image)
    if len(new_user_embeddings) == 0:
        os.remove(file.filename)
        return {'error': 'No face detected in the image'}

    for db_file in os.listdir(DB_PATH):
        if db_file.endswith('.pickle') and db_file != 'height_data.pickle':
            with open(os.path.join(DB_PATH, db_file), 'rb') as f:
                data = pickle.load(f)
                existing_embeddings = data.get('embeddings')[0]
                face_match = face_recognition.compare_faces([existing_embeddings], new_user_embeddings[0])[0]
                if face_match:
                    os.remove(file.filename)
                    return {'registration_status': 409}

    # Copy the image to the DB_PATH folder with the specified filename
    shutil.copy(file.filename, os.path.join(DB_PATH, f'{text}.png'))

    # Extract face embeddings from the uploaded image
    embeddings = face_recognition.face_encodings(new_user_image)

    # Initialize data dictionary
    data = {}

    # Open the existing pickle file or create a new one if it doesn't exist
    pickle_file_path = os.path.join(DB_PATH, f'{text}.pickle')
    if os.path.exists(pickle_file_path):
        with open(pickle_file_path, 'rb') as f:
            data = pickle.load(f)

    # Load height data from height_data.pickle and merge with the existing data
    height_data_file_path = os.path.join(DB_PATH, 'height_data.pickle')
    if os.path.exists(height_data_file_path):
        with open(height_data_file_path, 'rb') as f:
            height_data = pickle.load(f)
            data['height'] = height_data

        # Delete height_data.pickle file
        os.remove(height_data_file_path)

    # Update embeddings data
    data['embeddings'] = embeddings

    # Save the merged data back into the pickle file
    with open(pickle_file_path, 'wb') as f:
        pickle.dump(data, f)
    
    # Print debug info
    print(file.filename, text)

    # Remove the uploaded image
    os.remove(file.filename)

    return {'registration_status': 200}

@app.post("/measure_height")
async def measure_height():
    ex_script = 'ex2.py'
    
    subprocess.run(['python', ex_script], check=True)
    
    return {'status': 'success'}
    
@app.get("/get_attendance_logs")
async def get_attendance_logs():
    filename = 'out.zip'
    shutil.make_archive(filename[:-4], 'zip', ATTENDANCE_LOG_DIR)
    return starlette.responses.FileResponse(filename, media_type='application/zip', filename=filename)

def recognize(img):
    # It is assumed there will be at most 1 match in the db

    embeddings_unknown = face_recognition.face_encodings(img)
    if len(embeddings_unknown) == 0:
        return 'no_persons_found', False
    else:
        embeddings_unknown = embeddings_unknown[0]

    match = False
    j = 0
    matched_user = None

    db_dir = sorted([j for j in os.listdir(DB_PATH) if j.endswith('.pickle') and j != 'height_data.pickle'])
    while not match and j < len(db_dir):
        path_ = os.path.join(DB_PATH, db_dir[j])

        with open(path_, 'rb') as file:
            data = pickle.load(file)

        embeddings = data.get('embeddings')[0]
        stored_height = data.get('height')

        print("Embeddings: ", embeddings)
        print("Stored Height:", stored_height)

        # Check if stored_height is not None
        if stored_height is not None:
            # Retrieve measured_height from height_data.pickle
            height_data_file_path = os.path.join(DB_PATH, 'height_data.pickle')
            if os.path.exists(height_data_file_path):
                with open(height_data_file_path, 'rb') as f:
                    measured_height = pickle.load(f)
                    print("Measured Height:", measured_height)
            else:
                print("Error: height_data.pickle not found.")
                return 'unknown_person', False

            print("Stored Height:", stored_height)

            face_match = face_recognition.compare_faces([embeddings], embeddings_unknown)[0]
            height_match = abs(stored_height - measured_height) <= 5  # Allow a tolerance of 5 cm

            if face_match and height_match:
                match = True
                matched_user = db_dir[j][:-7]
        else:
            # Handle missing or improperly formatted height data
            print("Error: Height data is missing or improperly formatted.")
            return 'unknown_person', False

        j += 1

    if match:
        return matched_user, True
    else:
        return 'unknown_person', False
