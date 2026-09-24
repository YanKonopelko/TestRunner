import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RunnerFinish')
export class RunnerFinish extends Component {
    @property(Node) leftTape: Node | null = null;
    @property(Node) rightTape: Node | null = null;
    @property(Node) leftRope: Node | null = null;
    @property(Node) rightRope: Node | null = null;

    private broken = false;
    private elapsed = 0;

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
    }

    reset(): void {
        this.broken = false;
        this.elapsed = 0;
        if (this.leftTape) this.leftTape.active = true;
        if (this.rightTape) this.rightTape.active = true;
        if (this.leftRope) this.leftRope.active = false;
        if (this.rightRope) this.rightRope.active = false;
    }

    update(dt: number): void {
        if (!this.broken || !this.leftRope || !this.rightRope) return;
        this.elapsed += dt;
        const amplitude = Math.exp(-this.elapsed * 2) * 35;
        this.leftRope.angle = Math.sin(this.elapsed * 11) * amplitude;
        this.rightRope.angle = -Math.sin(this.elapsed * 10 + 0.5) * amplitude;
    }
}
