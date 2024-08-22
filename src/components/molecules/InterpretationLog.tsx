import * as React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import Highlight from 'react-highlight';
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketStore } from "../../context/socket";

export const InterpretationLog = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [log, setLog] = useState<string>('');

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const toggleDrawer = (newOpen: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setOpen(newOpen);
  };

  const { socket } = useSocketStore();

  const scrollLogToBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLog = useCallback((msg: string, date: boolean = true) => {
    if (!date) {
      setLog((prevState) => prevState + '\n' + msg);
    } else {
      setLog((prevState) => prevState + '\n' + `[${new Date().toLocaleString()}] ` + msg);
    }
    scrollLogToBottom();
  }, [scrollLogToBottom]);

  const handleSerializableCallback = useCallback((data: string) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Serializable output data received ----------' + '\n'
      + JSON.stringify(data, null, 2) + '\n' + '--------------------------------------------------');
    scrollLogToBottom();
  }, [scrollLogToBottom]);

  const handleBinaryCallback = useCallback(({ data, mimetype }: any) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Binary output data received ----------' + '\n'
      + `mimetype: ${mimetype}` + '\n' + `data: ${JSON.stringify(data)}` + '\n'
      + '------------------------------------------------');
    scrollLogToBottom();
  }, [scrollLogToBottom]);

  useEffect(() => {
    socket?.on('log', handleLog);
    socket?.on('serializableCallback', handleSerializableCallback);
    socket?.on('binaryCallback', handleBinaryCallback);
    return () => {
      socket?.off('log', handleLog);
      socket?.off('serializableCallback', handleSerializableCallback);
      socket?.off('binaryCallback', handleBinaryCallback);
    };
  }, [socket, handleLog]);

  return (
    <div>
      <button onClick={toggleDrawer(true)} style={{ color: 'white', background: '#3f4853', border: 'none', padding: '10px 20px' }}>
        Interpretation Log
      </button>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        PaperProps={{
          sx: { background: '#19171c', color: 'white', padding: '10px' }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Interpretation Log
        </Typography>
        <div style={{
          height: '50vh',
          overflowY: 'scroll',
          padding: '10px',
          background: '#19171c',
        }}>
          <Highlight className="javascript">
            {log}
          </Highlight>
          <div style={{ float: "left", clear: "both" }}
            ref={logEndRef} />
        </div>
      </SwipeableDrawer>
    </div>
  );
}
