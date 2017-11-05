class PolarLookUp {
   constructor() {
      this._points = {};
   }

   addPoint(point) {
      let polar = new PolarPoint(point);
      this._points[polar.id] = polar;
   }

   addPoints(points) {
      points.forEach(point => this.addPoint(point));
   }

   find(id) {
      if (Array.isArray(id)) {
         return id.map(id => this._points[id]);
      }
      return this._points[id];
   }

   get length() {
      return this._points.keys
   }
}

class PolarGrid {
   /*
    "location":"110.55 -66.27777778",
    "recordId":"AAD_102",
    "authorityId":"102",
    "name":"Brown Bay",
    "feature":"BAY",
    "category":"WATERBODY",
    "group":"HYDROLOGY",
    "authority":"AAD",
    "supplyDate":"2017-11-03T04:58:25Z",
    "ll":"110.55 -66.27777778",
    "xPolar":2447147.8,
    "yPolar":-917385.9,
    "_version_":1583131288900993033
    */
   constructor(options) {
      this._options = Object.assign({
         cellWidth: 600000, // 200km
         cellHeight: 600000,   // 200km
         crs: "EPSG:3031"
      }, options);

      this._cellMap = {};
   }

   addPoint(polar) {
      let cell = new Cell(this._options);
      cell.addPoint(polar);

      if (this._cellMap[cell.key]) {
         this._cellMap[cell.key].addCell(cell);
      } else {
         this._cellMap[cell.key] = cell;
      }
   }

   get cells() {
      return Object.entries(this._cellMap).map(entry => entry[1]);
   }

   addPoints(points) {
      points.forEach(point => this.addPoint(point));
   }
}

class Cell {
   constructor(options) {
      this._points = [];
      this._options = options;
   }

   addPoint(point) {
      // Invalidate cache
      this._weightedLatLng = this._weightedCenter = null;

      let keyX = Math.floor(point.x / this._options.cellWidth);
      let keyY = Math.floor(point.y / this._options.cellHeight);
      let key = keyX + "/" + keyY;
      if (!this._key) {
         this.x = keyX;
         this.y = keyY;
         this._key = key;
      }

      if (this._key === key) {
         this._points.push(point);
         return true;
      }
      return false;
   }

   get length() {
      return this._points.length;
   }

   get weightedCenter() {
      if (!this._weightedCenter) {
         this._weightedCenter = {
            x: (this.x + 0.5) * this._options.cellWidth,
            y: (this.y + 0.5) * this._options.cellHeight
         };
      }
      return this._weightedCenter;
   }

   get weightedLatLng() {
      if (!this._weightedLatLng) {
         let sum = this._points
            .reduce((sum, point) => ({ lat: sum.lat + point._latLng.lat, lng: sum.lng + point._latLng.lng }), { lat: 0, lng: 0 });
         this._weightedLatLng = {
            lat: sum.lat / this._points.length,
            lng: sum.lng / this._points.length
         };
      }
      return this._weightedLatLng;
   }

   addCell(cell) {
      this._points = this._points.concat(cell.points);
   }

   get key() {
      return this._key;
   }

   get points() {
      return this._points;
   }
}

class PolarPoint {
   constructor(data) {
      this._data = data;
      let locationArr = data.location.split(" ");
      this._latLng = {
         lat: +locationArr[1],
         lng: +locationArr[0]
      };
   }

   get data() {
      return this._data;
   }

   get latLng() {
      return this._latLng;
   }

   get id() {
      return this._data.recordId;
   }

   get x() {
      return this._data.xPolar;
   }

   get y() {
      return this._data.yPolar;
   }

   get xy() {
      return { x: this.x, y: this.y };
   }
}