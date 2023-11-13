import {Track} from "./Track";

export class User {
    id: string;
    name: string;
    headerTrack: Track;
    constructor(id: string, name: string, headerTrack: Track) {
        this.id = id;
        this.name = name;
        this.headerTrack = headerTrack;
    }
}

