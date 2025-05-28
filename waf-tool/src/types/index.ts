export interface Request {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, any>;
    query: Record<string, string>;
}

export interface Response {
    status: (code: number) => Response;
    json: (data: any) => void;
    send: (data: string) => void;
}