export interface ChatResponseDto {  
    id: string;
    chatMessages: ChatMessage[];
}

export interface ChatMessage {
    id: string;
    role: string;
    text: string;
    createdAt: Date;
}