import cv2

url = "http://192.168.1.3:8080/video"

cap = cv2.VideoCapture(url)

while True:
    ret, frame = cap.read()
    if not ret:
        print("reconnecting...")
        cap = cv2.VideoCapture(url)
        continue

    cv2.imshow("frame", frame)
    if cv2.waitKey(1) == 27:
        break