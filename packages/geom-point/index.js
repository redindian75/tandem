import BaseObject from 'object';

class Point extends BaseObject {
  constructor(x, y) {
    super({ x: x, y: y });
  }
}

export default Point;
