import {
  htmlElementDependencies,
  htmlTextDependency,
  htmlCommentDependency,
  htmlTemplateEntityDependency,
  HTMLElementEntity
} from "./index";

import { BoundingRect } from "sf-core/geom";
import * as sift from "sift";
import { EntityEngine, IVisibleEntity } from "sf-core/entities";
import { parse as parseHTML } from "../../parsers/html";
import { Dependencies, ApplicationSingletonDependency } from "sf-core/dependencies";
import { FrontEndApplication } from "sf-front-end/application";
import { expect } from "chai";

describe(__filename + "#", () => {
  let dependencies: Dependencies;
  let app: FrontEndApplication;

  beforeEach(() => {
    app = new FrontEndApplication({});

    dependencies = new Dependencies(
      ...htmlElementDependencies,
      htmlTextDependency,
      htmlCommentDependency,
      htmlTemplateEntityDependency,
      new ApplicationSingletonDependency(app)
    );
  });

  async function loadTarget(source) {
    const engine = new EntityEngine(dependencies);
    const entity = await engine.load(parseHTML(source as string))as HTMLElementEntity;
    const div = document.createElement("div");
    document.body.appendChild(div);
    Object.assign(div.style, { position: "fixed", top: "0px", left: "0px" });
    div.appendChild(entity.section.toDependency());
    return <IVisibleEntity>(entity.flatten().find(sift({ "attributes.name": "id", "attributes.value": "target" })) as any);
  }

  describe("bounds ", () => {

    async function calculateBounds(source) {
      const target = await loadTarget(source);
      const bounds = target.display.bounds;
      return [bounds.left, bounds.top, bounds.width, bounds.height];
    }

    it("are correct for a simple div", async () => {
      expect(await calculateBounds(`<div id="target" style="width:100px;height:100px;">
        </div>`)).to.eql([0, 0, 100, 100]);
    });

    it("returns the correct bounds of a DIV if it's isolated within an iframe", async () => {
      expect(await calculateBounds(`<template style="position:absolute;top:100px;left:100px">
        <div id="target" style="width:100px;height:100px;">
        </div>
      </template>`)).to.eql([100, 100, 100, 100]);
    });

    it("returns the correct bounds of a DIV in a doubly nested iframe", async () => {
      expect(await calculateBounds(`<template style="position:absolute;top:100px;left:100px">
        <template style="position:absolute;top:100px;left:100px">
          <div id="target" style="width:100px;height:100px;">
          </div>
        </template>
      </template>`)).to.eql([200, 200, 100, 100]);
    });

    it("returns the correct bounds of a DIV in a DIV", async () => {
      expect(await calculateBounds(`<div style="top:100px;left:50px;width:100px;height:100px;position:absolute;">
        <div id="target" style="width:100px;height:100px;position:absolute;top:10px;left:10px;" />
      </div>`)).to.eql([60, 110, 100, 100]);
    });

    describe("capabilities ", function() {

      async function calculateCapabilities(source) {
        const target = await loadTarget(source);
        return target.display.capabilities;
      }

      it("movable=true if style.position!=static", async () => {
        expect((await calculateCapabilities(`
          <div id="target" style="position:static;" />
        `)).movable).to.equal(false);

        expect((await calculateCapabilities(`
          <div id="target" style="position:relative;" />
        `)).movable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="position:absolute;" />
        `)).movable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="position:fixed;" />
        `)).movable).to.equal(true);
      });

      it("resizale=true if style.position=absolute|fixed || style.displat !== inline", async () => {

        expect((await calculateCapabilities(`
          <div id="target" style="position:absolute;" />
        `)).resizable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="position:fixed;" />
        `)).resizable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="display: inline-block;" />
        `)).resizable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="display: inline;" />
        `)).resizable).to.equal(false);

        expect((await calculateCapabilities(`
          <div id="target" style="display: inline; position: absolute;" />
        `)).resizable).to.equal(true);

        expect((await calculateCapabilities(`
          <div id="target" style="display: block;" />
        `)).resizable).to.equal(true);

      });
    });
  });
});