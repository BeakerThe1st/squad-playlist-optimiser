import fs from 'fs';
import express from 'express';
const server = express();
import {getEnvVar} from "./env";
import {getPlaylistTracks, populateTrackFeatures} from "./spotify";

const getServerPort = () => {
    if (process.env.PORT) {
        return parseInt(process.env.PORT);
    }
    return 3000;
}
export class TokenCache {
    static token: string;
    static expires_at: number;
}
export const fetchAccessToken = async () => {
    if (!TokenCache.token || Date.now() > TokenCache.expires_at) {
        throw new Error("Access Token is undefined or expired");
    }
    return TokenCache.token;
}

//This will be run once our auth flow is complete
const run = async () => {
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

//OAuth 2.0 server stuff below here

server.get('/', async (req, res) => {
    const {code} = req.query as any;
    const body = new URLSearchParams({
        code,
        redirect_uri: `http://localhost:${getServerPort()}/`,
        grant_type: 'authorization_code'
    });
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: [
            ["content-type", "application/x-www-form-urlencoded"],
            ["Authorization", "Basic " + Buffer.from(getEnvVar("CLIENT_ID") + ":" + getEnvVar("CLIENT_SECRET")).toString('base64')],
        ],
        body
    });
    const json = await response.json();
    if (response.status !== 200) {
        res.status(500).send("Error fetching an access token");
        throw new Error(json);
    }
    console.log(json);
    TokenCache.token = json.access_token;
    TokenCache.expires_at = Date.now() + json.expires_at;
    res.status(200).send("Saved access token, you may now close this tab :)");
    //BEGIN
    run();
})

server.listen(getServerPort(), () => {
    const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: getEnvVar("CLIENT_ID"),
        scope: "playlist-read-collaborative playlist-modify-public playlist-modify-private",
        redirect_uri: `http://localhost:${getServerPort()}/`,
    })

    console.log(`https://accounts.spotify.com/authorize?${authParams.toString()}`);
});