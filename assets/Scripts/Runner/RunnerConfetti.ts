import { _decorator, Color, Component, Node, Sprite, Vec3 } from 'cc';

const { ccclass } = _decorator;

type Particle = { node: Node; sprite: Sprite; vx: number; vy: number; spin: number; age: number; scale: number };

@ccclass('RunnerConfetti')
export class RunnerConfetti extends Component {
    private particles: Particle[] = [];
    private active = false;

    onLoad(): void {
        if (this.node.children.length < 50) throw new Error('RunnerConfetti needs 50 preplaced particle nodes');
        for (const node of this.node.children) {
            const sprite = node.getComponent(Sprite);
            if (!sprite) throw new Error(`Confetti particle ${node.name} needs Sprite`);
            node.active = false;
            this.particles.push({ node, sprite, vx: 0, vy: 0, spin: 0, age: 0, scale: 1 });
        }
    }

    burstFromSides(): void {
        this.active = true;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const left = i % 2 === 0;
            const angle = (left ? 25 : 155) + (Math.random() - 0.5) * 30;
            const speed = 12 + Math.random() * 8;
            const radians = angle * Math.PI / 180;
            p.vx = Math.cos(radians) * speed * 60;
            p.vy = Math.sin(radians) * speed * 60;
            p.spin = (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 250);
            p.age = 0;
            p.scale = 0.8 + Math.random() * 0.7;
            p.node.setPosition(left ? -310 : 310, -200 + Math.random() * 300, 0);
            p.node.setScale(p.scale, p.scale, 1);
            p.sprite.color = Color.WHITE;
            p.node.active = true;
        }
    }

    reset(): void {
        this.active = false;
        for (const p of this.particles) p.node.active = false;
    }

    update(dt: number): void {
        if (!this.active) return;
        let any = false;
        for (const p of this.particles) {
            if (!p.node.active) continue;
            p.age += dt;
            if (p.age >= 5) { p.node.active = false; continue; }
            any = true;
            const pos = p.node.position;
            p.vy -= 180 * dt;
            p.vx *= Math.pow(0.998, dt * 60);
            p.node.setPosition(pos.x + p.vx * dt, pos.y + p.vy * dt, pos.z);
            p.node.angle += p.spin * dt;
            const alpha = p.age < 3.5 ? 255 : Math.round(255 * (5 - p.age) / 1.5);
            p.sprite.color = new Color(255, 255, 255, Math.max(0, alpha));
        }
        this.active = any;
    }
}
