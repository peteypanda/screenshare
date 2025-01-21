"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSocket } from '@/hooks/useSocket';

const screens = [
  { id: 'pid1', name: 'PID 1' },
  { id: 'pid2', name: 'PID 2' },
  { id: 'pid3', name: 'PID 3' },
  { id: 'pid4', name: 'PID 4' },
  { id: 'outbound', name: 'Outbound Dock' },
  { id: 'dockclerk', name: 'Dock Clerk' },
];

export default function ControlUI() {
  const [isSharing, setIsSharing] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [isSelectingScreen, setIsSelectingScreen] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socket = useSocket();

  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    if (!socket) {
      addDebugMessage('Waiting for socket connection...');
      return;
    }

    const handleSignal = async (data: any) => {
      if (!peerConnection.current) return;

      try {
        if (data.type === 'answer') {
          addDebugMessage('Received answer');
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate' && data.candidate) {
          addDebugMessage('Received ICE candidate');
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        addDebugMessage(`Signal error: ${error}`);
        setError('Failed to establish connection');
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
      stopSharing();
    };
  }, [socket]);

  const initializePeerConnection = () => {
    addDebugMessage('Initializing peer connection');
    
    // Create new RTCPeerConnection with multiple STUN servers for better connectivity
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10
    });

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (!socket || !selectedScreen) return;
      
      if (event.candidate) {
        addDebugMessage('Sending ICE candidate');
        socket.emit('signal', {
          type: 'candidate',
          candidate: event.candidate,
          screenName: selectedScreen
        });
      }
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      addDebugMessage(`Connection state changed to: ${state}`);
      
      if (state === 'failed') {
        setError('Connection failed. Attempting to reconnect...');
        // Attempt to reconnect
        setTimeout(() => {
          if (isSharing) {
            addDebugMessage('Attempting to reconnect...');
            confirmSharing();
          }
        }, 2000);
      }
    };

    // Handle ICE connection state changes
    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current?.iceConnectionState;
      addDebugMessage(`ICE connection state: ${state}`);
      
      if (state === 'failed') {
        peerConnection.current?.restartIce();
      }
    };
  };

  const startSharing = async () => {
    setError(null);
    setDebugInfo([]);
    setIsSelectingScreen(true);
  };

  const confirmSharing = async () => {
    if (!selectedScreen || !socket) {
      setError('Please select a screen to share');
      return;
    }

    addDebugMessage(`Starting share process for screen: ${selectedScreen}`);
    socket.emit('join-room', selectedScreen);

    try {
      let stream: MediaStream;

      if (screenshot) {
        const img = new Image();
        img.src = URL.createObjectURL(screenshot);
        await new Promise((resolve) => (img.onload = resolve));
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        stream = canvas.captureStream();
        addDebugMessage('Created stream from screenshot');
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { 
            cursor: 'always',
            displaySurface: 'monitor'
          } 
        });
        addDebugMessage('Got display media stream');
      }

      streamRef.current = stream;

      // Initialize peer connection
      initializePeerConnection();

      if (!peerConnection.current) {
        throw new Error('Failed to initialize peer connection');
      }

      // Add tracks to the peer connection
      stream.getTracks().forEach(track => {
        if (peerConnection.current && streamRef.current) {
          peerConnection.current.addTrack(track, streamRef.current);
        }
      });
      addDebugMessage('Added tracks to peer connection');

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      addDebugMessage('Created and set local description');

      socket.emit('signal', {
        type: 'offer',
        offer,
        screenName: selectedScreen
      });
      addDebugMessage('Sent offer');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsSharing(true);
      setIsSelectingScreen(false);

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        addDebugMessage('Stream ended by user');
        stopSharing();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      addDebugMessage(`Error: ${error}`);
      setError('Failed to start screen sharing');
      setIsSelectingScreen(false);
    }
  };

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (socket && selectedScreen) {
      socket.emit('stop-screenshare', { screenName: selectedScreen });
      addDebugMessage('Sent stop-screenshare signal');
    }

    setIsSharing(false);
    setSelectedScreen(null);
    setScreenshot(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Screen Sharing Control</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="space-y-6 w-full max-w-md">
        <div className="flex space-x-4">
          <Button onClick={startSharing} disabled={isSharing} className="flex-1">
            Start Sharing
          </Button>
          <Button onClick={stopSharing} disabled={!isSharing} variant="destructive" className="flex-1">
            Stop Sharing
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="screenshot-upload">Upload Screenshot</Label>
          <Input
            id="screenshot-upload"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setScreenshot(file);
            }}
            accept="image/*"
            disabled={isSharing}
          />
        </div>
      </div>
      <div className="mt-6 w-full max-w-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full border border-gray-300 rounded-lg"
        />
      </div>
      {isSharing && selectedScreen && (
        <div className="mt-4 text-center">
          <p className="text-green-600 font-semibold">
            Currently sharing to: {screens.find((s) => s.id === selectedScreen)?.name}
            {screenshot ? " (Screenshot)" : ""}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Viewer URL: {`${window.location.origin}/viewer?screen=${selectedScreen}`}
          </p>
        </div>
      )}

      <Dialog open={isSelectingScreen} onOpenChange={setIsSelectingScreen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Screen to Share To</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={(value) => setSelectedScreen(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a screen" />
              </SelectTrigger>
              <SelectContent>
                {screens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={confirmSharing} disabled={!selectedScreen} className="w-full">
              Confirm and Start Sharing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug information */}
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 max-h-48 overflow-auto">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        {debugInfo.map((msg, i) => (
          <div key={i} className="text-sm">{msg}</div>
        ))}
      </div>
    </div>
  );
}