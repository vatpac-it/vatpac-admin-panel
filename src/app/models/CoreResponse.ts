export class CoreResponse {
  request: {result: string, message: string, error: any};
  body: any;


  constructor(res: any) {
    this.request = res.request;
    this.body = res.body;
  }

  success() {
    return this.request.result === 'success';
  };
}
