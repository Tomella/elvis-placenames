{

      angular.module("placenames.utils", [])

         .filter("placenamesSplitBar", function () {
            return function (val = "") {
               var buffer = "";
               val.split("|").forEach((name, index, variants) => {
                  buffer += (index && index < variants.length - 1 ? "," : "") + " ";
                  if (index && index === variants.length - 1) {
                     buffer += "or ";
                  }
                  buffer += name;
               });
               return buffer;
            };
         })

         .filter("placenamesGoogleLink", function() {
            var template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";
            return function(what) {
               if(!what) return "";
               let location = what.location.split(" ");

               return template
                  .replace("${lng}", location[0])
                  .replace("${lat}", location[1]);
            };
         })

         .factory('placenamesUtilsService', ['configService', function (configService) {
            var service = {};

            return service;
         }]);

   }
