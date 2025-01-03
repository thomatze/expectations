const min_lines = 1;

const animationSpeed = 0.15; // 1.0=aus 0.25=normal

const enable_circle = true;
const enable_hist = true;
const enable_expectation = true;
const enable_buttons = true;
const enable_colors = true;

prob = "wahr"
num = "zahl"
num_display = "zahl_anzeige"

// ChatGPT Confetti
// Confetti colors and settings
let confettiParticles = []; // Array to hold confetti particles
const confettiCount = 1000;  // Number of confetti particles
let isConfettiActive = false; // Flag to control confetti animation
const colors = [
    "#CB9DF0", // lila
    "#F0C1E1", // pink
    "#FDDBBB", // orange
    "#FFF9BF", // gelb
    "#C6E7FF", // dunkelblau
    "#D4F6FF", // hellblau
    "#FFDDAE", // dunkel-orange
];


const max_lines = colors.length;

// Function to create confetti particles
function createConfetti() {
    for (let i = 0; i < confettiCount; i++) {
        confettiParticles.push({
            x: random(0, width),
            y: random(0, 2 * height / 3),
            size: random(5, 10),
            color: random(colors),
            speedY: random(3, 6),
            speedX: random(-1, 1)
        });
    }
}

// Function to draw and update confetti particles
function drawConfetti() {
    confettiParticles.forEach((particle, index) => {
        fill(particle.color);
        noStroke();
        ellipse(particle.x, particle.y, particle.size);

        // Update position
        particle.y += particle.speedY;
        particle.x += particle.speedX;

        // Remove particles that fall off-screen
        if (particle.y > height) {
            confettiParticles.splice(index, 1);
        }
    });

    // Stop confetti animation if particles are depleted
    if (confettiParticles.length === 0) {
        isConfettiActive = false;
    }
}


function createLine() {
    return {
        [prob]: createInput(),
        [num]: createInput(),
    };
}

// für Animation
function lerp(x, y, lam) {
    return x * (1 - lam) + y * lam;
}

class WVerteilung {

    constructor(w_liste) {
        this.w_liste = w_liste;
    }

    w_summe() {
        return this.w_liste.reduce((p1, [_x, p2]) => p1 + p2, 0);
    }

    // get_range() {
    //     const values = this.w_liste.map(([x, p]) => x);
    //     return [min(values), max(values)];
    // }

    expectation() {
        return this.w_liste.reduce((s1, [x, p]) => s1 + x * p, 0) / this.w_summe();
    }

    is_fair() {
        return Math.abs(this.expectation()) < 0.005;
    }

    shift(dv) {
        this.w_liste = this.w_liste.map(([x, p]) => [x + dv, p]);
    }


    step_target(target, lambda) {

        let step_size = 0;
        while (this.w_liste.length > target.w_liste.length) {
            this.w_liste.pop();
        }
        while (this.w_liste.length < target.w_liste.length) {
            this.w_liste.push([0.0, 0.0]);
        }


        this.w_liste = this.w_liste.map(([x, p], i) => {
            const [y, q] = target.w_liste[i];
            const new_x = lerp(x, y, lambda) || 0;
            const new_p = lerp(p, q, lambda) || 0;
            step_size += Math.abs(x - new_x) + Math.abs(p - new_p);
            return [new_x, new_p];
        });
        return step_size;
    }

    normalize() {
        const sum = this.w_summe();
        this.w_liste = this.w_liste.map(([x, p]) => [x, (p / sum) || 0]);
    }


}

class ZahlenListe {

    set_from_w_liste(w_liste) {
        while (this.line_arr.length > w_liste.length) {
            this.removeLine();
        }
        while (this.line_arr.length < w_liste.length) {
            this.addLine();
        }
        for (let i = 0; i < w_liste.length; i++) {
            const [x, p] = w_liste[i];
            const line = this.line_arr[i];
            //line[num].value(x.toFixed(3));
            //const line_vals = this.line_vals[i];
            //line_vals[0] = x;
            //line_vals[1] = p;
            line[num].value(x.toFixed(3).replace(".",","));
            line[prob].value(p.toFixed(3).replace(".",","));
        }
    }

