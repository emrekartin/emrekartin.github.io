import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec
} from "./mediabunny-1.65.2.min.mjs";

const $ = (id) => document.getElementById(id);
const fileEl = $("vid-file");
const dropEl = $("vid-drop");
const infoEl = $("vid-info");
const resEl = $("vid-res");
const qualityEl = $("vid-quality");
const targetField = $("vid-target-field");
const targetEl = $("vid-target");
const fpsEl = $("vid-fps");
const audioEl = $("vid-audio");
const runBtn = $("vid-run");
const cancelBtn = $("vid-cancel");
const progressEl = $("vid-progress");
const barEl = progressEl.firstElementChild;
const outEl = $("vid-out");
const errorEl = $("vid-error");
const resultEl = $("vid-result");
const previewEl = $("vid-preview");
const downloadEl = $("vid-download");

const CODEC_NAMES = { avc: "H.264", hevc: "HEVC (H.265)", vp8: "VP8", vp9: "VP9", av1: "AV1" };
const AUDIO_KBPS = 128;

let current = null;
let conversion = null;
let resultUrl = null;

function bytes(n) {
  if (n < 1024 * 1024) return Math.round(n / 1024).toLocaleString("tr-TR") + " KB";
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " MB";
  return (n / 1024 / 1024 / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " GB";
}

function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n) => String(n).padStart(2, "0");
  return h ? h + ":" + pad(m % 60) + ":" + pad(s % 60) : m + ":" + pad(s % 60);
}

function even(n) {
  return Math.max(2, Math.round(n / 2) * 2);
}

function resetResult() {
  resultEl.hidden = true;
  previewEl.removeAttribute("src");
  previewEl.load();
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = null;
}

function syncTarget() {
  targetField.hidden = qualityEl.value !== "target";
}

async function open(file) {
  errorEl.textContent = "";
  outEl.textContent = "";
  resetResult();
  runBtn.disabled = true;
  if (current) current.input.dispose();
  current = null;
  infoEl.textContent = "Video okunuyor…";

  if (!("VideoEncoder" in window)) {
    infoEl.textContent = "";
    errorEl.textContent = "Bu tarayıcıda video kodlayıcı yok. Güncel Chrome, Edge, Firefox veya Safari dene.";
    return;
  }

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error("novideo");
    const audio = await input.getPrimaryAudioTrack();
    const duration = await input.computeDuration();
    const stats = await video.computePacketStats(120);
    const canDecode = await video.canDecode();
    current = {
      file,
      input,
      width: video.displayWidth,
      height: video.displayHeight,
      codec: video.codec,
      fps: stats.averagePacketRate,
      hasAudio: !!audio,
      duration
    };
    const parts = [
      file.name,
      bytes(file.size),
      clock(duration),
      current.width + "×" + current.height,
      Math.round(current.fps) + " fps",
      CODEC_NAMES[current.codec] || current.codec || "bilinmeyen kodek",
      audio ? "sesli" : "sessiz"
    ];
    infoEl.textContent = parts.join(" · ");
    limitOptions();
    if (!canDecode) {
      errorEl.textContent = current.codec === "hevc"
        ? "Bu tarayıcı HEVC videoyu açamıyor. iPhone videolarında sık olur. Safari veya Edge'de dene ya da telefonda \"En Uyumlu\" ayarıyla çek."
        : "Bu tarayıcı bu videonun kodlamasını açamıyor.";
      return;
    }
    runBtn.disabled = false;
  } catch (e) {
    input.dispose();
    infoEl.textContent = "";
    errorEl.textContent = "Bu dosya video olarak okunamadı.";
  }
}

function limitOptions() {
  const short = Math.min(current.width, current.height);
  Array.from(resEl.options).forEach((opt) => {
    const v = Number(opt.value);
    opt.disabled = v > 0 && v >= short;
  });
  if (resEl.selectedOptions[0].disabled) resEl.value = "0";
  Array.from(fpsEl.options).forEach((opt) => {
    const v = Number(opt.value);
    opt.disabled = v > 0 && v >= Math.round(current.fps) - 1;
  });
  if (fpsEl.selectedOptions[0].disabled) fpsEl.value = "0";
  audioEl.disabled = !current.hasAudio;
}

function size() {
  const target = Number(resEl.value);
  const short = Math.min(current.width, current.height);
  if (!target || target >= short) return null;
  const scale = target / short;
  return { width: even(current.width * scale), height: even(current.height * scale) };
}

function videoQuality(withAudio) {
  if (qualityEl.value !== "target") return new Quality(qualityEl.value);
  const mb = Number(targetEl.value);
  if (!(mb > 0)) throw new Error("Hedef boyutu yaz.");
  const total = (mb * 1000 * 1000 * 8 * 0.92) / current.duration;
  const bitrate = Math.floor(total - (withAudio ? AUDIO_KBPS * 1000 : 0));
  if (bitrate < 150000) throw new Error("Bu süre için hedef çok küçük. Daha büyük bir boyut seç ya da sesi kapat.");
  return new Quality({ bitrate });
}

