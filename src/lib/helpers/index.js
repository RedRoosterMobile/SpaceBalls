export function r(min, max) {
    let diff = Math.random() * (max - min);
    return min + diff;
}


// animation functions
// TODO: create a bunch of them, give enemies types
// animate them , depending on type with a different function
function circularMovement(enemy, time) {
    const radius = 2;
    enemy.position.x = Math.sin(time) * radius;
    enemy.position.y -= 0.01;  // Constant downward movement
}

function sinusoidalMovement(enemy, time) {
    const amplitude = 2;
    const frequency = 0.1;
    enemy.position.x = Math.sin(time * frequency) * amplitude;
    enemy.position.y -= 0.01;  // Constant downward movement
}

function spiralMovement(enemy, time) {
    const radius = 2 + time * 0.1; // Spiral radius increases over time
    enemy.position.x = Math.sin(time) * radius;
    enemy.position.y = Math.cos(time) * radius - 0.01 * time; // Downward movement
}

function zigzagMovement(enemy, time) {
    const amplitude = 2;
    const frequency = 2; // Zigzag frequency
    enemy.position.x = Math.sin(time * frequency) * amplitude;
    enemy.position.y -= 0.02; // Constant downward movement
}
function ellipticalMovement(enemy, time) {
    const a = 2; // Major axis
    const b = 1; // Minor axis
    enemy.position.x = Math.sin(time) * a;
    enemy.position.y = Math.cos(time) * b - 0.01 * time; // Downward movement
}

// https://resources.pcb.cadence.com/blog/how-to-read-lissajous-curves-on-oscilloscopes
// https://chilledwilba.medium.com/how-to-make-gorgeous-lissajous-patterns-in-unity-easy-2f6423bbe045
// https://github.com/roryclaasen/lissajous-curve
// https://www.youtube.com/watch?v=DObrU30VZBg
// https://ninivert.github.io/Lissajous-Plotter/
// https://github.com/junshutang/Make-It-3D
function lissajousMovement(enemy, time) {
    const a = 3; // Frequency for X axis
    const b = 2; // Frequency for Y axis
    const delta = Math.PI / 2; // Phase shift
    enemy.position.x = Math.sin(a * time + delta);
    enemy.position.y = Math.sin(b * time) - 0.01 * time; // Downward movement
}


// ideas: https://github.com/danbz/art-and-code
// zach lieberman
// https://www.youtube.com/watch?v=bmztlO9_Wvo
// https://www.youtube.com/watch?v=dQKYao-daYw&list=PLYElE_rzEw_tN_lGjsx8uK85k-xZc4yrl
