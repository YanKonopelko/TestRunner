import { _decorator, Component, Node, UITransform, view } from 'cc';

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
            if (isBackground) {
                this.scrollBackground(children, distance, visibleWidth);
                continue;
            }
            let rightmost = Math.max(...children.map(n => n.position.x - distance));
            for (const node of children) {
                const p = node.position;
                let x = p.x - distance;
                const offscreenMargin = group === this.trees ? 520 : group === this.lamps ? 300 : 220;
                const pastLeftEdge = x < -visibleWidth / 2 - offscreenMargin;
                if (pastLeftEdge) {
                    const spacing = group === this.lamps ? 800 : group === this.trees ? 400 : 170;
                    x = rightmost + spacing;
                    rightmost = x;
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

    private scrollBackground(children: readonly Node[], distance: number, visibleWidth: number): void {
        const moved = children.map(node => {
            const p = node.position;
            const width = (node.getComponent(UITransform)?.contentSize.width ?? 1707) * Math.abs(node.scale.x);
            const x = p.x - distance;
            node.setPosition(x, p.y, p.z);
            return { node, width };
        });

        let rightmost = Math.max(...moved.map(({ node, width }) =>
            node.position.x + (node.scale.x >= 0 ? width : 0)));
        const leftEdge = -visibleWidth / 2;
        const seamOverlap = 2;
        for (const { node, width } of moved) {
            const right = node.position.x + (node.scale.x >= 0 ? width : 0);
            if (right >= leftEdge) continue;
            const nextLeft = rightmost - seamOverlap;
            const x = node.scale.x >= 0 ? nextLeft : nextLeft + width;
            node.setPosition(x, node.position.y, node.position.z);
            rightmost = nextLeft + width;
        }
    }

    private groups(): Node[] {
        if (!this.backgroundTiles || !this.trees || !this.lamps || !this.bushes) {
            throw new Error('RunnerParallax groups must be assigned in the scene');
        }
        return [this.backgroundTiles, this.trees, this.lamps, this.bushes];
    }
}