async function run() {
  if (!current) return;
  errorEl.textContent = "";
  outEl.textContent = "";
  resetResult();
  const withAudio = current.hasAudio && audioEl.value === "keep";
  let quality;
  try {
    quality = videoQuality(withAudio);
  } catch (e) {
    errorEl.textContent = e.message;
    return;
  }

  const fresh = new Input({ source: new BlobSource(current.file), formats: ALL_FORMATS });
  const dims = size();
  const encodeOpts = dims ? { width: dims.width, height: dims.height } : { width: current.width, height: current.height };
  const videoCodec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], encodeOpts);
  if (!videoCodec) {
    errorEl.textContent = "Bu tarayıcı video kodlayamıyor.";
    return;
  }
  const audioCodec = withAudio ? await getFirstEncodableAudioCodec(["aac", "opus"]) : null;

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const videoOpts = { codec: videoCodec, quality, forceTranscode: true };
  if (dims) {
    videoOpts.width = dims.width;
    videoOpts.height = dims.height;
    videoOpts.fit = "fill";
  }
  const fps = Number(fpsEl.value);
  if (fps) videoOpts.frameRate = fps;

  const audioOpts = withAudio
    ? (qualityEl.value === "target"
      ? { codec: audioCodec || undefined, quality: new Quality({ bitrate: AUDIO_KBPS * 1000 }), forceTranscode: true }
      : { codec: audioCodec || undefined })
    : { discard: true };

  try {
    conversion = await Conversion.init({ input: fresh, output, video: videoOpts, audio: audioOpts, showWarnings: false });
  } catch (e) {
    fresh.dispose();
    errorEl.textContent = "Dönüştürme başlatılamadı.";
    return;
  }
  if (!conversion.isValid) {
    fresh.dispose();
    errorEl.textContent = "Bu video bu tarayıcıda dönüştürülemiyor.";
    conversion = null;
    return;
  }

  const started = performance.now();
  progressEl.hidden = false;
  barEl.style.width = "0%";
  runBtn.disabled = true;
  cancelBtn.hidden = false;
  fileEl.disabled = true;
  conversion.onProgress = (p) => {
    barEl.style.width = (p * 100).toFixed(1) + "%";
    const spent = (performance.now() - started) / 1000;
    const left = p > 0.03 ? spent / p - spent : null;
    outEl.textContent = "%" + Math.round(p * 100) + (left !== null ? " · yaklaşık " + clock(left) + " kaldı" : "");
  };

  try {
    await conversion.execute();
    const blob = new Blob([output.target.buffer], { type: "video/mp4" });
    const spent = (performance.now() - started) / 1000;
    const change = Math.round((1 - blob.size / current.file.size) * 100);
    resultUrl = URL.createObjectURL(blob);
    previewEl.src = resultUrl;
    downloadEl.href = resultUrl;
    downloadEl.download = current.file.name.replace(/\.[^.]+$/, "") + "-kucuk.mp4";
    resultEl.hidden = false;
    const notes = [];
    if (videoCodec !== "avc") notes.push(videoCodec.toUpperCase() + " kullanıldı; bazı oynatıcılar açmayabilir.");
    if (audioCodec === "opus") notes.push("Ses Opus; iPhone'un eski sürümleri çalmayabilir.");
    outEl.textContent = bytes(current.file.size) + " → " + bytes(blob.size) +
      (change > 0 ? " (−%" + change + ")" : " (+%" + -change + ")") +
      " · " + (dims ? dims.width + "×" + dims.height : current.width + "×" + current.height) +
      " · " + clock(spent) + " sürdü" + (notes.length ? " · " + notes.join(" ") : "");
    if (change <= 0) errorEl.textContent = "Dosya küçülmedi. Daha düşük çözünürlük veya \"Küçük dosya\" seç.";
  } catch (e) {
    if (conversion && conversion.state === "canceled") outEl.textContent = "Durduruldu.";
    else errorEl.textContent = "Dönüştürme yarıda kaldı. Daha düşük çözünürlük dene.";
  } finally {
    fresh.dispose();
    conversion = null;
    progressEl.hidden = true;
    cancelBtn.hidden = true;
    runBtn.disabled = false;
    fileEl.disabled = false;
  }
}

fileEl.addEventListener("change", () => {
  if (fileEl.files[0]) open(fileEl.files[0]);
  fileEl.value = "";
});

["dragenter", "dragover"].forEach((type) => {
  dropEl.addEventListener(type, (e) => {
    e.preventDefault();
    dropEl.classList.add("over");
  });
});
["dragleave", "drop"].forEach((type) => {
  dropEl.addEventListener(type, (e) => {
    e.preventDefault();
    dropEl.classList.remove("over");
  });
});
dropEl.addEventListener("drop", (e) => {
  if (conversion) return;
  const file = e.dataTransfer && e.dataTransfer.files[0];
  if (file) open(file);
});

qualityEl.addEventListener("change", syncTarget);
targetEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!runBtn.disabled) run();
  }
});
runBtn.addEventListener("click", run);
cancelBtn.addEventListener("click", () => {
  if (conversion) conversion.cancel();
});
window.addEventListener("beforeunload", (e) => {
  if (conversion) e.preventDefault();
});

syncTarget();
