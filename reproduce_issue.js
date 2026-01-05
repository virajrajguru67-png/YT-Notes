
const url = "https://youtube.com/playlist?list=PLfqMhTWNBTe2C_dQAP1UoemcgAxBTlItp&si=b7N3r8raJCXRfKMr";

// Test Regex (validity check)
const isValidYoutubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|playlist\?list=)|youtu\.be\/|youtube\.com\/embed\/).+/;
    return pattern.test(url);
};

console.log(`URL: ${url}`);
console.log(`IsValid: ${isValidYoutubeUrl(url)}`);

// Test Extraction
const extractPlaylistId = (url) => {
    const match = url.match(/[?&]list=([^#&?]+)/);
    return match ? match[1] : null;
};

const playlistId = extractPlaylistId(url);
console.log(`Extracted Playlist ID: ${playlistId}`);

// Match check against what we expect
if (playlistId === 'PLfqMhTWNBTe2C_dQAP1UoemcgAxBTlItp') {
    console.log("Extraction correct.");
} else {
    console.log("Extraction INCORRECT.");
}
