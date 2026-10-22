import Matter from 'matter-js';
import type { CanvasItem, StickerItem } from '../types/canvas';
import { soundEngine } from './soundEngine';

export class CanvasPhysics {
  private engine: Matter.Engine;
  private bodiesMap: Map<string, Matter.Body> = new Map();
  private floorBody: Matter.Body | null = null;
  private leftWall: Matter.Body | null = null;
  private rightWall: Matter.Body | null = null;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private onUpdateCallback?: (updatedPositions: Record<string, { x: number; y: number; rotation: number }>) => void;

  // Active dragged body for flinging
  private grabbedBody: Matter.Body | null = null;
  private lastGrabPos: { x: number; y: number; time: number } | null = null;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.8, scale: 0.001 }
    });

    // Listen for collisions to play bounce/impact sounds!
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const speedA = Matter.Vector.magnitude(pair.bodyA.velocity);
        const speedB = Matter.Vector.magnitude(pair.bodyB.velocity);
        const relativeSpeed = Math.max(speedA, speedB);

        if (relativeSpeed > 2.5) {
          const contactX = (pair.bodyA.position.x + pair.bodyB.position.x) / 2;
          const contactY = (pair.bodyA.position.y + pair.bodyB.position.y) / 2;
          soundEngine.play('boing', { x: contactX, y: contactY });
        }
      });
    });
  }

  /**
   * Initializes or updates physics bodies for canvas items and sets dynamic arena boundaries
   */
  public syncItems(items: CanvasItem[], groundY: number = 800) {
    const activeIds = new Set<string>();

    // Add boundaries (Floor & Walls) so memes bounce inside the playground
    if (!this.floorBody) {
      this.floorBody = Matter.Bodies.rectangle(0, groundY + 200, 10000, 100, {
        isStatic: true,
        friction: 0.8,
        restitution: 0.7
      });
      this.leftWall = Matter.Bodies.rectangle(-2500, 0, 100, 6000, {
        isStatic: true,
        friction: 0.5,
        restitution: 0.8
      });
      this.rightWall = Matter.Bodies.rectangle(2500, 0, 100, 6000, {
        isStatic: true,
        friction: 0.5,
        restitution: 0.8
      });
      Matter.Composite.add(this.engine.world, [this.floorBody, this.leftWall, this.rightWall]);
    } else {
      Matter.Body.setPosition(this.floorBody, { x: 0, y: groundY + 200 });
    }

    items.forEach((item) => {
      // Stickers or explicitly flagged items
      if (item.type !== 'sticker' && !item.isPhysicsActive) return;

      activeIds.add(item.id);
      let body = this.bodiesMap.get(item.id);

      if (!body) {
        const halfW = (item.width || 120) / 2;
        const halfH = (item.height || 120) / 2;
        const bounciness = (item as StickerItem).bounciness ?? 0.8;

        body = Matter.Bodies.rectangle(
          item.x + halfW,
          item.y + halfH,
          item.width || 120,
          item.height || 120,
          {
            restitution: bounciness,
            friction: 0.15,
            frictionAir: 0.012,
            density: 0.002
          }
        );

        Matter.Body.setAngle(body, (item.rotation * Math.PI) / 180);
        this.bodiesMap.set(item.id, body);
        Matter.Composite.add(this.engine.world, body);
      }
    });

    // Remove obsolete bodies
    this.bodiesMap.forEach((body, id) => {
      if (!activeIds.has(id)) {
        Matter.Composite.remove(this.engine.world, body);
        this.bodiesMap.delete(id);
      }
    });
  }

  /**
   * Starts the 60fps simulation loop
   */
  public start(onUpdate: (updatedPositions: Record<string, { x: number; y: number; rotation: number }>) => void) {
    this.onUpdateCallback = onUpdate;
    if (this.isRunning) return;
    this.isRunning = true;

    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      const delta = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;

      Matter.Engine.update(this.engine, delta);

      const updates: Record<string, { x: number; y: number; rotation: number }> = {};
      this.bodiesMap.forEach((body, id) => {
        const width = body.bounds.max.x - body.bounds.min.x;
        const height = body.bounds.max.y - body.bounds.min.y;
        updates[id] = {
          x: body.position.x - width / 2,
          y: body.position.y - height / 2,
          rotation: (body.angle * 180) / Math.PI
        };
      });

      if (this.onUpdateCallback && Object.keys(updates).length > 0) {
        this.onUpdateCallback(updates);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stops simulation
   */
  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Flips gravity upside down or returns it to normal
   */
  public toggleGravityInversion(): boolean {
    const isCurrentlyNormal = this.engine.gravity.y > 0;
    this.engine.gravity.y = isCurrentlyNormal ? -0.8 : 0.8;
    return !isCurrentlyNormal;
  }

  /**
   * Applies an explosive radial impulse (Meme Nuke) to all bodies
   */
  public applyExplosion(centerX: number, centerY: number, forceStrength: number = 0.2) {
    this.bodiesMap.forEach((body) => {
      const dx = body.position.x - centerX;
      const dy = body.position.y - centerY;
      const dist = Math.hypot(dx, dy) || 1;
      const normalX = dx / dist;
      const normalY = dy / dist;

      const forceMag = (forceStrength / Math.max(dist * 0.005, 1)) * (0.8 + Math.random() * 0.4);

      Matter.Body.applyForce(body, body.position, {
        x: normalX * forceMag,
        y: normalY * forceMag - 0.08
      });

      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
    });
  }

  /**
   * Black Hole Vortex: Sucks and swirls all bodies toward the cursor!
   */
  public applyVortex(vortexX: number, vortexY: number, strength: number = 0.035) {
    this.bodiesMap.forEach((body) => {
      const dx = vortexX - body.position.x;
      const dy = vortexY - body.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 10) return;

      // Radial inward force
      const inwardX = (dx / dist) * strength;
      const inwardY = (dy / dist) * strength;

      // Tangential swirling force (perpendicular)
      const swirlX = (-dy / dist) * (strength * 0.8);
      const swirlY = (dx / dist) * (strength * 0.8);

      Matter.Body.applyForce(body, body.position, {
        x: inwardX + swirlX,
        y: inwardY + swirlY
      });
    });
  }

  /**
   * Grab a body at world coordinates
   */
  public grabBodyAt(worldX: number, worldY: number): string | null {
    for (const [id, body] of this.bodiesMap.entries()) {
      if (Matter.Bounds.contains(body.bounds, { x: worldX, y: worldY })) {
        this.grabbedBody = body;
        this.lastGrabPos = { x: worldX, y: worldY, time: performance.now() };
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        return id;
      }
    }
    return null;
  }

  /**
   * Drag grabbed body towards world coordinates
   */
  public dragGrabbedBody(worldX: number, worldY: number) {
    if (!this.grabbedBody) return;
    const now = performance.now();
    Matter.Body.setPosition(this.grabbedBody, { x: worldX, y: worldY });
    this.lastGrabPos = { x: worldX, y: worldY, time: now };
  }

  /**
   * Release and fling grabbed body with velocity!
   */
  public releaseGrabbedBody(worldX: number, worldY: number) {
    if (!this.grabbedBody) return;

    if (this.lastGrabPos) {
      const dt = Math.max(performance.now() - this.lastGrabPos.time, 16);
      const vx = ((worldX - this.lastGrabPos.x) / dt) * 15;
      const vy = ((worldY - this.lastGrabPos.y) / dt) * 15;
      Matter.Body.setVelocity(this.grabbedBody, {
        x: Math.max(-30, Math.min(30, vx)),
        y: Math.max(-30, Math.min(30, vy))
      });
    }

    this.grabbedBody = null;
    this.lastGrabPos = null;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const canvasPhysics = new CanvasPhysics();
