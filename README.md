
[![Build Status](https://travis-ci.org/TechnionYearlyProject/Roommates.svg?branch=master)](https://travis-ci.org/TechnionYearlyProject/Roommates?branch=master)

[![codecov](https://codecov.io/gh/TechnionYearlyProject/Roommates/branch/master/graph/badge.svg)](https://codecov.io/gh/TechnionYearlyProject/Roommates)


### Instructions
The cornerstone of the project has been set !

You should have node.js installed on your machine.

After pulling filles, you need to download dependencies (such as Express) by running:  
`npm install`  
inside the project main directory.

To run the tests type:  
`npm test`

**site url:** [https://powerful-tundra-42649.herokuapp.com/](https://powerful-tundra-42649.herokuapp.com/)

### Heroku deployment instructions:
Download heroku cli.

Login to heroku from project directory using:  
`heroku login`  
**username:** roommatesyearlyproject@gmail.com  
**password:** ***********  

Add remote to local reposiroty:  
`heroku git:remote -a powerful-tundra-42649`  

Commit changes:  
`git add .`  
`git commit -m "..."`

Push to heroku:  
`git push heroku master`  
