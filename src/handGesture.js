const FRAME_MS = 1000 / 15;
const PINCH_ENTER = 0.35;
const PINCH_EXIT = 0.5;
const STALE_MS = 500;
const CANCELLED = Symbol('cancelled');
const clamp = value => Math.max(0, Math.min(1, value));

// Consumer callbacks must not prevent resource disposal (including during unmount).
function notify(callback, value) {
  try { callback?.(value); } catch (error) {
    console.error('Hand gesture callback failed:', error);
  }
}

function stopStream(stream) {
  for (const track of stream.getTracks()) {
    try { track.stop(); } catch { /* Still dispose the remaining tracks. */ }
  }
}

function closeModel(model) {
  try { model.close(); } catch { /* Cleanup is best effort and idempotent. */ }
}

function errorCode(error) {
  switch (error?.name) {
    case 'NotAllowedError': case 'SecurityError': return 'permission-denied';
    case 'NotFoundError': case 'DevicesNotFoundError': return 'camera-missing';
    case 'NotReadableError': case 'TrackStartError': return 'camera-unavailable';
    default: return 'initialization-failed';
  }
}

/**
 * Call only from an explicit camera-enable action. No camera access at import time.
 * onPoint({x, y, down}): mirrored index-tip position in [0, 1], y grows downward.
 * A final down:false is emitted on lost tracking, cleanup, or failure if pinched.
 * onStatus({state, code?, message?, error?}): state is requesting-camera, loading,
 * ready, tracking, searching, paused, stopped, or error. Errors resolve to an
 * already-disposed cleanup function rather than rejecting; onStatus is optional.
 * Pass an AbortSignal to cancel while awaiting startup, then call the returned
 * idempotent cleanup on React unmount. A browser permission prompt cannot itself
 * be cancelled; a stream granted after abort is stopped immediately on arrival.
 * All inference is local. WASM and model must be hosted at the paths below.
 */
