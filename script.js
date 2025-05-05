import exerciseLibrary from './exerciseLibrary.js';

const video = document.getElementById('video');
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const exerciseSelect = document.getElementById('exerciseSelect');

// Rep Counter Variables
let repCount = 0;
let inPosition = false;

// Load webcam video
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

// Voice feedback function
function speakFeedback(message) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);
}

// Calculate angles between three points
function calculateAngle(p1, p2, p3) {
    const angle =
        Math.abs(
            Math.atan2(p3.y - p2.y, p3.x - p2.x) -
            Math.atan2(p1.y - p2.y, p1.x - p2.x)
        ) *
        (180 / Math.PI);

    return angle > 180 ? 360 - angle : angle;
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

        const selectedExercise = exerciseLibrary[exerciseSelect.value];
        const joint = selectedExercise.joint;

        const jointKeypoints = {
            knee: {
                point1: pose.keypoints.find((kp) => kp.part === 'leftHip'),
                point2: pose.keypoints.find((kp) => kp.part === 'leftKnee'),
                point3: pose.keypoints.find((kp) => kp.part === 'leftAnkle'),
            },
            elbow: {
                point1: pose.keypoints.find((kp) => kp.part === 'leftShoulder'),
                point2: pose.keypoints.find((kp) => kp.part === 'leftElbow'),
                point3: pose.keypoints.find((kp) => kp.part === 'leftWrist'),
            },
        };

        const points = jointKeypoints[joint];
        if (points.point1.score > 0.5 && points.point2.score > 0.5 && points.point3.score > 0.5) {
            const angle = calculateAngle(
                points.point1.position,
                points.point2.position,
                points.point3.position
            );

            if (angle < selectedExercise.downAngle && !inPosition) {
                inPosition = true;
                speakFeedback(selectedExercise.feedback.down);
            }

            if (angle > selectedExercise.upAngle && inPosition) {
                inPosition = false;
                repCount++;
                output.innerText = `Reps: ${repCount}`;
                speakFeedback(selectedExercise.feedback.up);
            }
        }

        requestAnimationFrame(detectPose);
    }

    detectPose();
}

main();
