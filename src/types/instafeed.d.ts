declare module 'instafeed.js' {
  interface InstafeedOptions {
    accessToken: string;
    target: string | HTMLElement;
    template?: string;
    transform?: (item: any) => any;
    success?: (result: any) => void;
    error?: (error: Error) => void;
    limit?: number;
    [key: string]: any;
  }

  class Instafeed {
    constructor(options: InstafeedOptions);
    run(): void;
  }

  export default Instafeed;
}
