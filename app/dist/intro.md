#Using the "dist" Folder as a Central Repository

##Introduction
When working with several third party codes as dependencies, it is important to store them in an organized way. This helps one keep better track of what packages are up to date, allows one to more readily access and edit code, and at runtime shortens the loading time.

We use third party code that we have purchased and customized, and that is saved in our filing system through the app folder, but we also call cdn's in our index.html page, that would be better used by developers if they stoed the files locally. This is where one would use the "dist" folder.

This turtorial walks you through manually organizing your third party scripts in order to make sure they are up to date with the audacyDevOps team when developing.

##Checking package.json for Dependencies
The audacy devOps team lists its backend dependencies in package.json to be installed with:
```
$ npm install
```
If you clone our quindar applications and open the package.json, you'll notice that under dependencies there is a list of items each with version numbers next to them:
```
"example": "1.2.1",
"example2": "^1.2.3"
```
You'll also notice that som have a "^" before the version number. This means that the npm install should install the most current version of this package, if a newer version has come out since the one listed. It will then rewrite to package.json the most recent version and keep the "^" for next install.

When you install our apps, please check that the dependencies list in your package.json matches that on github (Note: if there is a "^" then disregard the number following, but know that the most recent version is desired, hence the "^"). For example, the quindar-angular dependencies list should be as follows:
```javascript
"dependencies": {
    "async": "^2.0.0-rc.3",
    "body-parser": "^1.15.0",
    "express": "^4.13.4",
    "express-mongoose-docs": "^0.3.1",
    "file-stream-rotator": "0.0.6",
    "fs": "0.0.2",
    "line-by-line": "^0.1.4",
    "mocha": "^2.4.5",
    "mongoose": "^4.4.14",
    "morgan": "^1.7.0",
    "nodemon": "^1.9.2",
    "pug": "^2.0.0-alpha7",
    "randomstring": "^1.1.4",
    "socket.io": "^1.4.6",
    "winston": "^2.2.0"
  }
```
##Using napa to Download cdn Files
napa is a tool that can download requested files from github or similar storage. It requires manipulating the package.json, but is very straightforward.

If you open the index.html in an editor, you’ll notice about 25 lines that call external scripts either stored locally or via cdn. We will be using grunt and napa to concatenate and minify these files, as well as monitor them to update changes that you make. First, store all the cdn called files locally for concatenation:

In package.json add the following to the scripts section:
```javascript
“scripts”: {
    …
    …
    “install”: “napa”
},
```
Then add a napa section driectly underneath:
```javascript
“napa”: {
    // cdn file calls go here
    “nameYouChoose”: "https://example.com/path/to/file/file.min.css", //make sure to choose descriptive names like bootstrap-css
    ...
    ...
}
```
List all the cdn calls form the index.html as we will want to store them all locally.

napa stores all the entered files locally, but puts them into the node_modules folder, which makes it difficult to work with.

Now you'll have to move the files from their node-modules sub directories into the dist folder. The name you chose in napa is the name of the directory within node-modules.

##Concatenation
As stated above, the index.html makes an exahustive call to 25 external scripts, slowing down its load time dramatically. It is better for the load time, as well as for the neatness of the index.html code (especailly if you as a developer add more to it), if the external scripts are all concatenated into one file.

This requires a lot of copy+paste into a new file. Remember ORDER MATTERS when it comes to copying and pasting. Make sure to add the files one at a time in the order they are called in the index.html (Note: you can add all .js files to one file and call it more than once in index.html as there are two sections that call external .js scripts split by <div> sections).

Make sure to separate each code with comments incluing any necessary copyright information and a descriptor of which code is where so when you edit you can easily replace the code in that concatenated file.

Also note that .js and .css files cannot be concatenated together and should have their own files.

##Cleaning Up
At this point it is helpful to organize the dist folder further, so add a folder within dist to store all the cdn downloaded files you previously moved there. Also save the concatenated files to the dist folder, so they are easy to call in index.html (Note: see FOSS style guide for naming convention, but these should be named as "quindar-whateverappitis.js" or "quindar-whateverappitis.css" so those that read the code know what they are looking at).

###Example
```html
  <link type="text/css" rel="stylesheet" href="app/styles/styles.css">
  <link type="text/css" rel="stylesheet" href="app/styles/core.css">
  <link type="text/css" rel="stylesheet" href="app/styles/components.css">
  <link type="text/css" rel="stylesheet" href="app/styles/colors.css">
  <link rel="stylesheet" href="app/styles/angular-gridster.min.css" />
  <link rel="stylesheet" href="app/styles/gridsterDashboard.css" />
```
can now be:
```html
<link rel="stylesheet" href="app/dist/quindar-angular.css" />
```
##Use Cases
One can use this method to either:
- Clean up code they have developed for a new quindar app before pushing to Audacy github. If one is starting from scratch, it may be helpful to store the scripts one plans to call via cdn locally immediately, rather than write into the html then retrofit later.
- Clean up existing Audacy code when devleoping. Please note that all necessary files described above are in their respective folders. As a default, we keep the convention in index.html so one can understand each call as a new developer with the opportunity to replace them with the one-line call to either the concatenated javascript or css file.
