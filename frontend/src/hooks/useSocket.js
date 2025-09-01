import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketInstance = io(
        import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
        {
          auth: {
            userId: user.id,
          },
        }
      );

      socketInstance.emit('join_room', user.id);
      setSocket(socketInstance);

      return () => {
        socketInstance.close();
      };
    }
  }, [user]);

  return socket;
};
