import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const App = () => {
  const webcamRef = useRef(null);
  const [recognizedFaces, setRecognizedFaces] = useState([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Capture image and send for recognition
  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      console.error('No image captured');
      return;
    }

    try {
      setIsRecognizing(true);
      setIsLoading(true);

      // Convert base64 image to blob for sending to backend
      const formData = new FormData();
      formData.append('image', dataURItoBlob(imageSrc));

      // Send the image to the backend for recognition
      const response = await axios.post('http://127.0.0.1:5000/api/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const recognized = response.data.recognized_faces;

      if (recognized.length > 0) {
        const newFace = recognized[0];
        // Add the new recognized face to the state without removing the old ones
        setRecognizedFaces(prevFaces => [
          ...prevFaces,
          { name: newFace.name, timestamp: newFace.timestamp },
        ]);
      } else {
        // If no face is recognized, add an unknown entry
        setRecognizedFaces(prevFaces => [
          ...prevFaces,
          { name: 'Unknown', timestamp: 'No timestamp available' },
        ]);
      }

      setIsRecognizing(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error during recognition:', error);
      setIsRecognizing(false);
      setIsLoading(false);
    }
  };

  // Convert data URI (base64 image) to Blob
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([uintArray], { type: 'image/jpeg' });
  };

  // Function to start the automatic photo capture after 3 seconds
  const startAutoCapture = () => {
    setTimeout(() => {
      captureImage();
    }, 3000);  // 3 seconds delay
  };

  // Function to clear all recognized faces
  const clearAllFaces = () => {
    setRecognizedFaces([]);
  };

  // Function to print the recognized faces table
  const printTable = () => {
    const printContent = document.getElementById("recognized-faces-table").innerHTML;
    const newWindow = window.open();
    newWindow.document.write("<html><head><title>Recognized Faces</title></head><body>");
    newWindow.document.write(printContent);
    newWindow.document.write("</body></html>");
    newWindow.document.close();
    newWindow.print();
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="relative">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{
            facingMode: 'user',
          }}
        />

        {/* Display recognition status */}
        {isRecognizing && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-black opacity-50 flex justify-center items-center text-white">
            <p>Recognizing...</p>
          </div>
        )}

        {/* Display loading spinner */}
        {isLoading && !isRecognizing && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-black opacity-50 flex justify-center items-center text-white">
            <p>Loading...</p>
          </div>
        )}
      </div>

      <div className="ml-4 p-4 bg-white rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold">Recognition Result</h2>
        <table id="recognized-faces-table" className="mt-4 table-auto w-full">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {recognizedFaces.map((face, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{face.name}</td>
                <td className="border px-4 py-2">{face.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Buttons for clear and print */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={clearAllFaces}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Clear All
          </button>
          <button
            onClick={printTable}
            className="bg-green-500 text-white px-4 py-2 rounded-md"
          >
            Print Table
          </button>
        </div>
      </div>

      {/* Automatically start the photo capture when the component mounts */}
      <button
        onClick={startAutoCapture}
        className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md"
      >
        Start Auto Capture
      </button>
    </div>
  );
};

export default App;
