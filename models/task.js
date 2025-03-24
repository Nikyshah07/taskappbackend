const mongoose=require('mongoose');
const taskSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
        
    },
    complete:[
        {
            type: mongoose.Types.ObjectId,
            ref: 'task',  
            required: true 
        }
    ],
    incomplete:[
        {
            type: mongoose.Types.ObjectId,
            ref: 'task',  
            required: true 
        }
    ],
    important:[
        {
            type: mongoose.Types.ObjectId,
            ref: 'task',  
            required: true 
        }
    ],
    user:[ {  // Reference to User schema
        type: mongoose.Types.ObjectId,
        ref: 'user',  // This tells mongoose to associate this field with the User collection
        required: true // Ensure every task is associated with a user
      }],
   
},{timestamps:true})

const Task=mongoose.model("task",taskSchema);
module.exports={Task}