{
   angular.module("placenames.download", ['placenames.zone'])

      .directive("placenamesDownload", ["flashService", "messageService", "placenamesDownloadService", "zoneService",
         function (flashService, messageService, placenamesDownloadService, zoneService) {
            return {
               templateUrl: "/download/download.html",
               scope: {
                  data: "="
               },
               link: function (scope) {
                  scope.processing = placenamesDownloadService.data;
                  // Gets the counts per zone but they can be a bit iffy so we use them for a guide only
                  zoneService.counts(scope.data).then(results => {
                     scope.outCoordSys = results;
                  });

                  scope.$watch("processing.filename", testFilename);

                  scope.submit = function () {
                     let flasher = flashService.add("Submitting your job for processing", null, true);
                     if (scope.processing.outFormat.restrictCoordSys) {
                        scope.processing.outCoordSys = scope.processing.config.outCoordSys.find(coord => coord.code === scope.processing.outFormat.restrictCoordSys);
                        messageService.warn(scope.processing.outFormat.restrictMessage);
                     }

                     placenamesDownloadService.submit(scope.data.params).then(({ data }) => {
                        flasher.remove();
                        if (data.serviceResponse.statusInfo.status === "success") {
                           messageService.success("Your job has successfuly been queued for processing.");
                        } else {
                           messageService.warn("The request has failed. Please try again later and if problems persist please contact us");
                        }
                     }).catch(() => {
                        flasher.remove();
                        messageService.warn("The request has failed. Please try again later and if problems persist please contact us");
                     });
                  };

                  testFilename();

                  function testFilename(value) {
                     if (scope.processing.filename && scope.processing.filename.length > 16) {
                        scope.processing.filename = scope.processing.filename.substr(0, 16);
                     }
                     scope.processing.validFilename = !scope.processing.filename || scope.processing.filename.match(/^[a-zA-Z0-9\_\-]+$/);
                  }
               }
            };
         }])

      .factory("placenamesDownloadService", ["$http", "$q", "configService", "storageService", function ($http, $q, configService, storageService) {
         const EMAIL_KEY = "download_email";

         let service = {
            data: {
               show: false,
               email: null,
               validFilename: false,
               dataFields: "common",

               get valid() {
                  return this.percentComplete === 100;
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
                  return (this.validEmail ? 25 : 0) + (this.validFilename ? 25 : 0) +
                     (this.validProjection ? 25 : 0) + (this.validFormat ? 25 : 0);
               }
            },

            submit: function ({ fq, q }) {
               let postData = {
                  file_name: this.data.filename ? this.data.filename : "output_filename",
                  file_format_vector: this.data.outFormat.code,
                  coord_sys: this.data.outCoordSys.code,
                  data_fields: this.data.dataFields,
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

               let url = this.data.config.serviceUrl;
               return $q(function (resolve, reject) {
                  return $http({
                     url: url,
                     method: 'POST',
                     headers: {
                        "Content-Type": "application/json"
                     },
                     data: postData
                  }).then(function (response) {
                     resolve(response);
                  });
               });
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

               let { xMax, xMin, yMax, yMin } = item.extent,
                  response;
               try {
                  response = extent.intersects([[yMin, xMin], [yMax, xMax]]);
               } catch (e) {
                  console.error("Couldn't test for intersects", e);
                  return false;
               }
               return response;
            });
         };
      });
}
