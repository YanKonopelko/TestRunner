import { _decorator, Color, Component, Node, Sprite, Vec3 } from 'cc';
import { RunnerAnimator } from './RunnerAnimator';

const { ccclass, property } = _decorator;

export type RunnerEntityKind = 'dollar' | 'paypal' | 'enemy' | 'cone' | 'finish';

@ccclass('RunnerEntity')
export class RunnerEntity extends Component {
    @property kind = 'dollar';
    @property tutorialPause = false;
    @property warning = false;

    private originalPosition = new Vec3();
    private originalScale = new Vec3();
    private pulseTime = 0;
    private collected = false;
    private warningNode: Node | null = null;
    private warningBackgroundNode: Node | null = null;
    private glowSprite: Sprite | null = null;

    onLoad(): void {
        if (!['dollar', 'paypal', 'enemy', 'cone', 'finish'].includes(this.kind)) {
            throw new Error(`Unknown RunnerEntity kind on ${this.node.name}: ${this.kind}`);
        }
        this.originalPosition.set(this.node.position);
        this.originalScale.set(this.node.scale);
        this.warningNode = this.node.getChildByName('Warning');
        this.warningBackgroundNode = this.node.getChildByName('WarningBackground');
        this.glowSprite = this.node.children[0].getComponent(Sprite);
        if (this.warningNode) this.warningNode.active = this.warning;
        if (this.warningBackgroundNode) this.warningBackgroundNode.active = this.warning;
    }

    reset(): void {
        this.node.setPosition(this.originalPosition);
        this.node.setScale(this.originalScale);
        this.node.active = true;
        this.collected = false;
        this.pulseTime = 0;
        if (this.warningNode) this.warningNode.active = this.warning;
        if (this.warningBackgroundNode) this.warningBackgroundNode.active = this.warning;
        this.getComponent(RunnerAnimator)?.play('enemy', true);
    }

    tick(dt: number): void {
        if (this.collected) return;
        if (this.kind === 'enemy') {
            const p = this.node.position;
            this.node.setPosition(p.x - 300 * dt, p.y, p.z);
        }
        if (this.kind === 'cone' && this.glowSprite) {
            this.pulseTime += dt * 3;
            const color = this.glowSprite.color;
            const alpha = Math.round(175 + (Math.sin(this.pulseTime) + 1) * 40);
            this.glowSprite.color = new Color(color.r, color.g, color.b, alpha);
        }
        if (this.kind === 'dollar' || this.kind === 'paypal') {
            this.pulseTime += dt * 0.5;
            const s = 0.95 + (Math.sin(this.pulseTime) + 1) * 0.05;
            this.node.setScale(this.originalScale.x * s, this.originalScale.y * s, 1);
            const p = this.node.position;
            this.node.setPosition(p.x, this.originalPosition.y + Math.sin(this.pulseTime * 2) * 5, p.z);
        }
        if (this.warningNode && this.warningNode.active) {
            const s = 1 + Math.sin(this.pulseTime * 2) * 0.1;
            this.warningNode.setScale(s, s, 1);
            this.warningBackgroundNode?.setScale(s, s, 1);
            this.pulseTime += dt;
        }
    }

    take(): void {
        this.collected = true;
        this.node.active = false;
    }

    get isCollected(): boolean { return this.collected; }
    isSpawned(distance: number, visibleWidth = 720): boolean {
        return distance >= this.originalPosition.x - Math.max(720, visibleWidth / 2 + 360);
    }
}
