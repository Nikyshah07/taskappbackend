const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const bcrypt=require('bcrypt')
const {User}=require('./models/user.js')
const app=express()
const jwt=require('jsonwebtoken');
const { authentiCate } = require("./middleware.js");
const { Task } = require("./models/task.js");

const dotenv=require('dotenv')
dotenv.config()
// app.use(cors())
app.use(express.json())
app.get('/',(req,res)=>{
    res.send("helloo")
})
const corsOptions = {
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow Authorization header
};

app.use(cors(corsOptions));

const response=mongoose.connect(`${process.env.URL}`,{useNewUrlParser: true,
    useUnifiedTopology: true,
  });
if(response)
{
    console.log("Connected to db");

}
else{
    console.log("Not Connected to db");
}
app.post('/sign',async (req,res)=>{
    const {name,email,password}=req.body;
    const existingUser=await User.findOne({email});
    if(existingUser)
    {
        return res.status(400).json({message:"User already exist"});
    }
    const hashPassword=await bcrypt.hash(password,10);
    const newUser=new User({name,email,password:hashPassword})
    await newUser.save()
    return res.status(200).json({
        user:newUser,
        message:"Sign in successfully..."

    })
    
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password" });
    }
     const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    
    const isValidPassword = await bcrypt.compare(password, user.password);
  
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });

    }
    const token=jwt.sign({userId:user._id},`${process.env.JWT}`)
    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token:token,
      message: "Log in successfully",
    });
    
  });
  


  app.post('/addtask',authentiCate,async(req,res)=>{
const {title,description}=req.body;
const userId = req.user.userId; 
const newTask=new Task({title,description,user:userId});
await newTask.save();

await User.findByIdAndUpdate(req.user.userId,{$push:{tasks:newTask._id}})
await Task.findByIdAndUpdate(newTask._id,{incomplete:newTask._id})

return res.status(200).json({message:"Task added successfully...",task:newTask})
  })



  app.get('/getalltasks', authentiCate, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Find all tasks that belong to this user
      const tasks = await Task.find({ user: userId });
      
      return res.status(200).json({ 
        message: "Tasks retrieved successfully", 
        tasks: tasks 
      });

    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });



app.delete("/delete/:taskId",authentiCate,async(req,res)=>{
  const id=req.params.taskId;
  const userId=req.user.userId;
  try{
  const tasks=await Task.findByIdAndDelete(id,{$pull:{user:userId}})
  await User.findByIdAndUpdate(req.user.userId,{$pull:{tasks:id}})
  return res.status(200).json({message:"Task deleted successfully",tasks:tasks})
  }
  catch(err)
  {
    return res.status(400).json({message:"Error in deleting task"})
  }
})

app.get('/getincomplete',authentiCate,async(req,res)=>{
  const userId=req.user.userId;
  try{
  
  const tasks=await Task.find({user:userId});
  
 const incompleteTasks=tasks.filter(task=>task.incomplete.includes(task._id));
 return res.status(200).json({message:"Incomplete tsak retrive",tasks:incompleteTasks})
  }catch(error)
  {
    console.error("Error fetching incomplete tasks:", error);
    return res.status(500).json({ message: "Server error" });
  }

})

app.put('/addtocomplete/:taskId', authentiCate, async(req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.taskId;
  try {
    // First verify the task belongs to this user
    const task = await Task.find({ user: userId});
    if (!task) {
      return res.status(404).json({message: "Task not found or not authorized"});
    }
    
    // Update the task to mark it as complete
    await Task.findByIdAndUpdate(taskId, {
      $push: {complete: taskId},
      $pull: {incomplete: taskId} // Remove from incomplete if needed
    });
    
    return res.status(200).json({message: "Task added to complete"});
  }
  catch(err) {
    console.error("Error completing task:", err);
    return res.status(500).json({message: "Error in adding to complete"});
  }
});


app.get('/getcomplete',authentiCate,async(req,res)=>{

  try{
const userId=req.user.userId;
const tasks=await Task.find({user:userId});

const completeTasks=tasks.filter(task=>task.complete.includes(task._id));
return res.status(200).json({message:"complete tsak retrive",tasks:completeTasks})
}catch(error)
{
  console.error("Error fetching complete tasks:", error);
  return res.status(500).json({ message: "Server error" });
}

})

app.put('/addtoincomplete/:taskId',authentiCate,async(req,res)=>{
  
  const userId = req.user.userId; 
  const taskId=req.params.taskId;
  try{
    const task = await Task.find({ user: userId});
    if (!task) {
      return res.status(404).json({message: "Task not found or not authorized"});
    }
  await Task.findByIdAndUpdate(taskId,{$push:{incomplete:taskId},$pull:{complete:taskId}})
  
  return res.status(200).json({message:"Task added to incomplete successfully..."})
  }catch(err)
  {

  }
    })
  

app.put('/addtoimportant/:taskId',authentiCate,async(req,res)=>{
  const userId=req.user.userId;
  const taskId=req.params.taskId;
try{
  const tasks=await Task.findByIdAndUpdate(taskId,{$push:{important:taskId}})
  return res.status(200).json({message:"Added task to important",tasks:tasks})
}
catch(err)
{
  console.error("Error in import  task:", err);
  return res.status(500).json({message: "Error in adding to important"});
}
})

app.get('/getimportant',authentiCate,async(req,res)=>{
  const userId=req.user.userId;
  try{
  const tasks=await Task.find({user:userId});
  const ImportantTasks=tasks.filter(task=>task.important.includes(task._id));
  if(!tasks)
  {
    return res.status(200).json({message:'No tasks available'})
  }
  return res.status(200).json({tasks:ImportantTasks})
}catch(error)
{
  console.error("Error fetching incomplete tasks:", error);
    return res.status(500).json({ message: "Server error" });
}
})

  // app.get("/userdata",authentiCate,(req,res)=>{
  //   return res.status(200).json({message:"get user data"})
  // })
  app.put('/removeImportant/:taskId',authentiCate,async(req,res)=>{
    const taskId=req.params.taskId;
    try{
      const tasks=await Task.findByIdAndUpdate(taskId,{$pull:{important:taskId}})
      return res.status(200).json({message:"remove from important",tasks:tasks})
    }
    catch(error){
      console.error("Error in removing important  tasks:", error);
      return res.status(500).json({ message: "Server error" });
    }
  })

  app.get('/getedittask/:taskId',authentiCate,async(req,res)=>{
    const userId=req.user.userId;
    const taskId=req.params.taskId;
    try{
    const tasks=await Task.findById(taskId);
    return res.status(200).json(tasks)
    }
    catch(error)
    {
      console.error("Error in fetching updating tasks:", error);
    return res.status(500).json({ message: "Server error" }); 
    }
    
  })

  app.put("/edittask/:taskId",authentiCate,async(req,res)=>{
    const {title,description}=req.body;
    const taskId=req.params.taskId;
    try{
      const updatetasks=await Task.findByIdAndUpdate(taskId,
        { $set: { title, description } },
      { new: true } 
      )
      if(!updatetasks)
      {
        return res.status(200).json({message:"Task not found"})
      }
      return res.status(200).json({message:"Task update successfully...",tasks:updatetasks})
    }
    catch(error)
    {
      console.error("Error in  updating tasks:", error);
    return res.status(500).json({ message: "Server error" }); 
    }
  })
app.listen(`${process.env.PORT}`,(req,res)=>{
    console.log("server started..")
})
