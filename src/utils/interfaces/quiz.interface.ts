export interface Quiz {
    id: number,
    title: string,
    document_id: number,
    questions: Array<{
        id: number,
        question_text: string,
        correct_option: string,
        options: Array<{id: number, option_text: string}> | string[]
    }>
}


