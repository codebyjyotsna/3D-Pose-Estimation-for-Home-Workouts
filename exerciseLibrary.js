// Library defining ideal poses and thresholds for various exercises
const exerciseLibrary = {
    squats: {
        downAngle: 90,
        upAngle: 160,
        joint: 'knee',
        feedback: {
            down: 'Lower your hips for a deeper squat.',
            up: 'Great squat form! Stand tall.',
        },
    },
    pushups: {
        downAngle: 90,
        upAngle: 160,
        joint: 'elbow',
        feedback: {
            down: 'Lower your chest closer to the ground.',
            up: 'Push up strongly! Good form.',
        },
    },
    lunges: {
        downAngle: 90,
        upAngle: 160,
        joint: 'knee',
        feedback: {
            down: 'Keep your knee at a 90° angle.',
            up: 'Stand tall and keep balance.',
        },
    },
};

export default exerciseLibrary;
