
// Emergency stop for Web Speech API
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.cancel();
  console.log('Emergency stop: All speech synthesis canceled');
}

