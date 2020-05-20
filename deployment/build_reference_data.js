/*
   This runs only on an EC2 instance that has been registered to use AWS Secrets Manager to 
   retrieve the PostGIS credentials and connection details. 
   Ask NLIG for credentials
*/
const awsSecrets = require("../lib/awsSecrets");
const { Client } = require('pg');

console.log("Starting read of postGis");
bootstrap().then(response => {
   console.log("Finit");
   process.exit();
}).catch(err => {
   console.log("Finit with error", err);
   process.exit();
});

async function bootstrap() {
   const parameters = await awsSecrets(config.awsSecrets);

   const client = new Client({
      user: parameters.username,
      host: parameters.host,
      database: parameters.dbname,
      password: parameters.password,
      port: parameters.port,
   });

   client.connect((err, client, done) => {
      // Handle connection errors
      if (err) {
         console.log(err);
         return;
      }

      // SQL Query > Select Data
      const query = client.query('select * from "PLACENAMES_FEATURE_CATALOGUE";')
         .then(res => {
            let groups = {};

            res.rows.forEach(row => {
               let groupName = row.group.trim();
               let group = groups[groupName];
               if (!group) {
                  group = groups[groupName] = {
                     name: groupName,
                     definition: row.group_definition
                  };
               }

               let categoryName = row.category.trim();
               let category = group[categoryName];

               if (!category) {
                  category = group[categoryName] = {
                     name: categoryName,
                     definition: row.category_definition,
                     features: []
                  };
               }

               let feature = {
                  name: row.feature.trim()
               };
               decorate(feature, row, 'definition', 'feature_definition');
               decorate(feature, row, 'source', 'source');
               decorate(feature, row, 'includedTerms', 'included_terms');
               decorate(feature, row, 'examples', 'examples');

               category.features.push(feature);

            });
            console.log(JSON.stringify(groups, null, 3));
            process.exit();
         });
   });
}

function decorate(target, source, name, key) {
   if (source[key]) {
      target[name] = source[key];
   }
}