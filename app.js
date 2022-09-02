/////////////////////////////////// Requiring the npm modules ////////////////////////////////////////
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose =  require("mongoose");
const _ = require("lodash");

//////////////////////////////////////// Setting up the app //////////////////////////////////////////
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

/////////////////////////////////////// Fetching the date ////////////////////////////////////////////
const day = new Date();
var options = {
  weekday : "long",
  day : "numeric",
  month : "long"
};
const today = day.toLocaleDateString("en-IN", options);


///////////////////////////////////////Connecting to Database//////////////////////////////////////////
const adminPassword = "test123";
mongoose.connect("mongodb+srv://admin-pranjit:"+ adminPassword +"@cluster0.i51gd.mongodb.net/dailyDB",{useNewUrlParser: true});


///////////////////////////////////////Creating the Schemas//////////////////////////////////////////////
const listSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    }
});
const List = mongoose.model("List", listSchema);

const groupSchema = new mongoose.Schema({
    name: String,
    lists: [listSchema]
});
const Group = mongoose.model("Group", groupSchema);


//////////////////////////////////////Creating Default Data////////////////////////////////////////////
const task1 = new List({
    task: "Welcome to your To-Do List."
});
const task2 = new List({
    task: "👈 Click this to check-off a task."
});
const task3 = new List({
    task: "To add a new task, click here 👇"
});
const tasks = [task1, task2, task3];
var currentHeading = today;

List.deleteMany({},function(err){
    if(err){
        res.send(err);
    }
});
Group.deleteMany({},function(err){
    if(err){
        res.send(err);
    }
});










app.get("/", function(req,res){
    if(currentHeading===today)
    {
        List.find({}, function(err, foundTasks){
            if(err){
                res.send(err);
            }else{
                if(foundTasks.length===0){
                    List.insertMany([task1, task2, task3]).catch(function(err){
                        console.log(err);
                    });
                    res.redirect("/");
                }else{
                    res.render("index", {heading: today, tasks: foundTasks});
                }
            }
        });
    }else{
        Group.findOne({name: currentHeading}, function(err, foundList){
            if(err){
                res.send(err);
            }else{
                if(foundList.lists.length===0){
                    foundList.lists.push(task1);
                    foundList.lists.push(task2);
                    foundList.lists.push(task3);
                    foundList.save();
                }
                res.render("index", {heading: foundList.name, tasks: foundList.lists});
            }
        });
    }
    
});
app.get("/new", function(req, res){
    currentHeading = today;
    List.deleteMany({},function(err){
        if(err){
            res.send(err);
        }
    });
    res.redirect("/");
})
app.get("/create", function(req, res){
    res.render("createNewList");
});




app.post("/addItem", function(req,res){
    const task = new List({
        task: req.body.task
    });
    if(currentHeading===today){
        task.save();
    }else{
        Group.findOne({name: currentHeading}, function(err, foundList){
            foundList.lists.push(task);
            foundList.save();
        });
    }
    res.redirect("/");
});
app.post("/delete", function(req, res){
    const checkedTask = req.body.checked;
    if(currentHeading===today){
        List.findByIdAndDelete(checkedTask, function(err, foundTask){
            if(err){
                res.send(err);
            }
        });
    }else{
        Group.findOneAndUpdate({name: currentHeading}, {$pull: {lists: {_id: checkedTask}}}, function(err, foundList){
            if(err){
                res.send(err);
            }
        });
    }
    res.redirect("/");
});
app.post("/create", function(req, res){
    currentHeading = req.body.listTitle;
    Group.deleteMany({},function(err){
        if(err){
            res.send(err);
        }
    });
    Group.findOne({name: req.body.listTitle}, function(err, foundList){
        if(err){
            res.send(err);
        }else{
            if(!foundList){
                const customList = new Group({
                    name: req.body.listTitle,
                    lists: tasks
                });
                customList.save();
                res.render("index", {heading: req.body.listTitle, tasks: tasks});
            }else{
                res.redirect("/");
            }
        }
    });
});






////////////////////////////////// Listening to the Port////////////////////////////////////


let server_port = process.env.PORT;
if(server_port == null || server_port == ""){
  server_port = 3000;
}

app.listen(server_port, function(){
  console.log("Server has started successfully.");
});
