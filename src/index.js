import * as hull from "@thi.ng/geom-hull";

import { draw, Drawing, Blueprint } from "replicad";

// helpers
function makeSegmentCurve(p1, p2) {
  const s = draw(p1).lineTo(p2);
  return s.pendingCurves[0];
}
const range = (size) => Array.from({ length: size }, (_, i) => i);
const isSamePoint = ([x0, y0], [x1, y1], precision = 1e-6) => {
  return Math.abs(x0 - x1) <= precision && Math.abs(y0 - y1) <= precision;
};

const zipWithNext = (arr) =>
  arr
    .slice(0, -1)
    .map((_, i) => [arr[i], arr[i + 1]])
    .concat([[arr.at(-1), arr[0]]]);

// This function takes a drawing and a number of points per curve and returns
// an array of points with some meta data attached to them.
//
// The meta data can be an array of two objects if the point is between two curves
const asPoints = (drawing, pointPerCurve) => {
  const inner = drawing.innerShape;
  const blueprints = inner.blueprints || [inner];

  const firstPointIndex = 0;
  const lastPointIndex = pointPerCurve - 1;

  let blueprintCurveIndex = 0;

  return blueprints.flatMap((blueprint) => {
    const curves = blueprint.curves;

    let points = curves.flatMap((curve, curveIndex) => {
      const firstParam = curve.firstParameter;
      const lastParam = curve.lastParameter;

      const paramRange = lastParam - firstParam;

      const lastPoint = curve.value(lastParam);
      const nextCurveIndex = (curveIndex + 1) % curves.length;
      const nextCurve = curves[nextCurveIndex];

      lastPoint.meta = [
        {
          curve,
          param: lastParam,
          curveIndex: curveIndex + blueprintCurveIndex,
          pointIndex: lastPointIndex,
        },
        {
          curve: nextCurve,
          param: nextCurve.firstParameter,
          curveIndex: nextCurveIndex + blueprintCurveIndex,
          pointIndex: firstPointIndex,
        },
      ];

      // This normalizes the parameter to the range [0, 1]
      const adaptParam = (p) => {
        return firstParam + p * paramRange;
      };

      return [
        lastPoint,
        // The range is two smaller because we already have the first and last point
        ...range(pointPerCurve - 2).map((i) => {
          const param = adaptParam((i + 1) / pointPerCurve);
          const value = curve.value(param);
          value.meta = {
            curve,
            param,
            curveIndex: curveIndex + blueprintCurveIndex,
            // We start at 0
            pointIndex: i + 1,
          };
          return value;
        }),
      ];
    });
    blueprintCurveIndex += curves.length;
    return points;
  });
};

export default function shrinkWrap(drawing, nPoints = 100) {
  const points = asPoints(drawing, nPoints);
  let convexHull = hull.grahamScan2(points);
  convexHull = convexHull.flatMap((p, i) => {
    const meta = p.meta;

    // For points that are not between two curves
    if (!Array.isArray(meta)) {
      return [p];
    }

    // We want to split the point as two points in two curves
    const [first, second] = meta.map((m) => {
      const p2 = [p[0], p[1]];
      p2.meta = m;
      return p2;
    });

    // depending on the order of the convex hull we need to swap the points
    const firstCurveIndex = first.meta.curveIndex;
    const secondCurveIndex = second.meta.curveIndex;
    const nextCurveIndex =
      convexHull[(i + 1) % convexHull.length].meta.curveIndex;
    const previousCurveIndex =
      convexHull[(i - 1 + convexHull.length) % convexHull.length].meta
        .curveIndex;

    if (
      firstCurveIndex === nextCurveIndex &&
      secondCurveIndex === previousCurveIndex
    ) {
      return [second, first];
    }
    return [first, second];
  });

  // We only want to keep the points that are between two curves
  let curveChanges = zipWithNext(convexHull)
    .filter(([p1, p2]) => {
      if (p1.meta.curveIndex === p2.meta.curveIndex) {
        if (p1.meta.curve.geomType === "LINE") {
          return false;
        }
        return Math.abs(p2.meta.pointIndex - p1.meta.pointIndex) !== 1;
      }

      return true;
    })
    .flat();

  curveChanges = curveChanges.filter((current, i) => {
    // We remove duplicates (that appear because of the zip with next)
    const previous = curveChanges[(i + 1) % curveChanges.length];
    const sameCurve = current.meta.curveIndex === previous.meta.curveIndex;
    const samePoint = current.meta.pointIndex === previous.meta.pointIndex;
    return !sameCurve || !samePoint;
  });

  const shape = zipWithNext(curveChanges)
    .filter(([p1, p2]) => !isSamePoint(p1, p2))
    .map(([p1, p2]) => {
      // This is where we pick the curves we need

      if (p1.meta.curveIndex === p2.meta.curveIndex) {
        // Were we just take the base curve
        if (p1.meta.pointIndex === 0 && p2.meta.pointIndex === nPoints - 1) {
          return p1.meta.curve;
        }

        // The curve is full, but we need to reverse it
        if (p1.meta.pointIndex === nPoints - 1 && p2.meta.pointIndex === 0) {
          let c = p1.meta.curve.clone();
          c.reverse();
          return c;
        }

        // We need to split the curve somewhere
        const splitAt = [p1, p2]
          .filter(
            (p) => p.meta.pointIndex !== 0 && p.meta.pointIndex !== nPoints - 1
          )
          .map((p) => p.meta.param);

        const segments = p1.meta.curve.splitAt(splitAt);

        // We have three possible cases:
        // 1. One split and we keep the first part
        // 2. One split and we keep the second part
        // 3. Two splits and we keep the middle (second) part
        let segment = segments[0];
        if (p1.meta.pointIndex !== 0 && p2.meta.pointIndex !== 0) {
          segment = segments[1];
        }

        if (p1.meta.pointIndex > p2.meta.pointIndex) {
          segment.reverse();
        }

        return segment;
      }

      return makeSegmentCurve(p1, p2);
    });

  return new Drawing(new Blueprint(shape));
}
