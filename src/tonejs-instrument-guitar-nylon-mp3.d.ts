declare module 'tonejs-instrument-guitar-nylon-mp3' {
  import { Sampler } from 'tone';

  interface GuitarNylonOptions {
    minify?: boolean;
    onload?: () => void;
  }

  export default class GuitarNylonMp3 extends Sampler {
    constructor(options?: GuitarNylonOptions);
  }
}
