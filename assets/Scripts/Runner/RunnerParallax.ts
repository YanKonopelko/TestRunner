import { _decorator, Component, Node, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RunnerParallax')
export class RunnerParallax extends Component {
    @property(Node) backgroundTiles: Node | null = null;
    @property(Node) trees: Node | null = null;
    @property(Node) lamps: Node | null = null;
    @property(Node) bushes: Node | null = null;

    private initial = new Map<Node, number>();

    onLoad(): void {
        for (const group of this.groups()) for (const node of group.children) this.initial.set(node, node.position.x);
    }

    scroll(distance: number): void {
        const frameSize = view.getFrameSize();
        const visibleWidth = frameSize.height > 0
            ? view.getVisibleSize().height * frameSize.width / frameSize.height
            : view.getVisibleSize().width;
        for (const group of this.groups()) {
            const children = group.children;
            if (!children.length) continue;
            const isBackground = group === this.backgroundTiles;
            const tileWidth = 3103;
            let rightmost = Math.max(...children.map(n =>
                isBackground && n.scale.x > 0 ? n.position.x + tileWidth : n.position.x));
            for (const node of children) {
                const p = node.position;
                let x = p.x - distance;
                // Adjacent road tiles alternate direction, so their matching edges meet.
                const pastLeftEdge = isBackground
                    ? x + (node.scale.x > 0 ? tileWidth : 0) < -visibleWidth / 2
                    : x < -Math.max(2500, visibleWidth / 2 + 1600);
                if (pastLeftEdge) {
                    if (isBackground) {
                        x = rightmost + (node.scale.x < 0 ? tileWidth : 0);
                        rightmost += tileWidth;
                    } else {
                        const spacing = group === this.lamps ? 800 : group === this.trees ? 400 : 170;
                        x = rightmost + spacing;
                        rightmost = x;
                    }
                }
                node.setPosition(x, p.y, p.z);
            }
        }
    }

    reset(): void {
        for (const [node, x] of this.initial) {
            const p = node.position;
            node.setPosition(x, p.y, p.z);
        }
    }

    private groups(): Node[] {
        if (!this.backgroundTiles || !this.trees || !this.lamps || !this.bushes) {
            throw new Error('RunnerParallax groups must be assigned in the scene');
        }
        return [this.backgroundTiles, this.trees, this.lamps, this.bushes];
    }
}
