import os
import subprocess
import cv2
import numpy as np
import imageio_ffmpeg

def create_seamless_clip():
    input_path = "frontend/public/original_raw_showcase.mp4"
    output_path = "frontend/public/satellite_earth_showcase.mp4"
    poster_path = "frontend/public/satellite_earth_poster.png"
    temp_output_path = "frontend/public/satellite_earth_showcase_temp.mp4"

    print(f"Reading frames from: {input_path}")
    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 60.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Strictly extract frames 0 to 110 (stationary camera, zero zoom)
    N = 111  # frames 0 .. 110
    raw_frames = []

    # Build 2D spatial mask to permanently eliminate all baked-in text and lines from the video
    # Left region: x < 550 completely blacked out, smooth cosine fade between 550 and 660
    mask_x = np.ones((width,), dtype=np.float32)
    for x in range(width):
        if x < 550:
            mask_x[x] = 0.0
        elif x < 660:
            mask_x[x] = 0.5 * (1.0 - np.cos(np.pi * (x - 550) / 110.0))
        else:
            mask_x[x] = 1.0

    # Top region: y < 55 completely blacked out, smooth cosine fade between 55 and 95
    mask_y = np.ones((height,), dtype=np.float32)
    for y in range(height):
        if y < 55:
            mask_y[y] = 0.0
        elif y < 95:
            mask_y[y] = 0.5 * (1.0 - np.cos(np.pi * (y - 55) / 40.0))
        else:
            mask_y[y] = 1.0

    mask_2d = (mask_y[:, None] * mask_x[None, :])[:, :, None]  # (height, width, 1)

    for i in range(N):
        ret, frame = cap.read()
        if not ret:
            break
        cleaned_frame = np.clip(frame.astype(np.float32) * mask_2d, 0, 255).astype(np.uint8)
        raw_frames.append(cleaned_frame)
    cap.release()
    
    print(f"Loaded and text-masked {len(raw_frames)} frames at {width}x{height}, {fps} fps")
    
    # Overlap window for cosine crossfade
    K = 24  # 0.4 seconds at 60 fps
    
    # 1. Generate blended transition frames (end dissolves into start)
    blended_frames = []
    for i in range(K):
        # Cosine / Hann easing: starts with derivative 0, ends with derivative 0
        alpha = 0.5 * (1.0 - np.cos(np.pi * (i + 0.5) / K))
        # Frame from end: N - K + i
        f_end = raw_frames[N - K + i].astype(np.float32)
        # Frame from start: i
        f_start = raw_frames[i].astype(np.float32)
        
        f_blend = (1.0 - alpha) * f_end + alpha * f_start
        blended_frames.append(np.clip(f_blend, 0, 255).astype(np.uint8))
    
    # 2. Middle frames: K to N - K - 1
    middle_frames = raw_frames[K : N - K]
    
    # 3. Assemble one complete seamless cycle
    single_cycle = blended_frames + middle_frames
    cycle_len = len(single_cycle)  # N - K = 87 frames (~1.45s)
    print(f"One seamless cycle length: {cycle_len} frames ({cycle_len / fps:.2f}s)")
    
    # 4. Repeat cycle 5 times (~7.25 seconds) for smooth browser playback
    num_repeats = 5
    full_sequence = single_cycle * num_repeats
    total_frames = len(full_sequence)
    print(f"Total video output: {total_frames} frames ({total_frames / fps:.2f}s)")
    
    # 5. Save the very first frame as the poster image
    cv2.imwrite(poster_path, full_sequence[0])
    print(f"Saved poster image: {poster_path}")
    
    # 6. Encode with ffmpeg using libx264, crf 18, yuv420p, faststart
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using ffmpeg: {ffmpeg_exe}")
    
    cmd = [
        ffmpeg_exe,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{width}x{height}",
        "-pix_fmt", "bgr24",
        "-r", str(int(round(fps))),
        "-i", "-",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        temp_output_path
    ]
    
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for idx, f in enumerate(full_sequence):
        proc.stdin.write(f.tobytes())
    
    stdout, stderr = proc.communicate()
    if proc.returncode != 0:
        print(f"FFmpeg error: {stderr.decode('utf-8', errors='ignore')}")
        return False
    
    # Replace the destination file atomically
    if os.path.exists(output_path):
        os.remove(output_path)
    os.rename(temp_output_path, output_path)
    
    file_size = os.path.getsize(output_path)
    print(f"Successfully generated seamless Earth clip: {output_path} ({file_size} bytes)")
    return True

if __name__ == "__main__":
    create_seamless_clip()
