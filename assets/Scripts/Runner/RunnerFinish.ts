import { _decorator, Color, Component, Graphics, Node, Sprite } from 'cc';

const { ccclass, property } = _decorator;

type RopePoint = { x: number; y: number; previousX: number; previousY: number };
const ROPE_SEGMENTS = 12;
const EDGE_COLOR = new Color(92, 62, 15, 255);
const TAPE_COLOR = new Color(246, 190, 61, 255);
const HIGHLIGHT_COLOR = new Color(255, 226, 116, 220);

@ccclass('RunnerFinish')
export class RunnerFinish extends Component {
    @property(Node) leftTape: Node | null = null;
    @property(Node) rightTape: Node | null = null;
    @property(Node) leftRope: Node | null = null;
    @property(Node) rightRope: Node | null = null;

    private broken = false;
    private elapsed = 0;
    private leftGraphics: Graphics | null = null;
    private rightGraphics: Graphics | null = null;
    private leftPoints: RopePoint[] = [];
    private rightPoints: RopePoint[] = [];

    onLoad(): void { this.reset(); }

    breakTape(): void {
        if (this.broken) return;
        if (!this.leftTape || !this.rightTape || !this.leftRope || !this.rightRope) {
            throw new Error('RunnerFinish tape and rope nodes must be assigned');
        }
        this.broken = true;
        this.elapsed = 0;
        this.leftTape.active = false;
        this.rightTape.active = false;
        this.leftRope.active = true;
        this.rightRope.active = true;
        this.leftGraphics = this.prepareRope(this.leftRope);
        this.rightGraphics = this.prepareRope(this.rightRope);
        // Start at the two intact tape angles, so the tear has no visual pop.
        this.leftPoints = this.createRope(78, -23, 1);
        this.rightPoints = this.createRope(84, 143, -1);
        this.drawRopes();
    }

    reset(): void {
        this.broken = false;
        this.elapsed = 0;
        this.leftPoints = [];
        this.rightPoints = [];
        if (this.leftTape) this.leftTape.active = true;
        if (this.rightTape) this.rightTape.active = true;
        if (this.leftRope) {
            this.leftRope.active = false;
            this.leftRope.getComponent(Graphics)?.clear();
            const sprite = this.leftRope.getComponent(Sprite);
            if (sprite) sprite.enabled = true;
        }
        if (this.rightRope) {
            this.rightRope.active = false;
            this.rightRope.getComponent(Graphics)?.clear();
            const sprite = this.rightRope.getComponent(Sprite);
            if (sprite) sprite.enabled = true;
        }
    }

    update(dt: number): void {
        if (!this.broken || !this.leftRope || !this.rightRope) return;
        const stepCount = Math.ceil(Math.min(dt, 0.05) * 60);
        if (stepCount === 0) return;
        const step = Math.min(dt, 0.05) / stepCount;
        for (let i = 0; i < stepCount; i++) {
            this.elapsed += step;
            this.advanceRope(this.leftPoints, 78, 1, step);
            this.advanceRope(this.rightPoints, 84, -1, step);
        }
        this.drawRopes();
    }

    private prepareRope(node: Node): Graphics {
        // The intact tape uses a sprite; the torn halves use flexible chains.
        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.enabled = false;
        node.angle = 0;
        node.setScale(1, 1, 1);
        return node.getComponent(Graphics) ?? node.addComponent(Graphics);
    }

    private createRope(length: number, angleDegrees: number, side: number): RopePoint[] {
        const angle = angleDegrees * Math.PI / 180;
        return Array.from({ length: ROPE_SEGMENTS + 1 }, (_, i) => {
            const t = i / ROPE_SEGMENTS;
            const x = Math.cos(angle) * length * t;
            const y = Math.sin(angle) * length * t;
            // The loose end recoils towards its post when the tape tears.
            return {
                x, y,
                previousX: x + side * 2.4 * t * t,
                previousY: y - 0.8 * t * t,
            };
        });
    }

    private advanceRope(points: RopePoint[], length: number, side: number, dt: number): void {
        const segmentLength = length / ROPE_SEGMENTS;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const x = point.x;
            const y = point.y;
            const tipWeight = i / ROPE_SEGMENTS;
            const wind = Math.sin(this.elapsed * 9 - tipWeight * 5) * 120 * tipWeight * side;
            point.x += (x - point.previousX) * 0.985 + wind * dt * dt;
            point.y += (y - point.previousY) * 0.985 - 900 * dt * dt;
            point.previousX = x;
            point.previousY = y;
        }

        // Distance constraints keep the tape length fixed but leave every joint
        // free to bend. Several passes stop the chain stretching on impact.
        for (let pass = 0; pass < 7; pass++) {
            points[0].x = 0;
            points[0].y = 0;
            for (let i = 1; i < points.length; i++) {
                const previous = points[i - 1];
                const point = points[i];
                const dx = point.x - previous.x;
                const dy = point.y - previous.y;
                const distance = Math.hypot(dx, dy) || segmentLength;
                const correction = (distance - segmentLength) / distance;
                if (i === 1) {
                    point.x -= dx * correction;
                    point.y -= dy * correction;
                } else {
                    previous.x += dx * correction * 0.5;
                    previous.y += dy * correction * 0.5;
                    point.x -= dx * correction * 0.5;
                    point.y -= dy * correction * 0.5;
                }
            }
        }
    }

    private drawRopes(): void {
        if (!this.leftGraphics || !this.rightGraphics) return;
        this.drawRope(this.leftGraphics, this.leftPoints);
        this.drawRope(this.rightGraphics, this.rightPoints);
    }

    private drawRope(graphics: Graphics, points: RopePoint[]): void {
        graphics.clear();
        this.strokeRope(graphics, points, 16, EDGE_COLOR);
        this.strokeRope(graphics, points, 11, TAPE_COLOR);
        this.strokeRope(graphics, points, 3, HIGHLIGHT_COLOR);
    }

    private strokeRope(graphics: Graphics, points: RopePoint[], width: number, color: Color): void {
        graphics.lineWidth = width;
        graphics.strokeColor = color;
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            const point = points[i];
            const next = points[i + 1];
            graphics.quadraticCurveTo(point.x, point.y, (point.x + next.x) * 0.5, (point.y + next.y) * 0.5);
        }
        const end = points[points.length - 1];
        graphics.lineTo(end.x, end.y);
        graphics.stroke();
    }
}
