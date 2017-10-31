/*
   In the user running the Place Names it needs .bash_profile to set the following environment variables:

   export PLACENAMES_DB_USER
   export PLACENAMES_DB_HOST
   export PLACENAMES_DB_DATABASE
   export PLACENAMES_DB_PASSWORD
   export PLACENAMES_DB_PORT

   Ask NLIG for credentials
*/

const { Client } = require('pg');

const client = new Client({
   user: process.env.PLACENAMES_DB_USER,
   host: process.env.PLACENAMES_DB_HOST,
   database: process.env.PLACENAMES_DB_DATABASE,
   password: process.env.PLACENAMES_DB_PASSWORD,
   port: process.env.PLACENAMES_DB_PORT,
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
            if(!group) {
               group = groups[groupName] = {
                  name: groupName,
                  definition: row.group_definition
               };
            }

            let categoryName = row.category.trim();
            let category = group[categoryName];

            if(!category) {
               category = group[categoryName] = {
                  name: categoryName,
                  definition: row.category_definition,
                  features:[]
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

function decorate(target, source, name, key) {
   if(source[key]) {
      target[name] = source[key];
   }
}