    constructor(w_liste) {
        this.line_arr = Array();
        this.line_vals = Array();
        this.set_from_w_liste(w_liste);

        if (enable_buttons) {
            this.plusButton = createButton("+");
            this.plusButton.mousePressed(() => this.addLine());
            this.plusButton.addClass("plus");

            this.minusButton = createButton("-");
            this.minusButton.mousePressed(() => this.removeLine());
            this.minusButton.addClass("minus");

            this.normButton = createButton("norm");
            this.normButton.mousePressed(() => this.normalize());
            this.normButton.addClass("norm");
            this.fairButton = createButton("fair");
            this.fairButton.mousePressed(() => this.makeFair());
            this.fairButton.addClass("fair");
        }
    }

    normalize() {
        const wVert = new WVerteilung(this.getWListe());
        wVert.normalize();
        this.set_from_w_liste(wVert.w_liste);
    }

    makeFair() {
        const wVert = new WVerteilung(this.getWListe());
        const shift = (-1 * wVert.expectation()) || 0;
        wVert.shift(shift);
        this.set_from_w_liste(wVert.w_liste);
    }

    addLine() {
        if (this.line_arr.length < max_lines) {
            const lineNum = this.line_arr.length;
            const line = createLine();
            this.line_arr.push(line);
            line[prob].addClass("prob" + lineNum);
            line[num].addClass("num" + lineNum);
            this.line_vals.push([0, 0]);
        }
    }

    removeLine() {
        if (this.line_arr.length > min_lines) {
            let last_line = this.line_arr.pop();
            last_line[num].remove();
            last_line[prob].remove();
            this.line_vals.pop();
        }
    }

    render(x, y) {
        const dy = 25;
        const dx = 200;
        const l = this.line_arr.length;

        fill("black");
        textAlign('center');
        text("Zahl", x + 0.4 * dx, y - 20);
        text("Wahrscheinlichkeit", x + 1.4 * dx, y - 20);
        noFill();

        if (enable_buttons) {
            this.plusButton.position(x, y + dy * l);
            this.minusButton.position(x + 30, y + dy * l);
            this.normButton.position(x + dx+110, y + dy * l);
            this.fairButton.position(x + dx - 80, y + dy * l);
        }

        for (let i = 0; i < l; i++) {
            this.line_arr[i][num].position(x, y + dy * i);
            this.line_arr[i][prob].position(x + dx, y + dy * i);
            if (enable_colors) {
                this.line_arr[i][num].style("background-color", colors[i]);
            }
        }

        const w_vert = new WVerteilung(this.getWListe());
        const is_norm = abs(w_vert.w_summe() - 1.0) < 0.01; // allow for some slack
        const bg_valid_color = is_norm ? "white" : "red";
        for (let i = 0; i < l; i++) {
            this.line_arr[i][prob].style("background-color", bg_valid_color);
        }
        fill("black");
        const total_w_text=w_vert.w_summe().toFixed(2);
        const w_text=`Σ=${total_w_text}`
        textAlign('left');
        text(w_text, x +dx, y + dy*l+15);
        noFill()
    }

    update_values() {
        this.line_arr.forEach((line, i) => {
            const line_vals = this.line_vals[i];
            console.log("line", line);
            const val_inds = [[0, num], [1, prob]];
            for (let [ind, val] of val_inds) {
                try {
                    const num_eval = eval(line[val].value().replace(",", "."));
                    const num_val = Number(num_eval);
                    if (!isNaN(num_val)) {
                        console.log("setting val", val, num_val);
                        this.line_vals[i][ind] = num_val;
                    } else {
                        console.log("invalid val", val, num_val);
                    }
                } catch (e) {
                }
            }
        });

    }

