import {BASE_URL, PLAYLIST_ID} from "./globals";
import {fetchAccessToken} from "./index";
import {Track} from "./Track";
import { userMap } from './userMap';

const getAuthHeader = async (): Promise<[string, string]> => ["Authorization", `Bearer ${await fetchAccessToken()}`];
export const getPlaylistTracks = async () => {
    const tracks: Track[] = [];
    let offset = 0;
    while (true) {
        const params = new URLSearchParams({
            limit: "50",
            offset: `${offset}`,
            fields: "items(added_by.id,track(name,id,uri))",
        });
        const res = await fetch(`${BASE_URL}/playlists/${PLAYLIST_ID}/tracks?${params.toString()}`, {
            headers: [await getAuthHeader()],
        });
        const json = await res.json();
        if (json.items.length < 1) {
            break;
        }
        for (const item of json.items) {
            tracks.push(new Track(item.track.id, item.track.name, item.added_by.id, item.track.uri));
        }
        console.log(`Fetching tracks [${offset}, ${offset + json.items.length - 1}]`);
        offset += 50;
    }
    return tracks;
}

export const populateTrackFeatures = async (tracks: Track[]) => {
    for (let i = 0; i < tracks.length; i += 100) {
        const slice = tracks.slice(i, i + 100);
        const joinedIds = (slice.map((track) => track.id)).join(',');
        const params = new URLSearchParams({ids: joinedIds});
        const res = await fetch(`${BASE_URL}/audio-features?${params.toString()}`, {headers: [await getAuthHeader()]});
        const json = await res.json();
        console.log(`Populating features for fetched tracks [${i}, ${i + slice.length - 1}]`);
        for (let j = 0; j < 100; j++) {
            if (!slice[j]) {
                continue;
            }
            slice[j].features = json.audio_features[j];
        }
    }
    return tracks;
}

export const getUserId = async () => {
    const response = await fetch(`${BASE_URL}/me`, {
        headers: [await getAuthHeader()],
    });
    const json = await response.json();
    return json.id;
};

export const createPlaylist = async (tracks: Track[]) => {
    /*const response = await fetch(`${BASE_URL}/users/${await getUserId()}/playlists`, {
        method: "POST",
        headers: [await getAuthHeader()],
        body: JSON.stringify({
            name: "Optimised Playlist",
            public: false,
            collaborative: false,
            description: `Optimised playlist as at ${new Date().toLocaleString()}`,
        }),
    });
    const json = await response.json();
    const {id} = json;*/
    const id = "4q6yLuYQgIXsjAjM18Jr3C";
    console.log(`Optimised playlist id: ${id}`);
    console.log(`Grouping fetched tracks by who added them...`);
    const tracksByAddedBy = new Map<string, Track[]>;
    for (const track of tracks) {
        const value = tracksByAddedBy.get(track.added_by) ?? [(userMap.get(track.added_by)?.headerTrack) ?? new Track("1V8nT86qgiQ1glQ916UIk7", "The Poop Song", "group", "spotify:track:1V8nT86qgiQ1glQ916UIk7")];
        value.push(track);
        tracksByAddedBy.set(track.added_by, value);
    }
    const groupedTracks: Track[] = [];
    for (const [, value] of tracksByAddedBy) {
        for (const track of value) {
            groupedTracks.push(track);
        }
    }
    tracks = groupedTracks;
    const uris = tracks.map((track) => track.uri);
    for (let i = 0; i < uris.length; i += 100) {
        const slice = uris.slice(i, i + 100);
        console.log(`Adding tracks [${i}, ${i + slice.length - 1}] to optimised playlist`);
        await fetch(`${BASE_URL}/playlists/${id}/tracks`,
            {
                method: "POST",
                headers: [await getAuthHeader()],
                body: JSON.stringify({uris: slice}),
            },
        );
    }
    console.log(`Tracks added to optimised playlist`);
    return `https://open.spotify.com/playlist/${id}`
};