# Optional local hand tracking assets

Only loaded after the user explicitly enables camera gestures.

- Runtime: @mediapipe/tasks-vision 1.0.1 (Apache-2.0), copied WASM support files from the installed package; package-lock.json pins the package.
- Model: Google MediaPipe Hand Landmarker float16, version 1.
- Source: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- Model SHA256: fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1
- Integration: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- Camera input stays in the browser. No recordings or image uploads are implemented.
- Runtime/model downloads are not part of the four mandatory scene-loading groups.
