(() => {
  const ui = {
    status: document.getElementById("chat-status"),
    nameInput: document.getElementById("display-name"),
    messageInput: document.getElementById("chat-text"),
    sendBtn: document.getElementById("send-chat"),
    messages: document.getElementById("message-feed"),
    peerCount: document.getElementById("peer-count"),
    inviteBtn: document.getElementById("make-invite"),
    inviteOutput: document.getElementById("invite-output"),
    answerInput: document.getElementById("answer-input"),
    acceptAnswerBtn: document.getElementById("accept-answer"),
    joinOfferInput: document.getElementById("join-offer"),
    joinAnswerOutput: document.getElementById("join-answer"),
    joinBtn: document.getElementById("join-btn"),
  };

  const peers = new Map();
  const seenMessages = new Set();
  let pendingHostPeer = null;
  let actingAsHost = false;

  const randomId = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const setStatus = (text) => {
    ui.status.textContent = text;
  };

  const displayName = () => ui.nameInput.value.trim() || "Guest";

  const persistName = () => {
    try {
      localStorage.setItem("p2p_chat_name", displayName());
    } catch {
      /* ignore */
    }
  };

  const loadName = () => {
    try {
      const saved = localStorage.getItem("p2p_chat_name");
      if (saved) ui.nameInput.value = saved;
    } catch {
      /* ignore */
    }
    if (!ui.nameInput.value.trim()) {
      ui.nameInput.value = `Guest-${Math.floor(Math.random() * 9999)}`;
    }
  };

  const updatePeerCount = () => {
    ui.peerCount.textContent = peers.size;
  };

  const addMessage = ({ from, text, timestamp }, isLocal) => {
    const row = document.createElement("div");
    row.className = `message-row${isLocal ? " local" : ""}`;

    const header = document.createElement("div");
    header.className = "message-header";
    header.textContent = `${from} • ${new Date(timestamp).toLocaleTimeString()}`;

    const body = document.createElement("div");
    body.className = "message-body";
    body.textContent = text;

    row.appendChild(header);
    row.appendChild(body);
    ui.messages.appendChild(row);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  };

  const encodeSignal = (desc) => btoa(JSON.stringify(desc));
  const decodeSignal = (text) => JSON.parse(atob(text));

  const waitForIce = (pc) =>
    pc.iceGatheringState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => {
          const check = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", check);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", check);
        });

  const broadcast = (payload, ignorePeer) => {
    const serialized = JSON.stringify(payload);
    peers.forEach((info, peerId) => {
      if (peerId === ignorePeer) return;
      const channel = info.channel;
      if (channel && channel.readyState === "open") {
        channel.send(serialized);
      }
    });
  };

  const handleIncoming = (payload, sourceId) => {
    if (!payload || seenMessages.has(payload.id)) return;
    seenMessages.add(payload.id);
    addMessage(payload, payload.from === displayName());

    if (actingAsHost) {
      broadcast(payload, sourceId);
    }
  };

  const setupChannel = (peerId, channel) => {
    const info = peers.get(peerId);
    info.channel = channel;

    channel.onopen = () => {
      updatePeerCount();
      setStatus(`Connected to ${peers.size} peer(s).`);
    };
    channel.onclose = () => {
      peers.delete(peerId);
      updatePeerCount();
      setStatus("Peer disconnected.");
    };
    channel.onerror = () => setStatus("Data channel error. Try reconnecting.");
    channel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleIncoming(payload, peerId);
      } catch {
        /* ignore bad payloads */
      }
    };
  };

  const createPeer = (peerId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peers.set(peerId, { pc, channel: null });

    if (isInitiator) {
      const channel = pc.createDataChannel("p2p-chat");
      setupChannel(peerId, channel);
    } else {
      pc.ondatachannel = (event) => setupChannel(peerId, event.channel);
    }

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(pc.connectionState)) {
        peers.delete(peerId);
        updatePeerCount();
      }
    };

    return pc;
  };

  const createInvite = async () => {
    actingAsHost = true;
    const peerId = `peer-${randomId().slice(0, 8)}`;
    const pc = createPeer(peerId, true);
    pendingHostPeer = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);

    ui.inviteOutput.value = encodeSignal(pc.localDescription);
    setStatus("Invite ready. Share it and wait for an answer.");
  };

  const acceptAnswer = async () => {
    if (!pendingHostPeer) {
      setStatus("Make an invite before attaching an answer.");
      return;
    }
    const answerText = ui.answerInput.value.trim();
    if (!answerText) {
      setStatus("Paste an answer to finish connecting.");
      return;
    }
    try {
      const answer = decodeSignal(answerText);
      await pendingHostPeer.setRemoteDescription(answer);
      setStatus("Connected! Create another invite to add more peers.");
      pendingHostPeer = null;
    } catch {
      setStatus("Could not read that answer. Double-check and try again.");
    }
  };

  const joinFromOffer = async () => {
    const offerText = ui.joinOfferInput.value.trim();
    if (!offerText) {
      setStatus("Paste a host invite to generate an answer.");
      return;
    }
    try {
      const offer = decodeSignal(offerText);
      const peerId = `host-${randomId().slice(0, 8)}`;
      const pc = createPeer(peerId, false);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIce(pc);
      ui.joinAnswerOutput.value = encodeSignal(pc.localDescription);
      setStatus("Send your answer back to the host, then start chatting.");
    } catch {
      setStatus("That invite didn't look right. Try again.");
    }
  };

  const sendChat = () => {
    const text = ui.messageInput.value.trim();
    if (!text) return;

    const payload = {
      id: randomId(),
      from: displayName(),
      text,
      timestamp: Date.now(),
    };
    seenMessages.add(payload.id);
    addMessage(payload, true);
    broadcast(payload);
    ui.messageInput.value = "";
  };

  const init = () => {
    loadName();
    persistName();
    setStatus("Start by creating an invite or joining one.");
    updatePeerCount();

    ui.nameInput.addEventListener("input", persistName);
    ui.sendBtn.addEventListener("click", sendChat);
    ui.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
    ui.inviteBtn.addEventListener("click", createInvite);
    ui.acceptAnswerBtn.addEventListener("click", acceptAnswer);
    ui.joinBtn.addEventListener("click", joinFromOffer);
  };

  init();
})();
