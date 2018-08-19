// Let's keep it simple stoopid. We have a Safe JSON and we'll convert it to a feature
// with a Multipolygon and place it in the resources configuration directory.

const fs = require('fs');
const proj4 = require('proj4');
const reproject = coords => proj4("EPSG:3857", "EPSG:4326", coords);
const safeJson = require("./NT_POLY_JSON.json");

let feature = {
   type: "Feature",
   geometry: {
      type: "MultiPolygon"
   },
   properties: {
      name: "NT_POLY"
   }
};

feature.geometry.coordinates = safeJson.map(poly => poly.json_geometry.coordinates.map(outer => outer.map(inner => reproject(inner))));
fs.writeFileSync('../resources/config/nt.json', JSON.stringify(feature));
