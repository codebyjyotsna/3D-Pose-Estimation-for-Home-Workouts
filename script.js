const video = document.getElementById('video');
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');

// Load the video stream from the webcam
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Draw keypoints on the canvas
function drawKeypoints(keypoints, minConfidence, ctx) {
    keypoints.forEach((keypoint) => {
        if (keypoint.score > minConfidence) {
            const { y, x } = keypoint.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });
}

// Draw skeleton connecting keypoints
function drawSkeleton(keypoints, minConfidence, ctx) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach(([from, to]) => {
        ctx.beginPath();
        ctx.moveTo(from.position.x, from.position.y);
        ctx.lineTo(to.position.x, to.position.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    });
}

// Main function to load PoseNet and process video frames
async function main() {
    const net = await posenet.load();
    output.innerText = 'PoseNet loaded. Ready to track your workout!';

    await setupCamera();
    video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    async function detectPose() {
        const pose = await net.estimateSinglePose(video, {
            flipHorizontal: false,
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        drawKeypoints(pose.keypoints, 0.5, ctx);
        drawSkeleton(pose.keypoints, 0.5, ctx);

        // Example feedback for squats
        const leftKnee = pose.keypoints.find((kp) => kp.part === 'leftKnee');
        const leftHip = pose.keypoints.find((kp) => kp.part === 'leftHip');
        const leftAnkle = pose.keypoints.find((kp) => kp.part === 'leftAnkle');

        if (leftKnee.score > 0.5 && leftHip.score > 0.5 && leftAnkle.score > 0.5) {
            const kneeAngle = Math.abs(
                Math.atan2(leftKnee.position.y - leftHip.position.y, leftKnee.position.x - leftHip.position.x) -
                Math.atan2(leftAnkle.position.y - leftKnee.position.y, leftAnkle.position.x - leftKnee.position.x)
            ) * (180 / Math.PI);

            if (kneeAngle > 160) {
                output.innerText = 'Great squat form!';
            } else if (kneeAngle < 90) {
                output.innerText = 'Lower your hips for a deeper squat.';
            } else {
                output.innerText = 'Adjust your squat form.';
            }
        }

        requestAnimationFrame(detectPose);
    }

    detectPose();
}

main();