export async function startHandGesture({ onPoint, onStatus, signal } = {}) {
  let stopped = false;
  let stream = null;
  let model = null;
  let video = null;
  let timer = null;
  let down = false;
  let lastPoint = null;
  let lastVideoTime = -1;
  let lastFrameAt = 0;
  let previousStatus = '';
  const removers = [];
  let cancelWait;
  const cancellation = new Promise(resolve => { cancelWait = resolve; });

  function status(state, details = {}) {
    if (previousStatus === state) return;
    previousStatus = state;
    notify(onStatus, { state, ...details });
  }

  function release() {
    if (!down) return;
    down = false;
    if (lastPoint) notify(onPoint, { ...lastPoint, down: false });
  }

  function dispose() {
    if (stopped) return false;
    stopped = true;
    cancelWait(CANCELLED);
    clearTimeout(timer);
    for (const remove of removers.splice(0)) remove();
    if (stream) { stopStream(stream); stream = null; }
    if (model) { closeModel(model); model = null; }
    if (video) {
      try { video.pause(); } catch { /* A partially initialized element is OK. */ }
      video.srcObject = null;
      video.remove();
      video = null;
    }
    release();
    return true;
  }

  function cleanup() {
    if (dispose()) status('stopped');
  }

  function fail(code, error) {
    if (dispose()) status('error', { code, message: error?.message || code, error });
  }

  function listen(target, name, callback) {
    target.addEventListener(name, callback);
    removers.push(() => target.removeEventListener(name, callback));
  }

  async function wait(promise) {
    const result = await Promise.race([promise, cancellation]);
    if (stopped || result === CANCELLED) throw CANCELLED;
    return result;
  }

  function readHand(landmarks) {
    const points = [landmarks?.[0], landmarks?.[4], landmarks?.[8], landmarks?.[9]];
    if (points.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
      release();
      if (!stopped) status('searching');
      return;
    }
    const [wrist, thumb, index, middle] = points;
    // Correct image aspect ratio before comparing distances in the image plane.
    const aspect = video.videoWidth / video.videoHeight;
    const distance = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
    const palm = distance(wrist, middle);
    if (palm < 0.015) {
      release();
      if (!stopped) status('searching');
      return;
    }
    const pinch = distance(thumb, index) / palm;
    down = down ? pinch < PINCH_EXIT : pinch <= PINCH_ENTER;
    const raw={x:clamp(1-(index.x+thumb.x)*.5),y:clamp((index.y+thumb.y)*.5)};
    // Pinch midpoint avoids the index-tip jump when fingers meet; filter jitter.
    const blend=lastPoint ? .48 : 1;
    lastPoint = {x:(lastPoint?.x??raw.x)+(raw.x-(lastPoint?.x??raw.x))*blend,y:(lastPoint?.y??raw.y)+(raw.y-(lastPoint?.y??raw.y))*blend};
    notify(onPoint, { ...lastPoint, down });
    if (!stopped) status('tracking');
  }

  function tick() {
    if (stopped) return;
    const now = performance.now();
    try {
      if (document.hidden) {
        release();
        if (!stopped) status('paused');
      } else if (video.readyState >= 2 && video.videoWidth > 0 &&
                 video.videoHeight > 0 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        lastFrameAt = now;
        const result = model.detectForVideo(video, now);
        readHand(result.landmarks?.[0]);
      } else if (now - lastFrameAt >= STALE_MS) {
        release();
        if (!stopped) status('searching');
      }
    } catch (error) {
      fail('inference-failed', error);
    }
    // Start-to-start interval is at least FRAME_MS; never process duplicate frames.
    if (!stopped) timer = setTimeout(tick, Math.max(0, FRAME_MS - (performance.now() - now)));
  }

  if (signal?.aborted) { cleanup(); return cleanup; }
  if (signal) listen(signal, 'abort', cleanup);

  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' ||
        !globalThis.navigator?.mediaDevices?.getUserMedia || !window.isSecureContext) {
      fail('unsupported', new Error('Camera access requires HTTPS or localhost and a supported browser.'));
      return cleanup;
    }
    listen(window, 'pagehide', cleanup);
    status('requesting-camera');
    if (stopped) return cleanup;
    // Attach ownership before racing abort: late resources always get disposed.
    await wait(navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 640 }, height: { ideal: 480 },
        frameRate: { ideal: 15, max: 30 },
      },
    }).then(acquired => {
      if (stopped) stopStream(acquired);
      else stream = acquired;
      return acquired;
    }));
    for (const track of stream.getVideoTracks()) {
      listen(track, 'ended', () => fail('camera-ended', new Error('The camera stream ended.')));
      listen(track, 'mute', release);
      if (track.readyState === 'ended') throw new Error('The camera stream already ended.');
    }
    video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    // Offscreen instead of display:none: some mobile browsers suspend hidden video.
    video.style.cssText = 'position:fixed;width:1px;height:1px;left:-10000px;top:0;opacity:0;pointer-events:none;';
    video.srcObject = stream;
    document.body.appendChild(video);
    listen(video, 'error', () => fail('video-failed', new Error('Camera video playback failed.')));
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        release();
        if (!stopped) status('paused');
      }
    });
    await wait(video.play());
    status('loading');
    if (stopped) return cleanup;
    const { FilesetResolver, HandLandmarker } = await wait(import('@mediapipe/tasks-vision'));
    const fileset = await wait(FilesetResolver.forVisionTasks('/vision/wasm'));
    await wait(HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/vision/hand_landmarker.task', delegate: 'CPU' },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    }).then(created => {
      if (stopped) closeModel(created);
      else model = created;
      return created;
    }));
    lastFrameAt = performance.now();
    status('ready');
    if (!stopped) tick();
  } catch (error) {
    if (error !== CANCELLED && !stopped) fail(errorCode(error), error);
  }
  return cleanup;
}
