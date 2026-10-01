const Album = require("../models/Albums");
const Post = require("../models/Post");

//this will be where get auto updated, removal is but of a difficulity
//don't know if I'll add a auto delete
function updateHashtagsForAlbum({album, hashtags}){
    hashtags.forEach(item => {
    if (!album.includes(item)) {
        album.push(item);
    }
});

return album;
}

const syncAlbumHashtags = async (album) => {
    // Find all posts currently in the album
    const posts = await Post.find({ _id: { $in: album.postId } });
    
    // Combine all hashtags and remove duplicates using Set
    const allTags = posts.flatMap(p => p.hashtags || []);
    album.hashtags = [...new Set(allTags)];
};

module.exports = {
    updateHashtagsForAlbum,
    syncAlbumHashtags
};