const path =require('path');
const http =require('http');
const express = require("express");
const socketio=require('socket.io');
const formatMessage=require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users')


const app =express();
const server=http.createServer(app);
const io=socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));
const botName="Admin"

//run when cliet connects
io.on('connection',socket =>{
socket.on('joinRoom',({username,room})=>{

  const user=userJoin(socket.id,username,room)

  socket.join(user.room);

  socket.emit('message',formatMessage(botName,'Welcome to chat'));

  //broadcast when a user connects
  socket.broadcast.to(user.room).emit('message',formatMessage(botName,` ${user.username} has joind the chat`));

  //send romm and user info
  io.to(user.room).emit('roomUsers',{
    room:user.room,
    users:getRoomUsers(user.room)
  });
});





  //listen for chatMessage
  socket.on('chatMessage',(msg)=>{
    const user =getCurrentUser((socket.id))
    io.to(user.room).emit('message',formatMessage(user.username,msg));
  });


  //runs when client disconnects
  socket.on('disconnect',()=>{
    const user=userLeave(socket.id);
    if(user){
      io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
    };
    io.in(user.room).emit('roomUsers',{
      room:user.room,
      users:getRoomUsers(user.room)
    });


  });
});

const PORT=3000 || process.env.PORT; //will look to see if enviorment variable named port is there

server.listen(PORT,()=> console.log(`Server running on port ${PORT}`));
