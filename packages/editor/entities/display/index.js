import Entity from 'editor/entities/base';
import { ChangeMessage } from 'base/message-types';

/**
 * an entity which gets displayed to the user
 */

class DisplayEntity extends Entity {

  constructor(properties, children) {
    super({ attributes: { style: {} }, ...properties }, children);
  }

  /**
   * returns the computed style of the display entity - dimensions and such. This is particularly decoupled from any rendering engine. This method should also be overridden
   */

  getComputedStyle() {
    return this.getComputer().getStyle();
  }

  /**
   */

  getComputer() {
    if (this._computer) return this._computer;
    throw new Error('display entity must be bound to view before a style can be computed');
  }

  /**
   * overrides the style computer. Should be set by whatever is rendering this display entity.
   */

  setComputer(computer) {
    this._computer = computer;
  }

  /**
   * re-computes the position of this element based on its properties (is it pt, cm, mm, %), and its relationship to other elements on the page
   * TODO - this base class *must* be usable with other rendering engines - not specific to the DOM. Move it to a HTMLDisplayComputer object, or simila
   */

  setPositionFromFixedPoint(x, y) {
    return this.getComputer().setPositionFromFixedPoint(x, y);
  }

  /**
   * visual style of display entity such as position & dimensions
   */

  setStyle(properties) {

    this.attributes.style = Object.assign(
      {},
      this.attributes.style || {},
      properties
    );

    // FIXME - kind of nasty code here - breaks abstraction of change emittion
    // via setProperties. This chunk should be re-evaluated later on - okay for now.
    if (this.notifier) {
      this.notifier.notify(ChangeMessage.create([
        { target: this }
      ]));
    }
  }

  /**
   */

  getStyle() {
    return this.attributes.style;
  }
}

export default DisplayEntity;