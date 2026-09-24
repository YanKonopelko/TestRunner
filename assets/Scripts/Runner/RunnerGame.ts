import {
    _decorator, AudioSource, Component, Game, game, input, Input, Label, Node,
    Sprite, SpriteFrame, UITransform, Vec3, view, tween,
} from 'cc';
import { RunnerAnimator } from './RunnerAnimator';
import { RunnerConfetti } from './RunnerConfetti';
import { RunnerEntity } from './RunnerEntity';
import { RunnerFinish } from './RunnerFinish';
import { RunnerParallax } from './RunnerParallax';

const { ccclass, property } = _decorator;
type RunState = 'intro' | 'running' | 'tutorial' | 'winning' | 'win' | 'lose' | 'end';

@ccclass('RunnerGame')
export class RunnerGame extends Component {
    @property(Node) playerNode: Node | null = null;
    @property(Node) spawnRoot: Node | null = null;
    @property(Node) parallaxNode: Node | null = null;
    @property(Node) introPrompt: Node | null = null;
    @property(Node) jumpPrompt: Node | null = null;
    @property(Node) footerPortrait: Node | null = null;
    @property(Node) footerLandscape: Node | null = null;
    @property(Node) failOverlay: Node | null = null;
    @property(Node) endOverlay: Node | null = null;
    @property(Node) dimOverlay: Node | null = null;
    @property(Node) confettiNode: Node | null = null;
    @property(Node) flyingDollar: Node | null = null;
    @property(Node) flyingPayPal: Node | null = null;
    @property(Node) praiseNode: Node | null = null;
    @property(Node) lightsNode: Node | null = null;
    @property(Node) endCardNode: Node | null = null;
    @property(Node) audioRoot: Node | null = null;
    @property(Node) footerButton: Node | null = null;
    @property(Node) endButton: Node | null = null;

    @property(Label) heartsLabel: Label | null = null;
    @property(Label) scoreLabel: Label | null = null;
    @property(Label) endTitleLabel: Label | null = null;
    @property(Label) endSubtitleLabel: Label | null = null;
    @property(Label) endAmountLabel: Label | null = null;
    @property(Label) countdownLabel: Label | null = null;
    @property(Label) praiseLabel: Label | null = null;

    @property baseSpeed = 600;
    @property jumpHeight = 300;
    @property jumpDuration = 0.8;
    @property maxHealth = 3;

    private player!: Node;
    private spawns!: Node;
    private animator!: RunnerAnimator;
    private parallax!: RunnerParallax;
    private confetti!: RunnerConfetti;
    private entities: RunnerEntity[] = [];
    private audio = new Map<string, AudioSource>();
    private state: RunState = 'intro';
    private hp = 3;
    private score = 0;
    private distance = 0;
    private speed = 600;
    private jumping = false;
    private jumpElapsed = 0;
    private groundY = -360;
    private invincible = 0;
    private tutorialTriggered = false;
    private jumpingEnabled = false;
    private finishTriggered = false;
    private collectedCount = 0;
    private nextPraiseAt = 3;
    private endCountdown = 60;
    private endCountValue = 0;
    private endCountElapsed = 0;
    private endTargetValue = 0;
    private hiddenPause = false;
    private stepElapsed = 0;