    getWListe() {
        this.update_values();
        return this.line_vals;
        // return this.line_arr.map(
        //     line => [Number(line[num].value()), Number(line[prob].value())]
        // );
    }
}

function drawWheel(wVert, x, y, accProb) {
    const r = 200;


    for (let i = 0; i < wVert.w_liste.length; i++) {
        const entry = wVert.w_liste[i];
        const currCol = colors[i];

        const entryProb = entry[1];
        const startAngle = accProb * 2 * PI;
        const endAngle = (accProb + entryProb) * 2 * PI;
        accProb += entryProb;
        fill(currCol);
        arc(x, y, r, r, startAngle, endAngle);
        noFill();
    }

}

function drawHist(wVert, x, y) {
    const w = 800.0;
    const h = 300.0;

    //const [min_,max_]=wVert.get_range();
    const [min_, max_] = [-10.0, 10.0];
    const step = w / (max_ - min_);
    const zeroPos = -min_ / (max_ - min_);

    stroke("grey");
    line(x - step / 2, y, x + w + step / 2, y);
    line(x + zeroPos * w, y, x + zeroPos * w, y - h);
    noStroke();


    for (let i = 0; i < wVert.w_liste.length; i++) {

        const [val, p] = wVert.w_liste[i];
        const relPos = (val - min_) / (max_ - min_);

        fill(colors[i]);
        rect(x + relPos * w - step / 2, y, step, -p * h);
        fill("black");
        textAlign('center');
        text(val.toFixed(2), x + relPos * w, y + 10);
        noFill();

    }

    if (enable_expectation) {
        const exp = wVert.expectation();
        const relPos = (exp - min_) / (max_ - min_);
        const isFair = abs(exp - 0.00) < 0.005;
        const col = isFair ? "green" : "red";


        const [x1, y1] = [x + relPos * w, y];
        const [x2, y2] = [x + relPos * w - 25, y + 50];
        const [x3, y3] = [x + relPos * w + 25, y + 50];

        stroke(col);
        line(x1, y1, x2, y2);
        line(x2, y2, x3, y3);
        line(x3, y3, x1, y1);
        noStroke();

        fill(col);
        text(exp.toFixed(2), (x2 + x3) / 2, y2 - 5);
        noFill();
    }


}

let ZL;
let WData;


function getWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

// function getHeight() {
//     return Math.max(
//         document.body.scrollHeight,
//         document.documentElement.scrollHeight,
//         document.body.offsetHeight,
//         document.documentElement.offsetHeight,
//         document.documentElement.clientHeight
//     );
// }

let windowWidth;

function setup() {
    windowWidth = getWidth();
    //const canvas=document.getElementById('defaultCanvas0');
    createCanvas(windowWidth, 1000);
    textSize(14);
    ZL = new ZahlenListe([
        [-2, 0.1],
        [1, 0.3],
        [0, 0.5],
        [4, 0.1]
    ]);
    WData = new WVerteilung(ZL.getWListe());
    WData.normalize();
}

let startAngle = 0;

function draw() {
    background("#FBFBFB");
    startAngle += 0.000;
    ZL.render(windowWidth / 2 - 400, 100);
    const new_w_data = new WVerteilung(ZL.getWListe());
    new_w_data.normalize();
    const step_size = WData.step_target(new_w_data, animationSpeed);
    const dataChanged = Math.abs(step_size) > 0.0000001;
    if (enable_circle) {
        drawWheel(WData, windowWidth / 2 + 200, 200, startAngle);
    }
    if (enable_hist) {
        drawHist(WData, windowWidth / 2 - 400, 650.0);
    }
    if ((!isConfettiActive)) {
        if (WData.is_fair() && dataChanged) {
            createConfetti();
            isConfettiActive = true;
        }
    } else {
        drawConfetti();
    }

}
