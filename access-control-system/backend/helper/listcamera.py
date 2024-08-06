import cv2

def list_available_cameras():
    # Iterate over camera indices starting from 0
    for i in range(10):  # You can adjust the range as needed
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if not cap.isOpened():
            print(f"Camera at index {i} is not available")
        else:
            # Read a frame to ensure camera is functioning
            ret, frame = cap.read()
            if ret:
                print(f"Camera at index {i} is available")
            else:
                print(f"Camera at index {i} is not functioning properly")
        # Release the camera
        cap.release()

# Call the function to list available cameras
list_available_cameras()