
//How good is ts being static!
const TrackFeatureKeys = ["acousticness", "danceability", "duration_ms",
    "energy", "liveness", "loudness", "mode", "speechiness", "tempo", "time_signature",
    "valence"];
interface TrackFeatures {
    acousticness: number,
    danceability: number,
    duration_ms: number,
    energy: number,
    liveness: number,
    loudness: number,
    mode: number,
    speechiness: number,
    tempo: number,
    time_signature: number,
    valence: number,
}

export class Track {
    added_by: string;
    id: string;
    name: string;
    features?: TrackFeatures
    constructor(id: string, name: string, added_by: string) {
        this.id = id;
        this.name = name;
        this.added_by = added_by;
    }

    isGood() {
        const { features } = this;
        if (!features) {
            return false;
        }
        return features.valence > 0.75 && features.speechiness < 0.66 && features.energy > 0.2 && features.danceability > 0.33;
    }

    toString() {
        return `${this.id}: ${this.name} ${this.added_by}`
    }
}