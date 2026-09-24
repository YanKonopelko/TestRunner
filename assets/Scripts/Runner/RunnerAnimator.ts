import { _decorator, Component, Sprite, SpriteFrame, Color } from 'cc';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('RunnerAnimator')
@requireComponent(Sprite)
export class RunnerAnimator extends Component {
    @property({ type: [SpriteFrame] }) idleFrames: SpriteFrame[] = [];
    @property({ type: [SpriteFrame] }) runFrames: SpriteFrame[] = [];
    @property({ type: [SpriteFrame] }) jumpFrames: SpriteFrame[] = [];
    @property({ type: [SpriteFrame] }) hurtFrames: SpriteFrame[] = [];
    @property({ type: [SpriteFrame] }) enemyFrames: SpriteFrame[] = [];

    private sprite!: Sprite;
    private state = '';
    private elapsed = 0;
    private frameIndex = 0;
    private playing = true;

    onLoad(): void {
        const sprite = this.getComponent(Sprite);
        if (!sprite) throw new Error('RunnerAnimator needs Sprite on the same node');
        this.sprite = sprite;
        this.play(this.enemyFrames.length ? 'enemy' : 'idle', true);
    }

    play(state: 'idle' | 'run' | 'jump' | 'hurt' | 'enemy', restart = false): void {
        if (this.state === state && !restart) {
            this.playing = true;
            return;
        }
        const frames = this.framesFor(state);
        if (!frames.length) throw new Error(`RunnerAnimator: missing ${state} frames on ${this.node.name}`);
        this.state = state;
        this.elapsed = 0;
        this.frameIndex = 0;
        this.playing = true;
        this.sprite.spriteFrame = frames[0];
    }

    stop(): void { this.playing = false; }
    resume(): void { this.playing = true; }

    setHurtFlash(on: boolean): void {
        this.sprite.color = on ? new Color(255, 80, 70, 255) : Color.WHITE;
    }

    update(dt: number): void {
        if (!this.playing || !this.state) return;
        const frames = this.framesFor(this.state);
        const fps = this.state === 'enemy' ? 12 : this.state === 'jump' ? 13.5 : this.state === 'hurt' ? 18 : 9;
        this.elapsed += dt;
        const next = Math.floor(this.elapsed * fps);
        const looping = this.state !== 'jump' && this.state !== 'hurt';
        const index = looping ? next % frames.length : Math.min(next, frames.length - 1);
        if (index !== this.frameIndex) {
            this.frameIndex = index;
            this.sprite.spriteFrame = frames[index];
        }
    }

    private framesFor(state: string): SpriteFrame[] {
        switch (state) {
            case 'idle': return this.idleFrames;
            case 'run': return this.runFrames;
            case 'jump': return this.jumpFrames;
            case 'hurt': return this.hurtFrames;
            case 'enemy': return this.enemyFrames;
            default: return [];
        }
    }
}
