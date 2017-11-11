
   function getBounds(bounds, restrictTo) {
      let fq;

      if (restrictTo) {

         let left = Math.max(bounds.getWest(), -180, restrictTo.getWest());
         let right = Math.min(bounds.getEast(), 180, restrictTo.getEast());
         let top = Math.min(bounds.getNorth(), 90, restrictTo.getNorth());
         let bottom = Math.max(bounds.getSouth(), -90, restrictTo.getSouth());


         fq = "location:[" +
         (bottom > top ? top: bottom) + "," +
         (left > right? right : left) + " TO " +
         top + "," +
         right + "]";

      } else {
         fq = "location:[" +
         Math.max(bounds.getSouth(), -90) + "," +
         Math.max(bounds.getWest(), -180) + " TO " +
         Math.min(bounds.getNorth(), 90) + "," +
         Math.min(bounds.getEast(), 180) + "]";
      }
      return fq;
   }
