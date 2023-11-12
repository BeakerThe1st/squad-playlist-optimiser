import {BASE_URL, PLAYLIST_ID} from "./globals";
import {fetchAccessToken} from "./index";
import {Track} from "./Track";
export const getPlaylistTracks = async () => {
    const tracks: Track[] = [];
    let offset = 0;
    while (true) {
        const params = new URLSearchParams({
            limit: "50",
            offset: `${offset}`,
            fields: "items(added_by.id,track(name,id))",
        })
        const res = await fetch(`${BASE_URL}/playlists/${PLAYLIST_ID}/tracks?${params.toString()}`, {
            headers: [["Authorization", `Bearer ${await fetchAccessToken()}`]],
        })
        const json = await res.json();
        if (json.items.length < 1) {
            break;
        }
        for (const item of json.items) {
            tracks.push(new Track(item.track.id, item.track.name, item.added_by.id));
        }
        console.log(`Adding tracks [${offset}, ${offset + json.items.length - 1}]`);
        offset += 50;
    }


    return tracks;
}

export const populateTrackFeatures = async (tracks: Track[]) => {
    for (let i = 0; i < tracks.length; i += 100) {
        const slice = tracks.slice(i, i + 100);
        const joinedIds = (slice.map((track) => track.id)).join(',');
        const params = new URLSearchParams({ids: joinedIds})
        const res = await fetch(`${BASE_URL}/audio-features?${params.toString()}`, {headers: [["Authorization", `Bearer ${await fetchAccessToken()}`]]})
        const json = await res.json();
        console.log(`Populating features for tracks [${i}, ${i + slice.length - 1}]`);
        for (let j = 0; j < 100; j++) {
            if (!slice[j]) {
                continue;
            }
            slice[j].features = json.audio_features[j];
        }
    }
    return tracks;
}