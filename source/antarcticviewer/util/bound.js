function getEpsg3031Bounds(map) {
   var bounds = map.getPixelBounds();

   var sw = map.unproject(bounds.getBottomLeft());
   var ne = map.unproject(bounds.getTopRight());

   var ne_p = map.options.crs.project(ne);
   var sw_p = map.options.crs.project(sw);
   return { sw_p, ne_p };
}

function getBounds(map, restrictTo) {
   var { sw_p, ne_p } = getEpsg3031Bounds(map);

   if (restrictTo) {
      sw_p = mostUpperRight(sw_p, restrictTo.sw_p);
      ne_p = mostLowerLeft(ne_p, restrictTo.ne_p);
   }

   return [
      "xPolar:[" + sw_p.x + " TO " + ne_p.x + "]", // Long
      "yPolar:[" + sw_p.y + " TO " + ne_p.y + "]"  // Lat
   ];

   function mostUpperRight(point1, point2) {
      if(!point2) {
         return point1;
      }
      return {
         x: Math.max(point1.x, point2.x),
         y: Math.max(point1.y, point2.y)
      };
   }

   function mostLowerLeft(point1, point2) {
      if(!point2) {
         return point1;
      }
      return {
         x: Math.min(point1.x, point2.x),
         y: Math.min(point1.y, point2.y)
      };
   }

   function limitBetween(value, limit) {
      let sign = value < 0 ? -1 : 1;
      let acc = Math.abs(value);
      return sign * (acc < limit ? acc : limit);
   }
}