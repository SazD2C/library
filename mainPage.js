//mainPage.js -- controls the main html page
const {ipcRenderer} = require('electron');
var sys = require('sys');
var exec = require('child_process').exec;


function main() {
  //check for a manifest.json for downloaded lessons
  var checkForLessons = exec("py pythonClient.py"); //On windows we can change this out to a compiled .exe of the program later -- We don't need to check if it fails or not really :shrug:
  checkForLessons.stdout.on('data', function(data){
    if(data==1) {
      // There is no manifest implying either the user deleted it like a dick (or is forcing the program to reinstall it) or this is a first run of the Program
      // lets just tell the user there is no manifest and ask if he wants to download it
      document.getElementById('main').innerHTML = "You don't seem to have a manifest, let us download one from our servers!";
      checkForLessons.stdout.end(); //End the old pythonClient since we're done with it ((we ended it on the python side, but we're gonna do it again juuuuuust to make sure))
      var downloadManifest = exec("py pythonClient.py");
      downloadManifest.stdout.on("data", function(data){
        if(data==0){
          location.reload();
        }
        if(data==1){
          document.getElementById("main").innerHTML = "Download Failed"
        }
      });
      downloadManifest.stdin.write("downloadManifest()#none"+"\n")
    }
    if(data==0){
      checkForLessons.stdout.end();
      document.getElementById("main").innerHTML = "Loading the Manifest"
      var getManifestData = exec("py pythonClient.py");
      getManifestData.stdout.on('data', function(data){

        data = JSON.parse(data)
        var mainDiv = document.getElementById("mainCont")
        //mainDiv.id = "mainDiv"
        //make our main div
        var mainButDiv = document.createElement("div")
        mainDiv.appendChild(mainButDiv)
        for (var topics in data){

          //each topics in this list is a topic we have
          var topicDiv = document.createElement("div")
          topicDiv.id = "topicDiv"
          mainButDiv.appendChild(topicDiv)
          //Buttons

          //Make our topics div

          var button = document.createElement("button")
          topicDiv.appendChild(button);
          button.innerHTML = topics
          button.id = topics
          var lessonsDiv = document.createElement("div")
          lessonsDiv.id = topics+"lessonsDiv"
          lessonsDiv.style.display = "none"
          topicDiv.appendChild(lessonsDiv)
          button.addEventListener("click",  function(y, x = this.id){

            x = x + "lessonsDiv"

            if(document.getElementById(x).style.display=="none"){
              document.getElementById(x).style.display = "block";


            }else {
              document.getElementById(x).style.display = "none";

            }
          });



          //Add the lessons buttons

          for (var lessons in data[topics]) {
            var button = document.createElement("button")
            button.id = topics+":"+lessons
            button.addEventListener('click', function(x, name = this.id){
              document.getElementById("mainCont").style.visibility = "hidden" // So we can load the new page, and if they choose to go back we can re pull it up\

              document.getElementById("main").innerHTML = "Loading "+name
              var checkForLesson = exec("py pythonClient.py");
              checkForLesson.stdout.on('data', function(data){
                if(data==0){
                  checkForLesson.stdout.end()
                  //open lesson "name"
                  var lessonData = name.split(":")
                  var topic = lessonData[0]
                  var lesson = lessonData[1]
                  console.log('switching windows')
                  ipcRenderer.send("loadLesson()", topic, lesson)
                }
                if(data==1){

                  document.getElementById('main').innerHTML = "You don't have this lesson, would you like to download it?"
                  buttonDivs = document.createElement("div")
                  document.body.appendChild(buttonDivs) //need to change this
                  //yes
                  yesButton = document.createElement('button')
                  yesButton.innerHTML = "Yes"
                  buttonDivs.appendChild(yesButton)
                  yesButton.addEventListener("click", function(){
                    var downloadLesson = exec("py pythonClient.py")
                    downloadLesson.stdout.on('data', function(data){

                      if(data ==1) {
                        document.getElementById("main").innerHTML = "There was an error downloading the lessons!"
                      }else {
                        console.log("data")
                      }
                    });

                    downloadLesson.stdin.write("downloadLesson()#"+name)
                  });
                  //no
                  noButton = document.createElement('button')
                  noButton.innerHTML = "No"
                  buttonDivs.appendChild(noButton)
                  noButton.addEventListener("click", function(){
                    location.reload(); //Just sends us back to the start
                  });

                }
              });
              checkForLesson.stdin.write("checkForLesson()#"+name+"\n");
            });
            button.innerHTML = lessons
            lessonsDiv.appendChild(button)
          }
          document.getElementById("main").innerHTML = "Manifest"
        }
      });
      getManifestData.stdin.write("getManifestData()#none"+"\n")
    }
  });
  checkForLessons.stdin.write("checkManifest()#none"+"\n"); //Sends the command to the client

}
document.addEventListener('DOMContentLoaded', function() {
  main();

});
