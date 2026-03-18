export interface DocumentResponse {
    status: string,
    message: string,
    saveDocument?: {
        id?: number,
        name?: string,
        filename?: string,
    }
}

export interface DocumentR {
    id: number,
    title?: string,
    content: string,
    file_path?: string,
    user_id: number
}