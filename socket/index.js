import { Server as socketIO } from 'socket.io';

const rooms = {};
const roomSettings = {};

export const initializeSocket = (server) => {
  const io = new socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('createRoom', ({ roomId, isPrivate, password }) => {
      if (rooms[roomId]) {
        socket.emit('joinError', 'Room already exists.');
        return;
      }

      roomSettings[roomId] = {
        isPrivate,
        password,
        adminSocketId: socket.id,
        editable: true,
        members: [{ id: socket.id, name: 'Admin' }] // Assuming the creator is the admin
      };
      rooms[roomId] = '';
      socket.join(roomId);
      console.log('Room created: ', roomId);
      socket.emit('joinSuccess', {
        id: socket.id,
        roomId,
        name: 'Admin'
      })
    });

    socket.on('joinRoom', ({ roomId, password, name }) => {
      const roomInfo = roomSettings[roomId];
      console.log('Joining room: ', roomId, password, name, roomInfo)
      if (!roomInfo || (roomInfo.isPrivate && roomInfo.password !== password)) {
        socket.emit('joinError', 'Unable to join the room.');
        return;
      }
      socket.join(roomId);
      roomInfo.members.push({ id: socket.id, name });
      socket.emit('joinSuccess', {
        id: socket.id,
        roomId,
        name
      });
      socket.emit('codeUpdate', rooms[roomId] || '');
      socket.emit('setEditable', roomInfo.editable);
      console.log('Room joined: ', {
        id: socket.id,
        roomId,
        name
      });

      socket.to(roomId).emit('membersList', roomInfo.members);
    });

    socket.on('fetchMembers', (roomId) => {
      const roomInfo = roomSettings[roomId];
      if (roomInfo && roomInfo.adminSocketId === socket.id) {
        socket.emit('membersList', roomInfo.members);
      }
    });

    socket.on('codeEdit', ({ roomId, newCode }) => {
      const roomInfo = roomSettings[roomId];
      if (roomInfo && (roomInfo.editable || roomInfo.adminSocketId === socket.id)) {
        rooms[roomId] = newCode;
        socket.to(roomId).emit('codeUpdate', newCode);
      }
    });

    socket.on('toggleEditable', (roomId) => {
      const roomInfo = roomSettings[roomId];
      if (roomInfo && roomInfo.adminSocketId === socket.id) {
        roomInfo.editable = !roomInfo.editable;
        io.to(roomId).emit('setEditable', roomInfo.editable);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');

      Object.keys(roomSettings).forEach(roomId => {
        const roomInfo = roomSettings[roomId];

        if (roomInfo.adminSocketId === socket.id) {
          // Admin disconnected, close the room and emit room closed event
          socket.to(roomId).emit('roomClosed');
          delete rooms[roomId];
          delete roomSettings[roomId];
          return;
        }

        roomInfo.members = roomInfo.members.filter(member => member.id !== socket.id);

        if (roomInfo.members.length === 0) {
          delete rooms[roomId];
          delete roomSettings[roomId];
        }


        socket.to(roomId).emit('membersList', roomInfo.members);



      });
    });

    socket.on('leaveRoom', (roomId) => {
      const roomInfo = roomSettings[roomId];
      console.log('Leaving room: ', roomId, roomInfo);
      if (roomInfo) {
        roomInfo.members = roomInfo.members.filter(member => member.id !== socket.id);

        if (roomInfo.members.length === 0) {
          delete rooms[roomId];
          delete roomSettings[roomId];
        } else {
          socket.to(roomId).emit('membersList', roomInfo.members);
        }

        // Make the socket leave the room.
        socket.leave(roomId);

        if (roomInfo.adminSocketId === socket.id) {
          socket.to(roomId).emit('roomClosed');
          delete rooms[roomId];
          delete roomSettings[roomId];
        }
      }
    });

  });
};
