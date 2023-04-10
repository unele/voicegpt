const win = document.createElement('div');
const style = document.createElement('style');
win.id = 'interface';
win.innerHTML = `<div id="text"class="text hidden"><span></span></div><div id="speak" class="hidden"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="stroke:var(--darkerColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-mic"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></div><div id="loading" class="hidden"><span class="input text" id="input"></span><svg width="1204" height="1206" viewBox="0 0 1204 1206" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1152.13 603C1181.88 603 1206.25 578.831 1203.6 549.196C1193.99 442.007 1155.83 338.982 1092.64 251.064C1018.94 148.517 914.893 71.6995 795.192 31.4483C675.49 -8.80289 546.172 -10.456 425.481 26.7223C304.79 63.9006 198.817 138.034 122.513 238.663C46.2091 339.293 3.42519 461.34 0.197035 587.586C-3.03112 713.833 33.4594 837.907 104.521 942.304C175.582 1046.7 277.628 1126.15 396.261 1169.45C497.97 1206.57 607.471 1215.51 713.274 1195.83C742.525 1190.39 759.221 1160.4 751.192 1131.75V1131.75C743.162 1103.1 713.441 1086.7 684.09 1091.57C600.147 1105.5 513.703 1097.62 433.202 1068.24C335.766 1032.68 251.954 967.42 193.59 881.677C135.226 795.933 105.256 694.029 107.908 590.34C110.559 486.652 145.698 386.413 208.368 303.764C271.038 221.115 358.075 160.228 457.201 129.693C556.326 99.158 662.538 100.516 760.85 133.575C859.163 166.634 944.616 229.725 1005.15 313.949C1055.17 383.535 1086.09 464.644 1095.33 549.231C1098.56 578.809 1122.37 603 1152.13 603V603Z" style="fill: var(--darkerColor)" /></svg></div><div id="key">Premi spazio</div>`;
style.textContent = `#key,.text{text-align:center}*,::after,::before{box-sizing:border-box;margin:0}:root{--primaryColor:#4aa181;--secondaryColor:#343541;--darkerColor:#24252e;--textColor:#fff}body,html{font-family:system-ui,sans-serif;width:100%;height:100%;background-color:var(--secondaryColor)}#interface{display:flex;justify-content:center;align-items:center}.text{font-size:30px;font-weight:400;color:var(--textColor);display:block;padding:20px}#text strong{color:var(--primaryColor)}#text span{position:relative}#text.cursor span::after{content:'';position:absolute;bottom:0;right:-.3em;height:1.2em;width:5px;background-color:var(--primaryColor);animation:.5s linear infinite alternate cursor}@keyframes cursor{from{opacity:1}to{opacity:0}}#key{background-color:var(--darkerColor);font-size:18px;font-weight:700;width:400px;max-width:95vw;padding:15px;color:#fff;border-radius:4px;opacity:1;transition:.4s}#interface>:not(#text){position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}#key.fade-out{opacity:0}#loading svg,#speak svg{display:block;height:80px}#loading svg{animation:1.5s linear infinite loader}@keyframes loader{from{transform:rotate(0)}to{transform:rotate(360deg)}}#loading .input.text{margin-bottom:20px;font-size:30px;opacity:.7;font-weight:500}.hidden{display:none!important}.tts-ui{position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:#343541;z-index:10}`;

win.classList.add('tts-ui');
document.body.append(style, win);

const textarea = document.querySelector('form textarea');
const button = document.querySelector('form button');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendMessage = (message, callback) => new Promise(async resolve => {
	const groupCount = document.querySelectorAll('.group').length;

	textarea.value = message;
	button.disabled = false;
	button.click();

	await new Promise(resolve => {
		const listener = setInterval(() => {
			if(document.querySelectorAll('.group').length !== groupCount && document.querySelector('.result-streaming'))
				return resolve(clearInterval(listener));
		});
	});

	const responseGroup = [...document.querySelectorAll('.group')].reverse()[0];
	const sentences = [];
	let finished = false;
	while(document.querySelector('.result-streaming') || !finished){
		const parsed = responseGroup.outerText.match(/[^.?!;]+[.?!;]/g);
		await delay(300);
		if(!parsed) continue;
		const newSentences = parsed.map(sentence => sentence.trim()).slice(sentences.length);
		sentences.push(...newSentences);
		if(!newSentences.length){
			finished = true;
			resolve(responseGroup.outerText);
			continue;
		}
		await say(newSentences.join(''), callback);
	}
});


const say = (text, callback = () => {}) => new Promise(resolve => {
  const ttsUtterance = new SpeechSynthesisUtterance();
  ttsUtterance.text = text;

  ttsUtterance.onboundary = event => callback(event.target.text.substring(event.charIndex, event.charIndex + event.charLength));

  ttsUtterance.onend = () => resolve(true);
  window.speechSynthesis.speak(ttsUtterance);
});


const recognize = () => new Promise(resolve => {
	const recognition = new window.webkitSpeechRecognition();
	let output = '';
	recognition.onresult = ({ results }) =>
		output += results[0][0].transcript;
	recognition.onend = () => resolve(output);
	recognition.start();
});


const keyDemonstration = document.getElementById('key');
const speakDemonstration = document.getElementById('speak');
const loading = document.getElementById('loading');
const inputText = document.getElementById('input');
const output = document.getElementById('text');
const outputText = output.querySelector('span');

let done = true;
window.addEventListener('keypress', ({ key }) => {
	if(key !== ' ' || !done) return;
	run();
});

const run = async () => {
	done = false;
	keyDemonstration.classList.add('hidden');
	speakDemonstration.classList.remove('hidden');
	outputText.textContent = '';
	output.classList.add('hidden');

	const input = await recognize();

	speakDemonstration.classList.add('hidden');
	inputText.textContent = input;
	loading.classList.remove('hidden');
	output.classList.add('cursor');

	sendMessage(input, text => {
		loading.classList.add('hidden');
		output.classList.remove('hidden');
		outputText.textContent += text + ' ';
	}).then(() => {
		output.classList.remove('cursor');
		done = true;
		run();
	});
}
