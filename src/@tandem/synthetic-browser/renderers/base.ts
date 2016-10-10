import { Action } from "@tandem/common";
import { SyntheticRendererAction } from "../actions";
import { WrapBus } from "mesh";
import { Observable, IObservable } from "@tandem/common";
import { BoundingRect, watchProperty, IActor } from "@tandem/common";
import {
  MarkupNodeType,
  SyntheticDocument,
  SyntheticDOMNode,
  SyntheticDOMText,
  SyntheticDOMElement,
  SyntheticCSSStyleDeclaration,
} from "../dom";

import {
  ISyntheticComponent
} from "../components";


export interface ISyntheticDocumentRenderer extends IObservable {
  readonly element: HTMLElement;
  target: ISyntheticComponent;
  getBoundingRect(element: SyntheticDOMElement): BoundingRect;
}

export abstract class BaseRenderer extends Observable implements ISyntheticDocumentRenderer {

  readonly element: HTMLElement;
  private _component: ISyntheticComponent;
  private _updating: boolean;
  private _rects: any;
  private _shouldUpdateAgain: boolean;
  private _targetObserver: IActor;

  constructor() {
    super();
    this.element = document.createElement("div");
    this._targetObserver = new WrapBus(this.onTargetAction.bind(this));
  }

  get target(): ISyntheticComponent {
    return this._component;
  }

  set target(value: ISyntheticComponent) {
    if (this._component === value) {
      this.update();
      return;
    }

    if (this._component) {
      this._component.unobserve(this._targetObserver);
    }
    this._component = value;
    this._component.observe(this._targetObserver);
    this.update();
  }

  get rects() {
    return this._rects;
  }

  getBoundingRect(element: SyntheticDOMElement) {
    return (this._rects && this._rects[element.uid]) || new BoundingRect(0, 0, 0, 0);
  }

  protected abstract update();

  protected setRects(rects: any) {
    this._rects = rects;
    this.notify(new SyntheticRendererAction(SyntheticRendererAction.UPDATE_RECTANGLES));
  }

  protected onTargetAction(action: Action) {
    if (this._updating) {
      this._shouldUpdateAgain = true;
      return;
    }
    this._updating = true;
    requestAnimationFrame(() => {
      this.update();
      this._updating = false;
      if (this._shouldUpdateAgain) {
        this._shouldUpdateAgain = false;
        this.update();
      }
    });
  }
}

export class BaseDecoratorRenderer implements ISyntheticDocumentRenderer {
  constructor(protected _renderer: ISyntheticDocumentRenderer) {
    _renderer.observe(new WrapBus(this.onTargetRendererAction.bind(this)));
  }
  getBoundingRect(element) {
    return this._renderer.getBoundingRect(element);
  }
  observe(actor) {
    return this._renderer.observe(actor);
  }
  unobserve(actor) {
    return this._renderer.unobserve(actor);
  }
  notify(action) {
    return this._renderer.notify(action);
  }
  get element() {
    return this._renderer.element;
  }
  get target() {
    return this._renderer.target;
  }
  set target(value) {
    this._renderer.target = value;
  }

  protected onTargetRendererAction(action: Action) {

  }
}