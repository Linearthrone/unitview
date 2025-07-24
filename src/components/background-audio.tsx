
"use client";

import React from 'react';

export default function BackgroundAudio() {
  // Using a key on the audio element that changes with the src 
  // can help ensure React re-renders the component if the src changes dynamically.
  // For a static source, it's not strictly necessary but is good practice.
  const audioKey = "background-music-player";

  return (
    <audio key={audioKey} autoPlay loop>
      <source src="https://www.soundjay.com/buttons/sounds/button-1.mp3" type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}
