{

      angular.module("placenames.utils", [])

         .filter("placenamesSplitBar", function () {
            return function (val = "") {
               let buffer = "";
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

         .filter("placenamesGoogleLink", ['configService', function(configService) {
            let template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";


            return function(what) {
               if(!what) return "";
               let location = what.location.split(" ");

               return template
                  .replace("${lng}", location[0])
                  .replace("${lat}", location[1]);
            };
         }])

         .directive("placenamesGoogleAnchor", ['configService', function(configService) {
            let template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";
            return {
               scope: {
                  linkTitle: "@",
                  item: "="
               },
               template: '<span ng-if="hide">{{item.name}}</span>' +
                  '<a ng-if="!hide" ng-href="{{item | placenamesGoogleLink}}" target="_google" title="{{linkTitle}}">{{item.name}}</a>',
               link: function(scope) {
                  configService.getConfig("hideGoogleLink").then(val => {
                     scope.hide = !!val;
                  });
               }
            };
         }])

         .factory('placenamesUtilsService', ['configService', function (configService) {
            let service = {};

            return service;
         }]);

   }
