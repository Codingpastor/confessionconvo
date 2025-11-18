(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const e of n.addedNodes)e.tagName==="LINK"&&e.rel==="modulepreload"&&a(e)}).observe(document,{childList:!0,subtree:!0});function o(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(s){if(s.ep)return;s.ep=!0;const n=o(s);fetch(s.href,n)}})();function x(){return x=Object.assign?Object.assign.bind():function(i){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)({}).hasOwnProperty.call(o,a)&&(i[a]=o[a])}return i},x.apply(null,arguments)}function z(i){const t=new Uint8Array(i);return window.btoa(String.fromCharCode(...t))}function G(i){const t=window.atob(i),o=t.length,a=new Uint8Array(o);for(let s=0;s<o;s++)a[s]=t.charCodeAt(s);return a.buffer}const J=new Blob([`
      const BIAS = 0x84;
      const CLIP = 32635;
      const encodeTable = [
        0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
        4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7
      ];
      
      function encodeSample(sample) {
        let sign;
        let exponent;
        let mantissa;
        let muLawSample;
        sign = (sample >> 8) & 0x80;
        if (sign !== 0) sample = -sample;
        sample = sample + BIAS;
        if (sample > CLIP) sample = CLIP;
        exponent = encodeTable[(sample>>7) & 0xFF];
        mantissa = (sample >> (exponent+3)) & 0x0F;
        muLawSample = ~(sign | (exponent << 4) | mantissa);
        
        return muLawSample;
      }
    
      class RawAudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
                    
          this.port.onmessage = ({ data }) => {
            switch (data.type) {
              case "setFormat":
                this.isMuted = false;
                this.buffer = []; // Initialize an empty buffer
                this.bufferSize = data.sampleRate / 4;
                this.format = data.format;

                if (globalThis.LibSampleRate && sampleRate !== data.sampleRate) {
                  globalThis.LibSampleRate.create(1, sampleRate, data.sampleRate).then(resampler => {
                    this.resampler = resampler;
                  });
                }
                break;
              case "setMuted":
                this.isMuted = data.isMuted;
                break;
            }
          };
        }
        process(inputs) {
          if (!this.buffer) {
            return true;
          }
          
          const input = inputs[0]; // Get the first input node
          if (input.length > 0) {
            let channelData = input[0]; // Get the first channel's data

            // Resample the audio if necessary
            if (this.resampler) {
              channelData = this.resampler.full(channelData);
            }

            // Add channel data to the buffer
            this.buffer.push(...channelData);
            // Get max volume 
            let sum = 0.0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const maxVolume = Math.sqrt(sum / channelData.length);
            // Check if buffer size has reached or exceeded the threshold
            if (this.buffer.length >= this.bufferSize) {
              const float32Array = this.isMuted 
                ? new Float32Array(this.buffer.length)
                : new Float32Array(this.buffer);

              let encodedArray = this.format === "ulaw"
                ? new Uint8Array(float32Array.length)
                : new Int16Array(float32Array.length);

              // Iterate through the Float32Array and convert each sample to PCM16
              for (let i = 0; i < float32Array.length; i++) {
                // Clamp the value to the range [-1, 1]
                let sample = Math.max(-1, Math.min(1, float32Array[i]));

                // Scale the sample to the range [-32768, 32767]
                let value = sample < 0 ? sample * 32768 : sample * 32767;
                if (this.format === "ulaw") {
                  value = encodeSample(Math.round(value));
                }

                encodedArray[i] = value;
              }

              // Send the buffered data to the main script
              this.port.postMessage([encodedArray, maxVolume]);

              // Clear the buffer after sending
              this.buffer = [];
            }
          }
          return true; // Continue processing
        }
      }
      registerProcessor("raw-audio-processor", RawAudioProcessor);
  `],{type:"application/javascript"}),H=URL.createObjectURL(J);function j(){return["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document}class L{static async create({sampleRate:t,format:o,preferHeadphonesForIosDevices:a}){let s=null,n=null;try{const l={sampleRate:{ideal:t},echoCancellation:{ideal:!0},noiseSuppression:{ideal:!0}};if(j()&&a){const C=(await window.navigator.mediaDevices.enumerateDevices()).find(k=>k.kind==="audioinput"&&["airpod","headphone","earphone"].find(m=>k.label.toLowerCase().includes(m)));C&&(l.deviceId={ideal:C.deviceId})}const h=navigator.mediaDevices.getSupportedConstraints().sampleRate;s=new window.AudioContext(h?{sampleRate:t}:{});const v=s.createAnalyser();h||await s.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js"),await s.audioWorklet.addModule(H),n=await navigator.mediaDevices.getUserMedia({audio:l});const _=s.createMediaStreamSource(n),y=new AudioWorkletNode(s,"raw-audio-processor");return y.port.postMessage({type:"setFormat",format:o,sampleRate:t}),_.connect(v),v.connect(y),await s.resume(),new L(s,v,y,n)}catch(l){var e,r;throw(e=n)==null||e.getTracks().forEach(h=>h.stop()),(r=s)==null||r.close(),l}}constructor(t,o,a,s){this.context=void 0,this.analyser=void 0,this.worklet=void 0,this.inputStream=void 0,this.context=t,this.analyser=o,this.worklet=a,this.inputStream=s}async close(){this.inputStream.getTracks().forEach(t=>t.stop()),await this.context.close()}setMuted(t){this.worklet.port.postMessage({type:"setMuted",isMuted:t})}}const Y=new Blob([`
      const decodeTable = [0,132,396,924,1980,4092,8316,16764];
      
      export function decodeSample(muLawSample) {
        let sign;
        let exponent;
        let mantissa;
        let sample;
        muLawSample = ~muLawSample;
        sign = (muLawSample & 0x80);
        exponent = (muLawSample >> 4) & 0x07;
        mantissa = muLawSample & 0x0F;
        sample = decodeTable[exponent] + (mantissa << (exponent+3));
        if (sign !== 0) sample = -sample;

        return sample;
      }
      
      class AudioConcatProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffers = []; // Initialize an empty buffer
          this.cursor = 0;
          this.currentBuffer = null;
          this.wasInterrupted = false;
          this.finished = false;
          
          this.port.onmessage = ({ data }) => {
            switch (data.type) {
              case "setFormat":
                this.format = data.format;
                break;
              case "buffer":
                this.wasInterrupted = false;
                this.buffers.push(
                  this.format === "ulaw"
                    ? new Uint8Array(data.buffer)
                    : new Int16Array(data.buffer)
                );
                break;
              case "interrupt":
                this.wasInterrupted = true;
                break;
              case "clearInterrupted":
                if (this.wasInterrupted) {
                  this.wasInterrupted = false;
                  this.buffers = [];
                  this.currentBuffer = null;
                }
            }
          };
        }
        process(_, outputs) {
          let finished = false;
          const output = outputs[0][0];
          for (let i = 0; i < output.length; i++) {
            if (!this.currentBuffer) {
              if (this.buffers.length === 0) {
                finished = true;
                break;
              }
              this.currentBuffer = this.buffers.shift();
              this.cursor = 0;
            }

            let value = this.currentBuffer[this.cursor];
            if (this.format === "ulaw") {
              value = decodeSample(value);
            }
            output[i] = value / 32768;
            this.cursor++;

            if (this.cursor >= this.currentBuffer.length) {
              this.currentBuffer = null;
            }
          }

          if (this.finished !== finished) {
            this.finished = finished;
            this.port.postMessage({ type: "process", finished });
          }

          return true; // Continue processing
        }
      }

      registerProcessor("audio-concat-processor", AudioConcatProcessor);
    `],{type:"application/javascript"}),K=URL.createObjectURL(Y);class A{static async create({sampleRate:t,format:o}){let a=null;try{a=new AudioContext({sampleRate:t});const n=a.createAnalyser(),e=a.createGain();e.connect(n),n.connect(a.destination),await a.audioWorklet.addModule(K);const r=new AudioWorkletNode(a,"audio-concat-processor");return r.port.postMessage({type:"setFormat",format:o}),r.connect(e),await a.resume(),new A(a,n,e,r)}catch(n){var s;throw(s=a)==null||s.close(),n}}constructor(t,o,a,s){this.context=void 0,this.analyser=void 0,this.gain=void 0,this.worklet=void 0,this.context=t,this.analyser=o,this.gain=a,this.worklet=s}async close(){await this.context.close()}}function q(i){return!!i.type}class B{static async create(t){let o=null;try{var a;const n=(a=t.origin)!=null?a:"wss://api.elevenlabs.io",e=t.signedUrl?t.signedUrl:n+"/v1/convai/conversation?agent_id="+t.agentId,r=["convai"];t.authorization&&r.push(`bearer.${t.authorization}`),o=new WebSocket(e,r);const l=await new Promise((k,m)=>{o.addEventListener("open",()=>{var u;const d={type:"conversation_initiation_client_data"};var T,R,N,P;t.overrides&&(d.conversation_config_override={agent:{prompt:(T=t.overrides.agent)==null?void 0:T.prompt,first_message:(R=t.overrides.agent)==null?void 0:R.firstMessage,language:(N=t.overrides.agent)==null?void 0:N.language},tts:{voice_id:(P=t.overrides.tts)==null?void 0:P.voiceId}}),t.customLlmExtraBody&&(d.custom_llm_extra_body=t.customLlmExtraBody),t.dynamicVariables&&(d.dynamic_variables=t.dynamicVariables),(u=o)==null||u.send(JSON.stringify(d))},{once:!0}),o.addEventListener("error",u=>{setTimeout(()=>m(u),0)}),o.addEventListener("close",m),o.addEventListener("message",u=>{const d=JSON.parse(u.data);q(d)&&(d.type==="conversation_initiation_metadata"?k(d.conversation_initiation_metadata_event):console.warn("First received message is not conversation metadata."))},{once:!0})}),{conversation_id:h,agent_output_audio_format:v,user_input_audio_format:_}=l,y=O(_??"pcm_16000"),C=O(v);return new B(o,h,y,C)}catch(n){var s;throw(s=o)==null||s.close(),n}}constructor(t,o,a,s){this.socket=void 0,this.conversationId=void 0,this.inputFormat=void 0,this.outputFormat=void 0,this.queue=[],this.disconnectionDetails=null,this.onDisconnectCallback=null,this.onMessageCallback=null,this.socket=t,this.conversationId=o,this.inputFormat=a,this.outputFormat=s,this.socket.addEventListener("error",n=>{setTimeout(()=>this.disconnect({reason:"error",message:"The connection was closed due to a socket error.",context:n}),0)}),this.socket.addEventListener("close",n=>{this.disconnect(n.code===1e3?{reason:"agent",context:n}:{reason:"error",message:n.reason||"The connection was closed by the server.",context:n})}),this.socket.addEventListener("message",n=>{try{const e=JSON.parse(n.data);if(!q(e))return;this.onMessageCallback?this.onMessageCallback(e):this.queue.push(e)}catch{}})}close(){this.socket.close()}sendMessage(t){this.socket.send(JSON.stringify(t))}onMessage(t){this.onMessageCallback=t,this.queue.forEach(t),this.queue=[]}onDisconnect(t){this.onDisconnectCallback=t,this.disconnectionDetails&&t(this.disconnectionDetails)}disconnect(t){var o;this.disconnectionDetails||(this.disconnectionDetails=t,(o=this.onDisconnectCallback)==null||o.call(this,t))}}function O(i){const[t,o]=i.split("_");if(!["pcm","ulaw"].includes(t))throw new Error(`Invalid format: ${i}`);const a=parseInt(o);if(isNaN(a))throw new Error(`Invalid sample rate: ${o}`);return{format:t,sampleRate:a}}const Q={clientTools:{}},X={onConnect:()=>{},onDebug:()=>{},onDisconnect:()=>{},onError:()=>{},onMessage:()=>{},onAudio:()=>{},onModeChange:()=>{},onStatusChange:()=>{},onCanSendFeedbackChange:()=>{}};class E{static async startSession(t){const o=x({},Q,X,t);o.onStatusChange({status:"connecting"}),o.onCanSendFeedbackChange({canSendFeedback:!1});let a=null,s=null,n=null,e=null;try{var r,l;e=await navigator.mediaDevices.getUserMedia({audio:!0});const m=(r=t.connectionDelay)!=null?r:{default:0,android:3e3};let u=m.default;var h;if(/android/i.test(navigator.userAgent))u=(h=m.android)!=null?h:u;else if(j()){var v;u=(v=m.ios)!=null?v:u}return u>0&&await new Promise(d=>setTimeout(d,u)),s=await B.create(t),[a,n]=await Promise.all([L.create(x({},s.inputFormat,{preferHeadphonesForIosDevices:t.preferHeadphonesForIosDevices})),A.create(s.outputFormat)]),(l=e)==null||l.getTracks().forEach(d=>d.stop()),e=null,new E(o,s,a,n)}catch(m){var _,y,C,k;throw o.onStatusChange({status:"disconnected"}),(_=e)==null||_.getTracks().forEach(u=>u.stop()),(y=s)==null||y.close(),await((C=a)==null?void 0:C.close()),await((k=n)==null?void 0:k.close()),m}}constructor(t,o,a,s){var n=this;this.options=void 0,this.connection=void 0,this.input=void 0,this.output=void 0,this.lastInterruptTimestamp=0,this.mode="listening",this.status="connecting",this.inputFrequencyData=void 0,this.outputFrequencyData=void 0,this.volume=1,this.currentEventId=1,this.lastFeedbackEventId=1,this.canSendFeedback=!1,this.endSession=()=>this.endSessionWithDetails({reason:"user"}),this.endSessionWithDetails=async function(e){n.status!=="connected"&&n.status!=="connecting"||(n.updateStatus("disconnecting"),n.connection.close(),await n.input.close(),await n.output.close(),n.updateStatus("disconnected"),n.options.onDisconnect(e))},this.updateMode=e=>{e!==this.mode&&(this.mode=e,this.options.onModeChange({mode:e}))},this.updateStatus=e=>{e!==this.status&&(this.status=e,this.options.onStatusChange({status:e}))},this.updateCanSendFeedback=()=>{const e=this.currentEventId!==this.lastFeedbackEventId;this.canSendFeedback!==e&&(this.canSendFeedback=e,this.options.onCanSendFeedbackChange({canSendFeedback:e}))},this.onMessage=async function(e){switch(e.type){case"interruption":return e.interruption_event&&(n.lastInterruptTimestamp=e.interruption_event.event_id),void n.fadeOutAudio();case"agent_response":return void n.options.onMessage({source:"ai",message:e.agent_response_event.agent_response});case"user_transcript":return void n.options.onMessage({source:"user",message:e.user_transcription_event.user_transcript});case"internal_tentative_agent_response":return void n.options.onDebug({type:"tentative_agent_response",response:e.tentative_agent_response_internal_event.tentative_agent_response});case"client_tool_call":if(console.info("Received client tool call request",e.client_tool_call),n.options.clientTools.hasOwnProperty(e.client_tool_call.tool_name))try{var r;const l=(r=await n.options.clientTools[e.client_tool_call.tool_name](e.client_tool_call.parameters))!=null?r:"Client tool execution successful.",h=typeof l=="object"?JSON.stringify(l):String(l);n.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:h,is_error:!1})}catch(l){n.onError("Client tool execution failed with following error: "+(l==null?void 0:l.message),{clientToolName:e.client_tool_call.tool_name}),n.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:"Client tool execution failed: "+(l==null?void 0:l.message),is_error:!0})}else{if(n.options.onUnhandledClientToolCall)return void n.options.onUnhandledClientToolCall(e.client_tool_call);n.onError(`Client tool with name ${e.client_tool_call.tool_name} is not defined on client`,{clientToolName:e.client_tool_call.tool_name}),n.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:`Client tool with name ${e.client_tool_call.tool_name} is not defined on client`,is_error:!0})}return;case"audio":return void(n.lastInterruptTimestamp<=e.audio_event.event_id&&(n.options.onAudio(e.audio_event.audio_base_64),n.addAudioBase64Chunk(e.audio_event.audio_base_64),n.currentEventId=e.audio_event.event_id,n.updateCanSendFeedback(),n.updateMode("speaking")));case"ping":return void n.connection.sendMessage({type:"pong",event_id:e.ping_event.event_id});default:return void n.options.onDebug(e)}},this.onInputWorkletMessage=e=>{this.status==="connected"&&this.connection.sendMessage({user_audio_chunk:z(e.data[0].buffer)})},this.onOutputWorkletMessage=({data:e})=>{e.type==="process"&&this.updateMode(e.finished?"listening":"speaking")},this.addAudioBase64Chunk=e=>{this.output.gain.gain.value=this.volume,this.output.worklet.port.postMessage({type:"clearInterrupted"}),this.output.worklet.port.postMessage({type:"buffer",buffer:G(e)})},this.fadeOutAudio=()=>{this.updateMode("listening"),this.output.worklet.port.postMessage({type:"interrupt"}),this.output.gain.gain.exponentialRampToValueAtTime(1e-4,this.output.context.currentTime+2),setTimeout(()=>{this.output.gain.gain.value=this.volume,this.output.worklet.port.postMessage({type:"clearInterrupted"})},2e3)},this.onError=(e,r)=>{console.error(e,r),this.options.onError(e,r)},this.calculateVolume=e=>{if(e.length===0)return 0;let r=0;for(let l=0;l<e.length;l++)r+=e[l]/255;return r/=e.length,r<0?0:r>1?1:r},this.getId=()=>this.connection.conversationId,this.isOpen=()=>this.status==="connected",this.setVolume=({volume:e})=>{this.volume=e},this.setMicMuted=e=>{this.input.setMuted(e)},this.getInputByteFrequencyData=()=>(this.inputFrequencyData!=null||(this.inputFrequencyData=new Uint8Array(this.input.analyser.frequencyBinCount)),this.input.analyser.getByteFrequencyData(this.inputFrequencyData),this.inputFrequencyData),this.getOutputByteFrequencyData=()=>(this.outputFrequencyData!=null||(this.outputFrequencyData=new Uint8Array(this.output.analyser.frequencyBinCount)),this.output.analyser.getByteFrequencyData(this.outputFrequencyData),this.outputFrequencyData),this.getInputVolume=()=>this.calculateVolume(this.getInputByteFrequencyData()),this.getOutputVolume=()=>this.calculateVolume(this.getOutputByteFrequencyData()),this.sendFeedback=e=>{this.canSendFeedback?(this.connection.sendMessage({type:"feedback",score:e?"like":"dislike",event_id:this.currentEventId}),this.lastFeedbackEventId=this.currentEventId,this.updateCanSendFeedback()):console.warn(this.lastFeedbackEventId===0?"Cannot send feedback: the conversation has not started yet.":"Cannot send feedback: feedback has already been sent for the current response.")},this.options=t,this.connection=o,this.input=a,this.output=s,this.options.onConnect({conversationId:o.conversationId}),this.connection.onDisconnect(this.endSessionWithDetails),this.connection.onMessage(this.onMessage),this.input.worklet.port.onmessage=this.onInputWorkletMessage,this.output.worklet.port.onmessage=this.onOutputWorkletMessage,this.updateStatus("connected")}}const f=document.getElementById("startButton"),g=document.getElementById("stopButton"),I=document.getElementById("connectionStatus"),p=document.getElementById("agentStatus"),M=document.getElementById("error-message"),F=document.getElementById("consentModal"),U=document.getElementById("agreeConsentButton"),W=document.getElementById("cancelConsentButton"),w=document.getElementById("connectionIndicator"),c=document.getElementById("statusIcon");let b;function S(i){console.error(i),M.textContent=i,M.classList.remove("hidden"),f.disabled=!1,g.disabled=!0,I.textContent="Error",p.textContent="Ready to Listen",w&&(w.className="w-3 h-3 rounded-full bg-red-500"),c&&(c.className="fas fa-times-circle text-red-600")}function Z(){M.classList.add("hidden"),f.disabled=!0,F?F.classList.add("visible"):(console.error("Consent modal element not found!"),S("Consent dialog could not be displayed."),f.disabled=!1)}function $(){F&&F.classList.remove("visible")}async function ee(){if(p.textContent="Preparing...",M.classList.add("hidden"),c&&(c.className="fas fa-spinner fa-spin text-indigo-600"),typeof E>"u"){S("ElevenLabs 'Conversation' class not loaded. Ensure 'npm install @11labs/client' was run and Vite is bundling correctly."),f.disabled=!1;return}try{await navigator.mediaDevices.getUserMedia({audio:!0}),console.log("Microphone access granted.");const i="QsTTVLzhC1FU3U8fjgrH";console.log(`Starting conversation session with Agent ID: ${i}...`),b=await E.startSession({agentId:i,onConnect:()=>{console.log("Connection established."),I.textContent="Connected",g.disabled=!1,w&&(w.className="w-3 h-3 rounded-full bg-green-500 animate-pulse"),c&&(c.className="fas fa-check-circle text-green-600")},onDisconnect:()=>{console.log("Connection closed."),I.textContent="Awaiting",p.textContent="Ready to Listen",f.disabled=!1,g.disabled=!0,b=null,w&&(w.className="w-3 h-3 rounded-full bg-gray-300"),c&&(c.className="fas fa-circle-notch text-indigo-600")},onError:t=>{S(t.message||"Unknown conversation error."),b&&(b.endSession().catch(o=>console.error("Error ending session:",o)),b=null),f.disabled=!1,g.disabled=!0,I.textContent="Error",p.textContent="Ready"},onModeChange:t=>{console.log(`Agent mode changed: ${t.mode}`),t.mode==="speaking"?(p.textContent="Speaking",c&&(c.className="fas fa-comment-dots text-indigo-600 animate-pulse")):(p.textContent="Listening",c&&(c.className="fas fa-ear-listen text-purple-600"))}}),console.log("Conversation session started successfully.")}catch(i){i.name==="NotAllowedError"||i.name==="PermissionDeniedError"?S("Microphone access denied."):i.message.includes("@11labs/client")||i instanceof TypeError?S("Failed to load or use ElevenLabs client. Ensure install/bundle."):S(`Failed to start conversation: ${i.message}`),f.disabled=!1,g.disabled=!0,p.textContent="Failed"}}async function te(){if(M.classList.add("hidden"),b){console.log("Ending conversation session..."),p.textContent="Closing...",g.disabled=!0,c&&(c.className="fas fa-spinner fa-spin text-gray-600");try{await b.endSession(),console.log("Conversation session ended successfully via button.")}catch(i){S(`Failed to stop conversation: ${i.message}`),f.disabled=!1,g.disabled=!0,I.textContent="Error",p.textContent="Ready",b=null}}else console.log("No active conversation to stop."),f.disabled=!1,g.disabled=!0,I.textContent="Awaiting",p.textContent="Ready to Listen",w&&(w.className="w-3 h-3 rounded-full bg-gray-300"),c&&(c.className="fas fa-circle-notch text-indigo-600")}f.addEventListener("click",Z);g.addEventListener("click",te);U&&U.addEventListener("click",()=>{$(),ee()});W&&W.addEventListener("click",()=>{$(),f.disabled=!1,p.textContent="Ready to Listen"});const V=document.getElementById("year");V?V.textContent=new Date().getFullYear():console.warn("Footer year element not found.");const D=document.querySelector("form");D?D.addEventListener("submit",i=>{i.preventDefault(),alert("Thank you for your interest! We will be in touch shortly."),D.reset()}):console.warn("Contact form not found.");
