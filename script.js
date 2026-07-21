const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const buttonContainer = document.getElementById('buttonContainer');
const bgMusic = document.getElementById('bgMusic');
const photoFrame = document.getElementById('photoFrame');

const mouse = { x: null, y: null, radius: 220 };
let flowerArray = [];
let particles = [];
let animationStage = 'idle';

document.body.classList.add('scrolling-locked');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    if (animationStage === 'floating') {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('touchmove', (e) => {
    if (animationStage === 'floating' && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

class Lily {
    constructor(startX = null, startY = null, isSpawned = false) {
        this.isSpawned = isSpawned;
        this.reset(startX, startY);
        if (!isSpawned) {
            this.y = Math.random() * canvas.height; 
        }
    }

    reset(startX = null, startY = null) {
        this.x = startX !== null ? startX + (Math.random() * 40 - 20) : Math.random() * canvas.width;
        this.y = startY !== null ? startY + (Math.random() * 40 - 20) : canvas.height + 60;
        
        this.targetSize = Math.random() * 20 + 18;
        this.size = this.isSpawned ? 0 : this.targetSize; 
        
        this.baseSpeedY = Math.random() * 0.8 + 0.4;
        this.speedY = this.baseSpeedY;
        this.speedX = Math.random() * 0.4 - 0.2;
        
        this.vx = 0; 
        this.vy = 0;
        
        this.petals = 6; 

        const isPink = Math.random() > 0.4;
        if (isPink) {
            this.hue = Math.random() * 20 + 330; 
            this.saturation = Math.random() * 30 + 70;
            this.lightness = Math.random() * 15 + 75;
        } else {
            this.hue = Math.random() * 20 + 40;
            this.saturation = Math.random() * 10 + 5;
            this.lightness = Math.random() * 10 + 90;
        }

        this.color = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
        const stripeLightness = isPink ? this.lightness - 20 : this.lightness - 15;
        this.stripeColor = `hsl(${this.hue}, ${this.saturation}%, ${stripeLightness}%)`;
        
        this.stamenColor = '#f59e0b';
        this.angle = Math.random() * Math.PI * 2;
        this.baseSpin = (Math.random() * 0.01 - 0.005);
        this.spin = this.baseSpin;
        this.isCaptured = false;
    }

    draw() {
        if (this.size <= 0.1) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        for (let i = 0; i < this.petals; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2) / this.petals * i);
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-this.size * 0.5, -this.size * 0.6, 0, -this.size * 1.5);
            ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.6, 0, 0);
            ctx.fill();

            ctx.strokeStyle = this.stripeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -this.size * 0.9);
            ctx.stroke();

            ctx.restore();
        }

        for (let i = 0; i < this.petals; i++) {
            ctx.save();
            ctx.rotate(((Math.PI * 2) / this.petals * i) + 0.5);
            
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(this.size * 0.2, -this.size * 0.3, this.size * 0.3, -this.size * 0.5);
            ctx.stroke();

            ctx.fillStyle = this.stamenColor;
            ctx.beginPath();
            ctx.arc(this.size * 0.3, -this.size * 0.5, this.size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();

        ctx.restore();
    }

    update() {
        if (this.size < this.targetSize) {
            this.size += 0.4;
        }

        this.spin = this.baseSpin;
        this.isCaptured = false;

        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                
                this.vx += Math.cos(angle) * force * 0.7;
                this.vy += Math.sin(angle) * force * 0.7;
                this.spin += (this.baseSpin > 0 ? 0.04 : -0.04) * force;

                if (distance < 35) {
                    this.isCaptured = true;
                }
            }
        }

        this.x += this.speedX + Math.sin(this.y * 0.008) * 0.15 + this.vx;
        this.y -= (this.speedY - this.vy);

        this.vx *= 0.88;
        this.vy *= 0.88;

        this.angle += this.spin;

        if (this.y < -60 || this.x < -60 || this.x > canvas.width + 60) {
            this.reset();
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 8 + 4;

        const isPink = Math.random() > 0.5;
        let hue, sat, light;
        if (isPink) {
            hue = Math.random() * 20 + 330; 
            sat = Math.random() * 20 + 80;
            light = Math.random() * 20 + 70;
        } else {
            hue = 0;
            sat = 0;
            light = Math.random() * 10 + 90;
        }
        this.color = `hsl(${hue}, ${sat}%, ${light}%)`;

        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.rotation = Math.random() * Math.PI;
        this.spin = Math.random() * 0.2 - 0.1;
        this.type = Math.random() > 0.4 ? 'petal' : 'spark';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        if (this.type === 'petal') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-this.size * 0.6, -this.size * 0.6, 0, -this.size * 1.5);
            ctx.quadraticCurveTo(this.size * 0.6, -this.size * 0.6, 0, 0);
            ctx.fill();
        } else {
            ctx.fillStyle = '#fff1f2';
            ctx.shadowColor = '#f472b6';
            ctx.shadowBlur = 10;
            ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        }
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; 
        this.rotation += this.spin;
        this.alpha -= this.decay;
    }
}

function triggerExplosion(targetX, targetY) {
    for (let i = 0; i < 140; i++) {
        particles.push(new Particle(targetX, targetY));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (animationStage === 'floating') {
        let caughtCount = 0;
        flowerArray.forEach(f => { if (f.isCaptured) caughtCount++; });

        if (caughtCount >= 10 && mouse.x !== null) {
            triggerExplosion(mouse.x, mouse.y);
            flowerArray.forEach(f => {
                if (f.isCaptured || Math.hypot(f.x - mouse.x, f.y - mouse.y) < mouse.radius) {
                    f.reset(null, canvas.height + 100);
                }
            });
        }
    }

    for (let i = flowerArray.length - 1; i >= 0; i--) {
        flowerArray[i].update();
        flowerArray[i].draw();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    if (animationStage === 'explosion' && particles.length === 0) {
        animationStage = 'floating';
    }

    requestAnimationFrame(animate);
}

playButton.addEventListener('click', () => {
    const rect = playButton.getBoundingClientRect();
    const x = rect.left + window.scrollX + rect.width / 2;
    const y = rect.top + window.scrollY + rect.height / 2;

    buttonContainer.classList.add('hidden');
    
    document.body.classList.remove('scrolling-locked');
    
    photoFrame.classList.remove('hidden');
    animationStage = 'explosion';
    
    flowerArray = Array.from({ length: 45 }, () => new Lily(null, null, true));
    triggerExplosion(x, y);

    bgMusic.play().catch(err => console.log("Audio playback held: ", err));
});

animate();