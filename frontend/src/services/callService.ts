import { io, Socket } from 'socket.io-client';

class CallService {
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onIncomingCallCallback: ((data: { callerId: string, callerName: string }) => void) | null = null;
  private onCallAcceptedCallback: (() => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;

  init(uid: string) {
    if (this.socket) return;
    
    this.socket = io(window.location.origin.replace('3000', '5001').replace('3001', '5001'), {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.socket?.emit('identify', uid);
      console.log('[CALL] Identified as:', uid);
    });

    this.socket.on('incoming-call', (data) => {
      this.onIncomingCallCallback?.(data);
    });

    this.socket.on('call-accepted', () => {
      this.onCallAcceptedCallback?.();
    });

    this.socket.on('webrtc-signal', async ({ signal }) => {
      if (!this.pc) return;
      if (signal.type === 'offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.socket?.emit('webrtc-signal', { targetUid: this.targetUid, signal: answer });
      } else if (signal.type === 'answer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    this.socket.on('call-ended', () => {
      this.cleanup();
      this.onCallEndedCallback?.();
    });
  }

  private targetUid: string | null = null;

  async startCall(targetUid: string, callerId: string, callerName: string) {
    this.targetUid = targetUid;
    this.setupPeerConnection();
    
    // Get audio
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.localStream.getTracks().forEach(track => this.pc?.addTrack(track, this.localStream!));

    // Send call request
    this.socket?.emit('call-user', { targetUid, callerId, callerName });
  }

  async acceptCall(targetUid: string) {
    this.targetUid = targetUid;
    this.setupPeerConnection();

    // Get audio
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.localStream.getTracks().forEach(track => this.pc?.addTrack(track, this.localStream!));

    this.socket?.emit('accept-call', { targetUid });
  }

  private setupPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('webrtc-signal', { targetUid: this.targetUid, signal: event.candidate });
      }
    };

    this.pc.ontrack = (event) => {
      this.onRemoteStreamCallback?.(event.streams[0]);
    };

    // If we are the caller, we create the offer after setting up tracks
    // But we usually wait for 'call-accepted' to do it for better sync
  }

  async createOffer() {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket?.emit('webrtc-signal', { targetUid: this.targetUid, signal: offer });
  }

  toggleMute(isMuted: boolean) {
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
  }

  endCall(targetUid: string) {
    this.socket?.emit('end-call', { targetUid });
    this.cleanup();
  }

  private cleanup() {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.pc?.close();
    this.pc = null;
    this.localStream = null;
    this.targetUid = null;
  }

  onIncomingCall(cb: (data: { callerId: string, callerName: string }) => void) { this.onIncomingCallCallback = cb; }
  onCallAccepted(cb: () => void) { this.onCallAcceptedCallback = cb; }
  onRemoteStream(cb: (stream: MediaStream) => void) { this.onRemoteStreamCallback = cb; }
  onCallEnded(cb: () => void) { this.onCallEndedCallback = cb; }
}

export const callService = new CallService();
