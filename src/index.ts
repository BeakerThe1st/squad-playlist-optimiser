import fs from 'fs';
import {getEnvVar} from "./env";
import {getPlaylistTracks, populateTrackFeatures} from "./spotify";
export class TokenCache {
    static token: string;
    static expires_at: number;
}
export const fetchAccessToken = async () => {
    if (!TokenCache.token || Date.now() > TokenCache.expires_at) {
        const body = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: getEnvVar("CLIENT_ID"),
            client_secret: getEnvVar("CLIENT_SECRET"),
        });
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: [["Content-Type", "application/x-www-form-urlencoded"]],
            body
        })
        const json = await res.json();
        TokenCache.token = json.access_token;
        TokenCache.expires_at = Date.now() + json.expires_in * 1000;
    }
    return TokenCache.token;
}

const start = async () => {
    const playlistTracks = await getPlaylistTracks();
    const populated = await populateTrackFeatures(playlistTracks);
    const goodSongs = [];
    console.log(`Analysing tracks...`);
    for (const track of populated) {
        if (track.isGood()) {
            goodSongs.push(`${track.name} added by ${track.added_by}`);
        }
    }
    console.log(`Selected ${goodSongs.length} tracks, writing them to goodsongs.json`);
    fs.writeFileSync('./goodsongs.json', JSON.stringify(goodSongs, null, 2));
    console.log (`done :)`);
}

start();