    start(): void {
        this.player = this.required(this.playerNode, 'Player');
        this.spawns = this.required(this.spawnRoot, 'Spawns');
        this.animator = this.required(this.player.getComponent(RunnerAnimator), 'Player Animator');
        this.parallax = this.required(this.required(this.parallaxNode, 'Parallax').getComponent(RunnerParallax), 'Parallax component');
        this.confetti = this.required(this.required(this.confettiNode, 'Confetti').getComponent(RunnerConfetti), 'Confetti component');
        this.groundY = this.player.position.y;
        this.entities = this.spawns.children.map(n => this.required(n.getComponent(RunnerEntity), `RunnerEntity on ${n.name}`));
        if (this.entities.length !== 40) throw new Error(`Runner scene needs 40 preplaced entities, found ${this.entities.length}`);
        for (const name of ['jump', 'hit', 'hurt', 'collect', 'step', 'win', 'lose', 'music']) {
            const node = this.required(this.required(this.audioRoot, 'Audio').getChildByName(name), `Audio/${name}`);
            this.audio.set(name, this.required(node.getComponent(AudioSource), `${name} AudioSource`));
        }
        this.required(this.footerButton, 'Footer Button').on(Node.EventType.TOUCH_END, this.toStore, this);
        this.required(this.endButton, 'End Button').on(Node.EventType.TOUCH_END, this.toStore, this);
        input.on(Input.EventType.TOUCH_START, this.handleTap, this);
        input.on(Input.EventType.MOUSE_DOWN, this.handleTap, this);
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);
        this.restart();
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.handleTap, this);
        input.off(Input.EventType.MOUSE_DOWN, this.handleTap, this);
        game.off(Game.EVENT_HIDE, this.onHide, this);
        game.off(Game.EVENT_SHOW, this.onShow, this);
    }

    restart(): void {
        this.unscheduleAllCallbacks();
        this.state = 'intro';
        this.hp = this.maxHealth;
        this.score = 0;
        this.distance = 0;
        this.speed = this.baseSpeed;
        this.jumping = false;
        this.jumpElapsed = 0;
        this.invincible = 0;
        this.tutorialTriggered = false;
        this.jumpingEnabled = false;
        this.finishTriggered = false;
        this.collectedCount = 0;
        this.nextPraiseAt = 3;
        this.endCountdown = 60;
        this.endCountElapsed = 0;
        this.endCountValue = 0;
        this.stepElapsed = 0;
        this.player.setPosition(this.player.position.x, this.groundY, 0);
        this.animator.play('idle', true);
        this.animator.setHurtFlash(false);
        this.spawns.setPosition(0, 0, 0);
        this.parallax.reset();
        for (const entity of this.entities) entity.reset();
        this.confetti.reset();
        this.required(this.introPrompt, 'Intro Prompt').active = true;
        this.required(this.jumpPrompt, 'Jump Prompt').active = false;
        this.required(this.failOverlay, 'Fail Overlay').active = false;
        this.required(this.endOverlay, 'End Overlay').active = false;
        this.required(this.dimOverlay, 'Dim Overlay').active = false;
        this.required(this.flyingDollar, 'Flying Dollar').active = false;
        this.required(this.flyingPayPal, 'Flying PayPal').active = false;
        this.required(this.praiseNode, 'Praise').active = false;
        this.updateFooter();
        this.updateHud();
        this.endAmountLabel!.string = '$0.00';
        this.countdownLabel!.string = '01:00';
        this.audio.get('music')?.stop();
    }

    private handleTap(): void {
        if (this.hiddenPause) return;
        switch (this.state) {
            case 'intro':
                this.state = 'running';
                this.introPrompt!.active = false;
                this.animator.play('run');
                this.audio.get('music')!.play();
                break;
            case 'tutorial':
                this.state = 'running';
                this.jumpPrompt!.active = false;
                for (const entity of this.entities) {
                    if (entity.kind === 'enemy') entity.getComponent(RunnerAnimator)?.resume();
                }
                this.animator.play('run');
                this.jumpingEnabled = true;
                this.jump();
                break;
            case 'running':
                if (this.jumpingEnabled && !this.jumping && !this.finishTriggered) this.jump();
                break;
        }
    }

    private jump(): void {
        this.jumping = true;
        this.jumpElapsed = 0;
        this.animator.play('jump', true);
        this.playSound('jump');
    }

    update(dt: number): void {
        if (this.hiddenPause) return;
        this.updateJump(dt);
        this.updateHurt(dt);
        this.updateEnd(dt);
        this.updateFooter();
        if (this.state !== 'running' && this.state !== 'winning') return;

        if (this.state === 'running' && !this.jumping) {
            this.stepElapsed += dt;
            if (this.stepElapsed >= 0.42) {
                this.stepElapsed %= 0.42;
                this.playSound('step');
            }
        } else {
            this.stepElapsed = 0;
        }

        if (this.state === 'winning') {
            this.speed *= Math.pow(0.9, dt * 60);
            if (this.speed < 10) {
                this.speed = 0;
                this.state = 'win';
                this.scheduleOnce(() => this.showEnd(true), 0.5);
            }
        }
        const move = this.speed * dt;
        this.distance += move;
        this.spawns.setPosition(-this.distance, 0, 0);
        this.parallax.scroll(move);
        for (const entity of this.entities) {
            if (entity.node.active && entity.isSpawned(this.distance)) entity.tick(dt);
        }
        if (!this.tutorialTriggered && this.state === 'running') this.checkTutorial();
        if (this.state === 'running' || this.state === 'winning') {
            this.checkCollectibles();
            this.checkHazards();
            this.checkFinish();
        }
    }

    private updateJump(dt: number): void {
        if (!this.jumping) return;
        this.jumpElapsed += dt;
        const progress = Math.min(1, this.jumpElapsed / this.jumpDuration);
        const y = this.groundY + Math.sin(progress * Math.PI) * this.jumpHeight;
        this.player.setPosition(this.player.position.x, y, 0);
        if (progress >= 1) {
            this.jumping = false;
            this.player.setPosition(this.player.position.x, this.groundY, 0);
            if (this.state === 'running') this.animator.play('run');
        }
    }

    private updateHurt(dt: number): void {
        if (this.invincible <= 0) return;
        this.invincible = Math.max(0, this.invincible - dt);
        this.animator.setHurtFlash(this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0);
        if (this.invincible === 0 && this.state === 'running' && !this.jumping) this.animator.play('run');
    }

    private checkTutorial(): void {
        const enemy = this.entities.find(e => e.tutorialPause);
        if (!enemy || !enemy.isSpawned(this.distance)) return;
        if (this.screenX(enemy) - this.player.position.x > 300) return;
        this.tutorialTriggered = true;
        this.state = 'tutorial';
        this.animator.play('idle');
        for (const entity of this.entities) {
            if (entity.kind === 'enemy') entity.getComponent(RunnerAnimator)?.stop();
        }
        this.jumpPrompt!.active = true;
    }

    private checkCollectibles(): void {
        const px = this.player.position.x;
        const py = this.player.position.y + 85;
        for (const entity of this.entities) {
            if (!entity.node.active || !entity.isSpawned(this.distance) || (entity.kind !== 'dollar' && entity.kind !== 'paypal')) continue;
            const dx = this.screenX(entity) - px;
            const dy = entity.node.position.y - py;
            const nearestX = Math.max(-22, Math.min(22, dx));
            const nearestY = Math.max(-65, Math.min(65, dy));
            if (Math.hypot(dx - nearestX, dy - nearestY) >= 60) continue;
            const amount = entity.kind === 'dollar' ? 20 : 5 + Math.floor(Math.random() * 46);
            this.score += amount;
            this.collectEffect(entity);
            entity.take();
            this.playSound('collect');
            this.updateHud();
            this.collectedCount++;
            if (this.collectedCount >= this.nextPraiseAt) {
                this.showPraise();
                this.collectedCount = 0;
                this.nextPraiseAt = 3 + Math.floor(Math.random() * 2);
            }
        }
    }

    private checkHazards(): void {
        if (this.invincible > 0 || this.state !== 'running') return;
        const px = this.player.position.x;
        const py = this.player.position.y;
        for (const entity of this.entities) {
            if (!entity.node.active || !entity.isSpawned(this.distance) || (entity.kind !== 'enemy' && entity.kind !== 'cone')) continue;
            const x = this.screenX(entity);
            const y = entity.node.position.y;
            const halfWidth = entity.kind === 'enemy' ? 35 : 38;
            const height = entity.kind === 'enemy' ? 150 : 95;
            if (Math.abs(x - px) < halfWidth + 20 && py + 20 < y + height && py + 130 > y + 15) {
                this.hp--;
                this.invincible = 0.5;
                this.animator.play('hurt', true);
                this.playSound('hit');
                this.playSound('hurt');
                this.updateHud();
                if (this.hp <= 0) this.lose();
                break;
            }
        }
    }

    private checkFinish(): void {
        if (this.finishTriggered) return;
        const finish = this.entities.find(e => e.kind === 'finish');
        if (!finish || !finish.isSpawned(this.distance)) return;
        if (this.player.position.x < this.screenX(finish) - 300) return;
        this.finishTriggered = true;
        this.state = 'winning';
        finish.getComponent(RunnerFinish)?.breakTape();
        this.dimOverlay!.active = true;
        this.confetti.burstFromSides();
    }

    private lose(): void {
        this.state = 'lose';
        this.animator.play('idle');
        this.audio.get('music')!.stop();
        this.playSound('lose');
        this.failOverlay!.active = true;
        this.footerPortrait!.active = false;
        this.footerLandscape!.active = false;
        this.scheduleOnce(() => {
            this.failOverlay!.active = false;
            this.showEnd(false);
        }, 1.5);
    }

    private showEnd(win: boolean): void {
        this.state = 'end';
        this.animator.play('idle');
        this.audio.get('music')!.stop();
        if (win) this.playSound('win');
        this.footerPortrait!.active = false;
        this.footerLandscape!.active = false;
        this.dimOverlay!.active = false;
        this.endOverlay!.active = true;
        this.endTitleLabel!.string = win ? 'Congratulations!' : "You didn't make it!";
        this.endSubtitleLabel!.string = win ? 'Choose your reward!' : 'Try again on the app!';
        this.endAmountLabel!.string = '$0.00';
        this.endTargetValue = this.score;
        this.endCountValue = 0;
        this.endCountElapsed = 0;
        this.endCountdown = 60;
        this.countdownLabel!.string = '01:00';
        this.endCardNode!.setScale(0, 0, 1);
        tween(this.endCardNode!).to(0.6, { scale: new Vec3(1.15, 1.15, 1) }).to(0.2, { scale: Vec3.ONE }).start();
        this.lightsNode!.angle = 0;
    }

    private updateEnd(dt: number): void {
        if (this.state !== 'end') return;
        this.endCountElapsed += dt;
        const progress = Math.min(1, this.endCountElapsed);
        this.endCountValue = this.endTargetValue * (1 - Math.pow(1 - progress, 3));
        this.endAmountLabel!.string = `$${this.endCountValue.toFixed(2)}`;
        this.lightsNode!.angle += dt * 20;
        if (this.endCountdown > 0) {
            const seconds = Math.max(0, 60 - Math.floor(this.endCountElapsed));
            if (seconds !== this.endCountdown) {
                this.endCountdown = seconds;
                this.countdownLabel!.string = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
            }
        }
    }

    private collectEffect(entity: RunnerEntity): void {
        const icon = entity.kind === 'dollar' ? this.flyingDollar! : this.flyingPayPal!;
        icon.active = true;
        icon.setPosition(this.screenX(entity), entity.node.position.y, 0);
        icon.setScale(0.15, 0.15, 1);
        tween(icon).to(0.4, { position: new Vec3(240, 555, 0), scale: new Vec3(0.08, 0.08, 1) })
            .call(() => { icon.active = false; }).start();
    }

    private showPraise(): void {
        const words = ['Awesome!', 'Fantastic!', 'Great!', 'Perfect!'];
        this.praiseLabel!.string = words[Math.floor(Math.random() * words.length)];
        this.praiseNode!.active = true;
        this.praiseNode!.setPosition(0, 120, 0);
        this.praiseNode!.setScale(0.5, 0.5, 1);
        tween(this.praiseNode!).to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: Vec3.ONE })
            .to(0.7, { position: new Vec3(0, 190, 0) })
            .call(() => { this.praiseNode!.active = false; }).start();
    }

    private updateHud(): void {
        this.heartsLabel!.string = Array.from({ length: this.maxHealth }, (_, i) => i < this.hp ? '♥' : '♡').join('  ');
        this.scoreLabel!.string = `$${Math.floor(this.score)}`;
    }

    private updateFooter(): void {
        if (this.state === 'end' || this.state === 'lose') return;
        const size = view.getVisibleSize();
        const landscape = size.width > size.height;
        this.footerPortrait!.active = !landscape;
        this.footerLandscape!.active = landscape;
    }

    private screenX(entity: RunnerEntity): number { return this.spawns.position.x + entity.node.position.x; }
    private playSound(name: string): void { this.audio.get(name)?.play(); }

    private onHide(): void {
        this.hiddenPause = true;
        this.audio.get('music')?.pause();
    }
    private onShow(): void {
        this.hiddenPause = false;
        if (this.state === 'running' || this.state === 'winning') this.audio.get('music')?.play();
    }

    private toStore(): void {
        const win = window as unknown as { ToStore?: () => void; mraid?: { open?: (url: string) => void } };
        if (win.ToStore) { win.ToStore(); return; }
        const url = /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'https://apps.apple.com/us/app/win-real-money-playoff-games/id6444492155'
            : 'https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded';
        if (win.mraid?.open) win.mraid.open(url);
        else window.open(url, '_blank');
    }

    private required<T>(value: T | null | undefined, name: string): T {
        if (value == null) throw new Error(`Runner scene reference is missing: ${name}`);
        return value;
    }
}
