# Elvis Placenames #

Exposing placenames or gazetteer data gathered from the various jurisdictions.

### What is this repository for? ###

* Client side code to collect user input to farm off to the FME or other bespoke services/
* Version 0.0.1
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up for developement? ###
Note that this project shares services with the elevation project so the server referred to here is a simple clone from the
fsdf-elvis project. It doesn't run under the current deployment strategy.

* git clone <this_repository>
* cd elvis-placenames
* npm install
* bower install
* node server
* http://localhost:3000/
* Dependencies: AngularJS, Leaflet
* Deployment is simply copy the dist directory to a web server and navigate to wherever you put it.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Larry Hill
* NLIG at Geoscience Australia

### How do I deploy to AWS? ###

First thing is get yourself a Linux AMI virtual machine. This thing works in conjunction with the gazetteer project which is a Solr installation
that harvests data from the placenames postgis database while this has a small footprint and minimal resource usage it is expected that it will
be codeployed with the gazeteer project. I didn't create the instances but this is what I would think needs doing:

* Create a `t2.micro` instance
* Allocate a public IP to it: [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html?icmpid=docs_ec2_console)
* Point a DNS entry at the public IP, this is done through your local domain manager.
* Create a security group that has inbound connections for: HTTP (80), SSH (22) and maybe HTTPS (443) and
* Outbound connections on `all` [](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html?icmpid=docs_ec2_console)
* Get yourself some [PEM's](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#having-ec2-create-your-key-pair)
* [Add the PEM to Putty](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/putty.html)
* With the PEMs set up you should be able to SSH into your instance using your public IP

Once logged in you are now ready to setup the software dependencies. All the support software is [listed in here] (../deployment/load_app_dependencies)

Seeing as you do not have git installed yet it is pretty simple to
* `sudo bash`
* Cut and paste all the commands not commented out and run them.
* What was installed: NodeJS, Apache web server, git bower and forever
* The Apache web server is set to autostart on reboot and is initially started.

It should chug along for a few seconds and then all you need to deploy the app is ready to go. Now download the code.

### Future deployments. ###
It is simply follow the last steps.
Log into your Linux vm and:
```
> cd elvis-placenames
> bash deployment/deploy_placenames
```

It will pull the latest code base in and deploy. It's up to you to manage versioning and the like so take care. Don't forget it doesn't use
the development server in the current deployment. This project is purely static content once it is deployed.
