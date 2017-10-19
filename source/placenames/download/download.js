{
   angular.module("placenames.download", [])

      .directive("placenamesDownload", ["placenamesDownloadService", function (placenamesDownloadService) {
         return {
            templateUrl: "placenames/download/download.html",
            scope: {
               data: "="
            },
            link: function (scope) {
               console.log("data download", scope.data);
               scope.processing = placenamesDownloadService.data;

               scope.submit = function () {
                  placenamesDownloadService.submit(scope.data.params);
               }
            }
         }
      }])

      .directive("placenamesDownloadShow", [function () {
         return {
            template: '<a href"javascript:void()" ng-click="pr.download()" ng-show="pr.data.searched.data.response.docs.length" '
            + 'uib-tooltip="Download listed features in ESRI JSON format" tooltip-placement="bottom"><i class="fa fa-download"></i></a>'
         }
      }])

      .factory("placenamesDownloadService", ["$http", "configService", "storageService", function ($http, configService, storageService) {
         const EMAIL_KEY = "download_email";

         let service = {
            data: {
               show: false,
               email: null,

               get valid() {
                  return this.validEmail;
               },

               get validEmail() {
                  return this.email;
               },

               get validProjection() {
                  return this.outCoordSys;
               },

               get validFormat() {
                  return this.outFormat;
               },

               get percentComplete() {
                  return (this.validEmail ? 100 / 3 : 0) +
                     (this.validProjection ? 100 / 3 : 0) + (this.validFormat ? 100 / 3 : 0);
               }
            },

            submit: function ({ fq, q }) {
               let postData = {
                  file_name: "output_filename",
                  file_format_vector: this.data.outFormat.code,
                  coord_sys: this.data.outCoordSys.code,
                  email_address: this.data.email,
                  params: {
                     q,
                     fq
                  }
               };

               this.setEmail(this.data.email);
               if (this.data.fileName) {
                  postData.file_name = this.data.fileName;
               }

               return $http({
                  url: this.data.config.serviceUrl,
                  method: 'POST',
                  //assign content-type as undefined, the browser
                  //will assign the correct boundary for us
                  //prevents serializing payload.  don't do it.
                  headers: {
                     "Content-Type": "application/json"
                  },
                  data: postData
               });
               console.log("Downloading", postData);
            },

            setEmail: function (email) {
               storageService.setItem(EMAIL_KEY, email);
            },

            getEmail: function () {
               return storageService.getItem(EMAIL_KEY).then(function (value) {
                  service.data.email = value;
                  return value;
               });
            }
         };

         configService.getConfig("download").then(config => service.data.config = config);
         service.getEmail().then(email => service.data.email = email);

         return service;
      }])


      .filter("productIntersect", function () {
         return function intersecting(collection, extent) {
            // The extent may have missing numbers so we don't restrict at that point.
            if (!extent || !collection) {
               return collection;
            }

            return collection.filter(function (item) {
               // We know these have valid numbers if it exists
               if (!item.extent) {
                  return true;
               }

               let {xMax, xMin, yMax, yMin} = item.extent;
               return extent.intersects([[yMin, xMin], [yMax, xMax]]);
            });
         };
      });
}