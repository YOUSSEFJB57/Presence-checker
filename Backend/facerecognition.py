import cv2
import numpy as np
import face_recognition
import os
from flask import Flask, request, jsonify
from datetime import datetime
from flask_cors import CORS  # Import CORS for handling cross-origin requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (can be limited to specific origins if necessary)

# Path to known faces directory
path = r'C:\Users\janba\OneDrive\Bureau\facereco\faces'
images = []
classNames = []

# Load known faces and names
personsList = os.listdir(path)
for cl in personsList:
    curPersonn = cv2.imread(f'{path}/{cl}')
    if curPersonn is None:
        print(f"Warning: Could not read image {cl}")
    else:
        images.append(curPersonn)
        classNames.append(os.path.splitext(cl)[0])

# Function to encode faces
def findEncodings(images):
    encodeList = []
    for img in images:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encode = face_recognition.face_encodings(img)[0]
        encodeList.append(encode)
    return encodeList

encodeListKnown = findEncodings(images)
print('Encoding Complete.')

# Flask route for recognizing faces
@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    img = cv2.imdecode(np.frombuffer(image_file.read(), np.uint8), cv2.IMREAD_COLOR)

    # Resize and convert the image for face recognition
    imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

    # Detect faces in the image
    faceLocations = face_recognition.face_locations(imgS)
    encodeCurrentFrame = face_recognition.face_encodings(imgS, faceLocations)

    recognized_faces = []

    for encodeFace, faceLoc in zip(encodeCurrentFrame, faceLocations):
        matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        matchIndex = np.argmin(faceDis)

        if matches[matchIndex] and faceDis[matchIndex] < 0.6:  # Threshold for recognition
            name = classNames[matchIndex].upper()
        else:
            name = "UNKNOWN"

        # Add recognized face and timestamp to response
        recognized_faces.append({
            'name': name,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    print(f"Recognized Faces: {recognized_faces}")  # Debugging line
    return jsonify({'recognized_faces': recognized_faces})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Ensure it's accessible from any IP on the local network
