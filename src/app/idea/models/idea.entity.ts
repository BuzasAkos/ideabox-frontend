
export interface Idea {
    _id: string;
    title: string;
    description?: string;
    voteCount: number;
    votes: Vote[];
    comments: Comment[];
    status: string;
    history?: IdeaHistory[];
    createdBy: string;
    createdAt: Date;
    modifiedBy: string;
    modifiedAt: Date;
    boolId: boolean;
}

export interface Vote {
    id: string;
    createdBy: string;
    createdAt: Date;
    modifiedBy: string;
    modifiedAt: Date;
    boolId: boolean;
}

export interface Comment {
    id: string;
    text: string;
    createdBy: string;
    createdAt: Date;
    modifiedBy: string;
    modifiedAt: Date;
    boolId: boolean;
}

export interface IdeaHistory {
    id: string;
    title?: string;
    description?: string;
    status?: string;
    createdBy: string;
    createdAt: Date;
}
